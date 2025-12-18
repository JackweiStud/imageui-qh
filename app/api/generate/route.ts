/**
 * 后端 API Route - Gemini AI 代理
 * 所有 AI 调用都通过此接口，API Key 仅在服务端使用，完全保护
 */

// 设置全局代理（用于访问 Google API）
import { ProxyAgent, setGlobalDispatcher } from 'undici';
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}


import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import {
  GenerateRequest,
  GenerateResponse,
  ERROR_CODES,
  ImageConfig,
  AspectRatio,
  TryOnMode
} from '@/lib/types';

// ==================== 工具函数 ====================

// 获取 AI 客户端 (服务端专用)
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new GoogleGenAI({ apiKey });
};

// 获取 Supabase Admin 客户端 (用于扣除积分 & 上传结果，绕过 RLS)
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    throw new Error('Server Configuration Error: SUPABASE_SERVICE_ROLE_KEY is missing.');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// 1. 检查积分（不扣除）
const checkCredits = async (supabase: any, userId: string, cost: number = 10): Promise<{ success: boolean; error?: string; remainingCredits?: number }> => {
  // 强制检查，不再允许跳过
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      // 未找用户，尝试初始化，给予默认积分
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId, email: '', credits: 35 });

      if (!insertError) return { success: true, remainingCredits: 35 };
    }
    return { success: false, error: 'User profile error' };
  }

  const currentCredits = profile?.credits ?? 0;
  if (currentCredits < cost) {
    return {
      success: false,
      error: ERROR_CODES.INSUFFICIENT_CREDITS,
      remainingCredits: currentCredits
    };
  }

  return { success: true, remainingCredits: currentCredits };
};

// 2. 扣除积分（生成成功后调用）- 使用原子 RPC 函数解决并发问题
const deductCredits = async (supabase: any, userId: string, cost: number = 10): Promise<void> => {

  // 使用数据库 RPC 函数实现原子操作，解决并发竞态条件
  const { error } = await supabase.rpc('deduct_credits', {
    user_id: userId,
    amount: cost
  });

  if (error) {
    console.error('Error deducting credits via RPC:', error);
    // RPC 函数会在积分不足时静默失败（WHERE credits >= amount）
    // 这里可以选择记录日志或抛出错误
    // 由于我们已经在前置检查中验证了积分，这里通常不会失败
  }
};

// 3. 保存生成记录到数据库 (用于网络错误恢复)
// 注意：sourceImage/sourceImages 可能是 Signed URL
// 我们需要提取 storage path 存储，而不是存储会过期的 Signed URL
const saveGenerationRecord = async (
  supabase: any,
  userId: string,
  resultUrl: string,
  request: GenerateRequest
): Promise<void> => {
  try {
    // 辅助函数：从 Signed URL 提取 storage path
    const extractStoragePath = (url: string): string | null => {
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.pathname.includes('/storage/v1/object/sign/raw_uploads/')) {
          const match = parsedUrl.pathname.match(/\/raw_uploads\/(.+)$/);
          if (match) {
            return `raw_uploads/${match[1]}`;
          }
        }
      } catch {
        console.log('[saveGenerationRecord] Failed to parse source image URL');
      }
      return null;
    };

    // 处理多图（sourceImages）或单图（sourceImage）
    let originalStoragePaths: string[] = [];

    if (request.sourceImages && request.sourceImages.length > 0) {
      // Multi-image mode: extract paths from all images
      originalStoragePaths = request.sourceImages
        .map(url => extractStoragePath(url))
        .filter((path): path is string => path !== null);
    } else if (request.sourceImage) {
      // Single image mode (backward compat)
      const path = extractStoragePath(request.sourceImage);
      if (path) {
        originalStoragePaths = [path];
      }
    }

    const { error } = await supabase.from('generations').insert({
      user_id: userId,
      result_image_url: resultUrl,
      // 存储第一张图 (向后兼容)
      original_image_url: originalStoragePaths.length > 0 ? originalStoragePaths[0] : null,
      // 存储所有图片路径 (新字段，如果 DB 支持的话存入 generation_params)
      app_mode: request.action,
      generation_params: {
        promptModifier: request.promptModifier,
        customPrompt: request.customPrompt,
        referenceImageUrl: request.referenceImageUrl,
        imageConfig: request.imageConfig,
        tryOnMode: request.tryOnMode,
        // 多图路径存储在 generation_params 中
        originalImagePaths: originalStoragePaths.length > 1 ? originalStoragePaths : undefined,
      },
    });

    if (error) {
      // 记录失败不影响主流程，只打日志
      console.error('Failed to save generation record:', error);
    }
  } catch (err) {
    console.error('Error saving generation record:', err);
  }
};

