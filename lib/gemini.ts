import {
  GoogleGenAI,
  type GenerateContentParameters,
  type GenerateContentResponse,
  type ThinkingLevel,
} from '@google/genai';

/**
 * 图像模型默认值。
 * Google 官方稳定版 ID 就是 `gemini-3.1-flash-image`（Nano Banana 2），
 * 与 Antigravity 反代上已验证可用的 ID 相同，因此默认值两边都能用。
 */
export const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image';

/**
 * 自由创作使用的增强图像模型。
 * 代码里原来写的 `gemini-3-pro-image-preview` 已于 2026-06-25 下线，
 * 官方 GA ID 是 `gemini-3-pro-image`。反代使用同一个 ID，但当前没有可用账号（503），
 * 指向反代时请把 GEMINI_IMAGE_PRO_MODEL 设为 `gemini-3.1-flash-image`。
 */
export const DEFAULT_GEMINI_IMAGE_PRO_MODEL = 'gemini-3-pro-image';

/**
 * 提示词增强使用的文本模型。
 * 官方文档当前 ID 仍是 `gemini-3-flash-preview`。
 * 反代的 ID 没有 `-preview` 后缀（`gemini-3-flash`），指向反代时需要覆盖。
 */
export const DEFAULT_GEMINI_TEXT_MODEL = 'gemini-3-flash-preview';

/**
 * gemini-3.1-flash-image 只接受 thinkingLevel `MINIMAL` 或 `HIGH`（官方默认 MINIMAL）。
 * 不能再用 thinkingBudget：和 thinkingLevel 一起送会 400，单独设 0 也不是这个模型的关闭方式。
 * MINIMAL 是两边都能接受的最低档。设成 off / omit / none 则不传 thinkingConfig。
 */
export const DEFAULT_GEMINI_IMAGE_THINKING_LEVEL = 'MINIMAL';

function envOrDefault(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value || fallback;
}

export function geminiImageModel(): string {
  return envOrDefault('GEMINI_IMAGE_MODEL', DEFAULT_GEMINI_IMAGE_MODEL);
}

export function geminiImageProModel(): string {
  return envOrDefault('GEMINI_IMAGE_PRO_MODEL', DEFAULT_GEMINI_IMAGE_PRO_MODEL);
}

export function geminiTextModel(): string {
  return envOrDefault('GEMINI_TEXT_MODEL', DEFAULT_GEMINI_TEXT_MODEL);
}

export function imageThinkingConfig():
  | { includeThoughts: boolean; thinkingLevel: ThinkingLevel }
  | undefined {
  const level = envOrDefault(
    'GEMINI_IMAGE_THINKING_LEVEL',
    DEFAULT_GEMINI_IMAGE_THINKING_LEVEL,
  );
  if (level.toLowerCase() === 'off' || level.toLowerCase() === 'omit' || level.toLowerCase() === 'none') {
    return undefined;
  }

  const includeRaw = process.env.GEMINI_IMAGE_INCLUDE_THOUGHTS?.trim().toLowerCase();
  const includeThoughts = includeRaw === '1' || includeRaw === 'true' || includeRaw === 'yes';

  return {
    includeThoughts,
    // SDK 1.30 的枚举还没有 MINIMAL，但 REST 会原样转发该字符串。
    thinkingLevel: level.toUpperCase() as ThinkingLevel,
  };
}

/**
 * 规范化 GEMINI_BASE_URL。
 * SDK 会在 baseUrl 后拼接 `/v1beta/models/<model>:generateContent`，
 * 因此这里去掉末尾斜杠以及误加的 `/v1`、`/v1beta`。
 * 未设置时返回 undefined，调用方不传 httpOptions，行为与直连官方 API 相同。
 */
export function resolveGeminiBaseUrl(): string | undefined {
  const raw = process.env.GEMINI_BASE_URL?.trim();
  if (!raw) return undefined;
  return normalizeGeminiBaseUrl(raw);
}

