import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';

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

/** 图像请求需要同时要文本和图片，与官方图像模型和反代的已验证调用一致。 */
export function imageGenerationConfig(extra?: {
  imageConfig?: { aspectRatio?: string; imageSize?: string };
}) {
  return {
    responseModalities: ['TEXT', 'IMAGE'],
    ...extra,
  };
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