// 创建带错误码的响应
const createErrorResponse = (code: string, message?: string): GenerateResponse => ({
  success: false,
  error: message || code,
  errorCode: code,
});

// 解析 API 错误
const parseApiError = (error: any): { code: string; message: string } => {
  const message = error?.message || '';
  const status = error?.status || error?.response?.status;

  if (status === 413 || message.includes('413') || message.includes('too large')) {
    return { code: ERROR_CODES.PAYLOAD_TOO_LARGE, message };
  }
  if (status === 429 || message.includes('429') || message.includes('quota') || message.includes('rate limit')) {
    return { code: ERROR_CODES.QUOTA_EXCEEDED, message };
  }
  if (error?.name === 'TypeError' || message.includes('Failed to fetch') || message.includes('network')) {
    return { code: ERROR_CODES.NETWORK_ERROR, message };
  }
  return { code: ERROR_CODES.UNKNOWN, message };
};

// 从响应中提取 Base64 数据（Raw）
const extractBase64FromResponse = (response: any): string => {
  if (response.promptFeedback?.blockReason) {
    throw { code: ERROR_CODES.SAFETY_BLOCKED, message: response.promptFeedback.blockReason };
  }

  const candidate = response.candidates?.[0];
  if (candidate?.finishReason === 'SAFETY') {
    throw { code: ERROR_CODES.SAFETY_BLOCKED, message: 'Content filtered by safety policy' };
  }

  const parts = candidate?.content?.parts;
  if (!parts) {
    throw { code: ERROR_CODES.NO_IMAGE_DATA, message: 'No content generated' };
  }

  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      return part.inlineData.data;
    }
  }

  throw { code: ERROR_CODES.NO_IMAGE_DATA, message: 'No image data found in response' };
};