export function normalizeGeminiBaseUrl(raw: string): string {
  const value = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('GEMINI_BASE_URL is not a valid URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('GEMINI_BASE_URL must use http or https');
  }

  let path = parsed.pathname.replace(/\/+$/, '');
  path = path.replace(/\/v1beta$/i, '').replace(/\/v1$/i, '');
  path = path.replace(/\/+$/, '');
  parsed.pathname = path;
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/+$/, '');
}

export function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const baseUrl = resolveGeminiBaseUrl();
  if (!baseUrl) {
    return new GoogleGenAI({ apiKey });
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: { baseUrl },
  });
}

/** 图像请求需要同时要文本和图片，并压到最低思考档，避免草稿图把响应拖到几十秒。 */
export function imageGenerationConfig(extra?: {
  imageConfig?: { aspectRatio?: string; imageSize?: string };
}) {
  const thinkingConfig = imageThinkingConfig();
  return {
    responseModalities: ['TEXT', 'IMAGE'],
    ...(thinkingConfig ? { thinkingConfig } : {}),
    ...extra,
  };
}

type ResponsePart = {
  thought?: boolean;
  text?: string;
  inlineData?: { data?: string };
};

/**
 * 取最终成图。反代会先返回 thought:true 的草稿图，再返回未标记的成图。
 * 只用最后一张非思考图；全是草稿图或没有图时抛错。
 */
export function extractFinalImageBase64(parts: ResponsePart[] | undefined): string {
  if (!parts || parts.length === 0) {
    throw new Error('No content generated');
  }

  const imageParts = parts.filter(
    (part) => typeof part.inlineData?.data === 'string' && part.inlineData.data.length > 0,
  );
  const finals = imageParts.filter((part) => part.thought !== true);
  const finalImage = finals[finals.length - 1];
  if (finalImage?.inlineData?.data) {
    return finalImage.inlineData.data;
  }

  if (imageParts.length > 0) {
    throw new Error('Response contained only draft thought images');
  }
  throw new Error('No image data found in response');
}

/**
 * 取最终回答文本。
 * - 跳过 `thought: true` 的思考片段（官方 thinking 摘要）。
 * - 若仍有多个文本片段，只用最后一个。Antigravity 上的 `gemini-3-flash`
 *   会先返回一段英文草稿/思考，再返回最终中文答案，且草稿不一定带 thought 标记。
 *   拼接或取第一段都会把草稿写进提示词。
 * - 只有一个非思考文本片段时，结果与原来取 `parts[0].text` 相同。
 */
export function extractFinalText(response: GenerateContentResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const answers = parts.filter(
    (part) => part.thought !== true && typeof part.text === 'string' && part.text.trim() !== '',
  );

  const finalPart = answers[answers.length - 1];
  if (finalPart?.text) {
    return finalPart.text.trim();
  }

  throw new Error('No text generated');
}

const TRANSIENT_MESSAGE = /got status: 5\d\d/;

/** Cloudflare 隧道 530、连接中断等可重试失败。有数字 status 时只看是否 >= 500。 */
export function isTransientGeminiError(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  if (typeof status === 'number') {
    return status >= 500;
  }

  const message = String((error as { message?: unknown } | null)?.message ?? '').toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('terminated') ||
    message.includes('socket') ||
    message.includes('econnreset') ||
    message.includes('und_err') ||
    TRANSIENT_MESSAGE.test(message)
  );
}

/**
 * 调用 generateContent。瞬时错误等待 2 秒后再试一次（默认 retries = 1）。
 */
export async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: GenerateContentParameters,
  retries = 1,
): Promise<GenerateContentResponse> {
  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      return await ai.models.generateContent(params);
    } catch (error) {
      const status = (error as { status?: unknown } | null)?.status;
      const transient = isTransientGeminiError(error);
      const message = String((error as { message?: unknown } | null)?.message ?? '').slice(0, 500);
      console.error(
        `[gemini] generateContent failed attempt=${attempt} model=${String(params.model)} status=${String(status)} transient=${transient} message=${message}`,
      );
      if (!transient || attempt > retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