// 辅助：下载 URL 并转为 Base64 (供 Gemini 输入) - 增加 SSRF 防护
const fetchAndConvertToBase64 = async (url: string): Promise<string> => {
  // 1. 处理本地预设图片路径 (如 /images/presets/beach-vacation.png)
  if (url.startsWith('/images/presets/')) {
    // 方案A: 使用 fs 直接读取本地文件 (本地开发/部分 Vercel 场景)
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'public', url);
      console.log(`[Preset] Attempting to read local file: ${filePath}`);
      const buffer = await fs.readFile(filePath);
      console.log(`[Preset] Successfully read local file: ${url}`);
      return buffer.toString('base64');
    } catch (fsError: any) {
      console.log(`[Preset] fs.readFile failed: ${fsError.message}`);
    }

    // 方案B (Fallback): 通过 HTTP 从自身域名获取
    // Vercel 提供多个 URL 环境变量，按优先级尝试
    const baseUrl =
      process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` :
        process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` :
          process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
            process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const fullUrl = `${baseUrl}${url}`;
    console.log(`[Preset] Attempting HTTP fetch: ${fullUrl}`);

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        console.error(`[Preset] HTTP fetch failed with status: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      console.log(`[Preset] Successfully fetched via HTTP: ${fullUrl} (${arrayBuffer.byteLength} bytes)`);
      return Buffer.from(arrayBuffer).toString('base64');
    } catch (fetchError: any) {
      console.error(`[Preset] HTTP fetch failed: ${fetchError.message}`);
      console.error(`[Preset] Environment vars: VERCEL_URL=${process.env.VERCEL_URL}, VERCEL_PROJECT_PRODUCTION_URL=${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
      throw new Error(`Could not load preset image: ${url}`);
    }
  }

  // 2. 处理 Supabase URL (原有逻辑 + SSRF 防护)
  try {
    const parsedUrl = new URL(url);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    // SSRF 防护：仅允许来自我们自己的 Supabase 项目的 URL
    if (supabaseUrl) {
      const allowedHost = new URL(supabaseUrl).host;
      if (parsedUrl.host !== allowedHost && !parsedUrl.host.endsWith('.supabase.co')) {
        console.error(`Blocked suspicious URL: ${url}`);
        throw new Error('Security Error: Unauthorized image source');
      }
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (error) {
    console.error('Fetch Image Error:', error);
    throw new Error('Could not download source image');
  }
};

// 辅助：处理结果上传
// 1. 提取 Base64
// 2. 转 Buffer
// 3. 上传到 'generated_results'
// 4. 返回 Signed URL (因为我们设了 private)
// 注意：对于生成结果，我们可以设为 Public Bucket 方便展示，或者用 Signed URL。
// 之前的 SQL 设置是 private。这里我们生成一个长效 Signed URL (如 10 年) 或者 1 天（前端需及时自行转存 IDB，或后续我们有 Database 记录 URL）
// 更好的方案：生成后应该存 DB 记录 URL。API 返回 URL。
const processAndUploadResult = async (response: any, userId: string): Promise<string> => {
  // 1. Extract
  const base64Data = extractBase64FromResponse(response);

  // 2. Convert to Buffer
  const buffer = Buffer.from(base64Data, 'base64');

  // 3. Upload
  const supabase = getSupabaseAdmin();
  const filename = `${userId}/${Date.now()}_result.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('generated_results')
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (uploadError) {
    console.error('Upload Result Error:', uploadError);
    // Fallback: 如果上传失败，暂时返回 Base64 (虽然前端可能不预期，但总比失败好? 不，前端改了逻辑预期 URL)
    // 还是抛错吧
    throw new Error('Failed to save generated image');
  }

  // 4. Create Signed URL (e.g. 7 days)
  // 如果 Bucket 是 public 的，可以直接 getPublicUrl
  // SQL 设置是 public: false
  // 这里给 1 天有效期，足够前端展示和下载。实际商业项目应配合 DB 记录，每次访问生成新 Signed URL
  const { data } = await supabase.storage
    .from('generated_results')
    .createSignedUrl(filename, 60 * 60 * 24); // 24 hours

  if (!data?.signedUrl) {
    throw new Error('Failed to get result URL');
  }

  return data.signedUrl;
};

// 宽高比映射
const mapAspectRatio = (ratio: AspectRatio): string | undefined => {
  const mapping: Record<AspectRatio, string | undefined> = {
    'original': undefined,
    '1:1': '1:1',
    '3:4': '3:4',
    '9:16': '9:16',
    '16:9': '16:9',
    '21:9': '21:9',
  };
  return mapping[ratio];
};


// ==================== AI 生成函数 (Refactored) ====================

// 1. 风格转换
async function generateStyleTransform(sourceUrl: string, promptModifier: string, userId: string): Promise<string> {
  const ai = getAiClient();
  const imageBase64 = await fetchAndConvertToBase64(sourceUrl);
  const mimeType = 'image/jpeg';

  const finalPrompt = `
  Role: Expert Photo Editor & Image Manipulator.
  Target: Modify the image precisely based on the instruction: "${promptModifier}".
  
  ## Core Constraints:
  1. **Structural Integrity:** Maintain the original composition, camera angle, and perspective.
  2. **Subject Preservation:** Lock the subject's identity (facial features), pose, and body proportions.
  3. **Seamless Integration:** Match lighting direction, shadow hardness, and noise/grain texture.
  
  ## Style & Quality:
  - Photorealistic, 8K UHD, Raw Photo style.
  - If instruction implies artistic style transfer, adapt accordingly while keeping subject recognizable.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: finalPrompt },
        { inlineData: { mimeType, data: imageBase64 } },
      ],
    },
  });

  return processAndUploadResult(response, userId);
}

// 2. 参考图转换
async function generateReferenceTransform(
  userUrl: string,
  referenceUrl: string, // 现在这里是 URL
  promptModifier: string,
  userId: string
): Promise<string> {
  const ai = getAiClient();
  const mimeType = 'image/jpeg';

  const userBase64 = await fetchAndConvertToBase64(userUrl);
  const refBase64 = await fetchAndConvertToBase64(referenceUrl);

  const finalPrompt = `
    Role: Expert Scene Replacement & Background Editing Specialist.
    Action: Replace the background of Input 1 with the scene from Input 2.
    
    User Command: ${promptModifier}
    
    Visual Standards:
    1. **Subject Preservation:** Keep subject from Input 1 PIXEL-PERFECT unchanged.
    2. **Background Replacement:** Replace ONLY the background with scene from Input 2.
    3. **Seamless Integration:** Match lighting, shadows, and color temperature.
    4. **Edge Quality:** Clean, natural edges. No halos or artifacts.
    5. **Technical Specs:** Photorealistic, 8k UHD, sharp focus.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: finalPrompt },
        { inlineData: { mimeType, data: userBase64 } },
        { inlineData: { mimeType, data: refBase64 } },
      ],
    },
  });

  return processAndUploadResult(response, userId);
}

// 3. 自由风格 (Multi-image support: 0-5 images)
async function generateFreeStyle(
  sourceUrls: string[], // Array of 0-5 image URLs
  customPrompt: string,
  imageConfig: ImageConfig | undefined,
  userId: string
): Promise<string> {
  const ai = getAiClient();
  const mimeType = 'image/jpeg';
  const config: ImageConfig = imageConfig || { aspectRatio: 'original', imageSize: '1K' };

  const parts: any[] = [];
  let finalPrompt = '';

  if (sourceUrls.length > 0) {
    // Fetch all images in parallel
    const imagesBase64 = await Promise.all(
      sourceUrls.map(url => fetchAndConvertToBase64(url))
    );

    if (sourceUrls.length === 1) {
      // Single image mode (backward compatible)
      finalPrompt = `
      Role: Creative AI Artist.
      Task: Edit the provided image based on the USER PROMPT.
      
      USER PROMPT: "${customPrompt}"
      
      Guidelines:
      1. Follow the user prompt strictly.
      2. If changing background, keep main subject intact unless specified.
      3. If changing person, keep background intact unless specified.
      4. Maintain high photorealism and quality.
      5. Output in maximum quality and resolution.
      `;
      parts.push({ text: finalPrompt });
      parts.push({ inlineData: { mimeType, data: imagesBase64[0] } });
    } else {
      // Multi-image mode (2-5 images as references)
      finalPrompt = `
      Role: Creative AI Artist with Multi-Reference Synthesis Expertise.
      Task: Create a new image based on the USER PROMPT, using the ${sourceUrls.length} provided reference images as inspiration and guidance.
      
      USER PROMPT: "${customPrompt}"
      
      Reference Images:
      ${imagesBase64.map((_, i) => `- Image ${i + 1}: Reference material ${i + 1}`).join('\n')}
      
      Guidelines:
      1. Analyze all reference images for style, content, and composition cues.
      2. Synthesize elements from multiple references as directed by the prompt.
      3. If the prompt asks to combine elements, seamlessly blend them.
      4. If the prompt asks to use one image as base and others as style reference, do so.
      5. Maintain high photorealism and quality unless artistic style is specified.
      6. Output in maximum quality and resolution.
      `;
      parts.push({ text: finalPrompt });
      // Add all images as inline data
      imagesBase64.forEach(base64 => {
        parts.push({ inlineData: { mimeType, data: base64 } });
      });
    }
  } else {
    // No images - pure text-to-image generation
    finalPrompt = `
    Role: Creative AI Artist.
    Task: Generate a high-quality image based on the USER PROMPT.
    
    USER PROMPT: "${customPrompt}"
    
    Guidelines:
    1. Generate photorealistic image unless art style specified.
    2. Ultra high detail, ${config.imageSize} resolution.
    3. Be creative and follow the prompt precisely.
    `;
    parts.push({ text: finalPrompt });
  }

  const apiImageConfig: Record<string, string> = { imageSize: config.imageSize };
  const aspectRatioValue = mapAspectRatio(config.aspectRatio);
  if (aspectRatioValue) {
    apiImageConfig.aspectRatio = aspectRatioValue;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview', // 使用新模型
    contents: { parts },
    config: { imageConfig: apiImageConfig },
  });

  return processAndUploadResult(response, userId);
}

// 4. 自定义换身
async function generateCustomSwap(
  sourceUrl: string,
  targetUrl: string,
  poseUrl: string | null,
  userId: string
): Promise<string> {
  const ai = getAiClient();
  const mimeType = 'image/jpeg';

  const sourceBase64 = await fetchAndConvertToBase64(sourceUrl);
  const targetBase64 = await fetchAndConvertToBase64(targetUrl);

  const parts = [];
  let instructions = `
    Role: Senior VFX Artist & Retoucher.
    Task: Highly Accurate Subject Transplantation.
    
    Inputs:
    - Image 1: SOURCE SUBJECT (The person's identity, face).
    - Image 2: TARGET BACKGROUND/OUTFIT.
  `;

  if (poseUrl) {
    const poseBase64 = await fetchAndConvertToBase64(poseUrl);
    instructions += `
    - Image 3: POSE REFERENCE.
    
    Execution Order:
    1. Analyze Pose from Image 3.
    2. Apply Outfit/Background from Image 2.
    3. Transplant Head/Face/Identity from Image 1.
    `;
    parts.push({ text: instructions });
    parts.push({ inlineData: { mimeType, data: sourceBase64 } });
    parts.push({ inlineData: { mimeType, data: targetBase64 } });
    parts.push({ inlineData: { mimeType, data: poseBase64 } });
  } else {
    instructions += `
    - Image 3: NONE.
    
    Goal: Seamlessly integrate PERSON from Image 1 into SCENE of Image 2.
    - Preserve facial features of Image 1.
    - Match lighting of Image 2.
    `;
    parts.push({ text: instructions });
    parts.push({ inlineData: { mimeType, data: sourceBase64 } });
    parts.push({ inlineData: { mimeType, data: targetBase64 } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
  });

  return processAndUploadResult(response, userId);
}

// 5. 局部重绘
async function generateInpainting(
  sourceUrl: string,
  maskUrl: string,
  promptModifier: string,
  userId: string
): Promise<string> {
  const ai = getAiClient();
  const mimeType = 'image/jpeg';

  const sourceBase64 = await fetchAndConvertToBase64(sourceUrl);
  const maskBase64 = await fetchAndConvertToBase64(maskUrl);

  const finalPrompt = `
  Role: Expert Photo Retoucher & Inpainting Specialist.
  Task: Fill or Modify the MASKED AREA based on: "${promptModifier}".

  ## Critical Rules:
  1. **Strict Scope:** ACT ONLY within white mask area. Unmasked area must remain PIXEL-PERFECT unchanged.
  2. **Seamless Fusion:** Match lighting, noise/grain, color temperature.
  3. **Contextual Continuity:** Fill with plausible content matching surroundings.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: finalPrompt },
        { inlineData: { mimeType, data: sourceBase64 } },
        { inlineData: { mimeType, data: maskBase64 } },
      ],
    },
  });

  return processAndUploadResult(response, userId);
}

// 6. 虚拟试衣
async function generateVirtualTryOn(
  personUrl: string,
  garmentUrl: string,
  mode: TryOnMode,
  userId: string
): Promise<string> {
  const ai = getAiClient();
  const mimeType = 'image/jpeg';

  const personBase64 = await fetchAndConvertToBase64(personUrl);
  const garmentBase64 = await fetchAndConvertToBase64(garmentUrl);

  let instructions = `
    Role: Expert Fashion Stylist & VFX Specialist.
    Task: High-Fidelity Virtual Try-On.
  `;

  if (mode === TryOnMode.KEEP_CLOTHES) {
    instructions += `
      Mode: CHANGE PERSON / KEEP CLOTHES
      Goal: Replace person in Input 1 with person from Input 2, preserving ALL clothing.
      
      Directives:
      1. **CLOTHING PRESERVATION:** Clothing is IMMUTABLE.
      2. **PERSON REPLACEMENT:** Replace visible person with features from Input 2.
      3. **NATURAL INTEGRATION:** Ensure seamless connection.
      4. **LIGHTING MATCHING:** Match lighting perfectly.
    `;
  } else {
    instructions += `
      Mode: CHANGE CLOTHES / KEEP PERSON
      Goal: Virtual Try-On of Garment from Input 2 onto Person from Input 1.
      
      Directives:
      1. **PERSON ANCHOR:** Input 1 is MASTER REFERENCE for pose and identity.
      2. **Garment Simulation:** Drape garment with realistic cloth physics.
      3. **Photorealistic Blending:** Generate realistic shadows and matching grain.
    `;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: instructions },
        { inlineData: { mimeType, data: personBase64 } },
        { inlineData: { mimeType, data: garmentBase64 } },
      ],
    },
  });

  return processAndUploadResult(response, userId);
}

// 7. 提示词增强 (不变，纯文本)
async function enhancePrompt(simplePrompt: string, language: 'en' | 'zh'): Promise<string> {
  const ai = getAiClient();
  const outputLanguage = language === 'zh' ? '中文' : 'English';

  const systemPrompt = `
You are an expert AI Image Prompt Engineer. Transform simple descriptions into professional, detailed prompts.

## Enhancement Principles:
1. **Specificity:** Transform vague descriptions into vivid, detailed ones.
2. **Camera/Lens Control:** Add professional photography terms when appropriate.
3. **Quality Enhancers:** Add technical quality terms.

## Output Rules:
1. Output language: ${outputLanguage}
2. Keep original user intent intact
3. Output ONLY the enhanced prompt text, no explanations
4. Keep it concise but powerful (50-150 words)
`;

  const userMessage = `
User's simple prompt: "${simplePrompt}"

Please enhance this into a professional AI image generation prompt. Output in ${outputLanguage}.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [{ text: systemPrompt + userMessage }],
    },
    config: { temperature: 1 },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No text generated');
  }

  return text.trim().replace(/^["']|["']$/g, '');
}

// ==================== 主路由处理 ====================

export async function POST(request: NextRequest) {
  try {
    // 0. 验证用户身份
    const cookieStore = cookies();

    // 创建 SSR 客户端仅用于验证 Session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Unauthorized: Please log in.'));
    }

    // 1. 检查积分 PRE-CHECK (不扣分)
    const adminSupabase = getSupabaseAdmin();
    const creditCheck = await checkCredits(adminSupabase, user.id, 10);

    if (!creditCheck.success) {
      return NextResponse.json(createErrorResponse(
        creditCheck.error || ERROR_CODES.UNKNOWN,
        creditCheck.error === ERROR_CODES.INSUFFICIENT_CREDITS ? '积分不足，无法生成图片' : 'Credit check failed'
      ));
    }

    const body: GenerateRequest = await request.json();
    let result: string;

    // 注意：body 中的 *Image 字段现在应为 URL (String)
    // 我们的 GenerateRequest 类型定义中，字段本身就是 string | undefined，所以类型兼容

    switch (body.action) {
      case 'styleTransform':
        if (!body.sourceImage || !body.promptModifier) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing required parameters'));
        }
        result = await generateStyleTransform(body.sourceImage, body.promptModifier, user.id);
        break;

      case 'referenceTransform':
        if (!body.sourceImage || !body.referenceImageUrl || !body.promptModifier) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing required parameters'));
        }
        result = await generateReferenceTransform(body.sourceImage, body.referenceImageUrl, body.promptModifier, user.id);
        break;

      case 'freeStyle':
        if (!body.customPrompt) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing customPrompt'));
        }
        // Multi-image support: prioritize sourceImages array, fallback to single sourceImage
        const sourceImagesArray = body.sourceImages || (body.sourceImage ? [body.sourceImage] : []);
        result = await generateFreeStyle(sourceImagesArray, body.customPrompt, body.imageConfig, user.id);
        break;

      case 'customSwap':
        if (!body.sourceImage || !body.targetImage) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing required parameters'));
        }
        result = await generateCustomSwap(body.sourceImage, body.targetImage, body.poseImage || null, user.id);
        break;

      case 'inpainting':
        if (!body.sourceImage || !body.maskImage || !body.promptModifier) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing required parameters'));
        }
        result = await generateInpainting(body.sourceImage, body.maskImage, body.promptModifier, user.id);
        break;

      case 'virtualTryOn':
        if (!body.sourceImage || !body.garmentImage || !body.tryOnMode) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing required parameters'));
        }
        result = await generateVirtualTryOn(body.sourceImage, body.garmentImage, body.tryOnMode, user.id);
        break;

      case 'enhancePrompt':
        if (!body.customPrompt) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing customPrompt'));
        }
        result = await enhancePrompt(body.customPrompt, body.language || 'en');
        return NextResponse.json({ success: true, data: result } as GenerateResponse);

      default:
        return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Invalid action'));
    }

    // 3. 保存生成记录到数据库 (用于恢复)
    await saveGenerationRecord(adminSupabase, user.id, result, body);

    // 4. 生成成功，扣除积分
    await deductCredits(adminSupabase, user.id, 10);

    return NextResponse.json({ success: true, data: result } as GenerateResponse);
  } catch (error: any) {
    console.error('API Route Error:', error);

    if (error.code) {
      return NextResponse.json(createErrorResponse(error.code, error.message));
    }

    const parsed = parseApiError(error);
    return NextResponse.json(createErrorResponse(parsed.code, parsed.message));
  }
}

// 健康检查
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'StyleMorph AI API v2 (Storage Enabled) is running' });
}
