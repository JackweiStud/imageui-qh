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

// 从响应中提取图片
const extractImageFromResponse = (response: any): string => {
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
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw { code: ERROR_CODES.NO_IMAGE_DATA, message: 'No image data found in response' };
};

// 清理 Base64 数据 URL
const cleanBase64 = (dataUrl: string): string => {
  return dataUrl.split(',')[1] || dataUrl;
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

// 服务端获取参考图片 Base64
const fetchReferenceImage = async (url: string): Promise<string> => {
  // 如果是相对路径，需要拼接完整URL
  const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
  
  try {
    const response = await fetch(fullUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return base64;
  } catch (error) {
    console.error('Failed to fetch reference image:', error);
    throw new Error('Could not load reference image');
  }
};

// ==================== AI 生成函数 ====================

// 1. 风格转换
async function generateStyleTransform(sourceImage: string, promptModifier: string): Promise<string> {
  const ai = getAiClient();
  const imageBase64 = cleanBase64(sourceImage);
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

  return extractImageFromResponse(response);
}

// 2. 参考图转换
async function generateReferenceTransform(
  userImage: string,
  referenceImageUrl: string,
  promptModifier: string
): Promise<string> {
  const ai = getAiClient();
  const mimeType = 'image/jpeg';

  const userBase64 = cleanBase64(userImage);
  const refBase64 = await fetchReferenceImage(referenceImageUrl);

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

  return extractImageFromResponse(response);
}

// 3. 自由风格
async function generateFreeStyle(
  sourceImage: string | null,
  customPrompt: string,
  imageConfig?: ImageConfig
): Promise<string> {
  const ai = getAiClient();
  const mimeType = 'image/jpeg';
  const config: ImageConfig = imageConfig || { aspectRatio: 'original', imageSize: '1K' };

  let finalPrompt = '';
  const parts: any[] = [];

  if (sourceImage) {
    const imageBase64 = cleanBase64(sourceImage);
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
    parts.push({ inlineData: { mimeType, data: imageBase64 } });
  } else {
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
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: { imageConfig: apiImageConfig },
  });

  return extractImageFromResponse(response);
}

// 4. 自定义换身
async function generateCustomSwap(
  sourceImage: string,
  targetImage: string,
  poseImage: string | null
): Promise<string> {
  const ai = getAiClient();
  const mimeType = 'image/jpeg';

  const sourceBase64 = cleanBase64(sourceImage);
  const targetBase64 = cleanBase64(targetImage);

  const parts = [];
  let instructions = `
    Role: Senior VFX Artist & Retoucher.
    Task: Highly Accurate Subject Transplantation.
    
    Inputs:
    - Image 1: SOURCE SUBJECT (The person's identity, face).
    - Image 2: TARGET BACKGROUND/OUTFIT.
  `;

  if (poseImage) {
    const poseBase64 = cleanBase64(poseImage);
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

  return extractImageFromResponse(response);
}

// 5. 局部重绘
async function generateInpainting(
  sourceImage: string,
  maskImage: string,
  promptModifier: string
): Promise<string> {
  const ai = getAiClient();
  const mimeType = 'image/jpeg';

  const sourceBase64 = cleanBase64(sourceImage);
  const maskBase64 = cleanBase64(maskImage);

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

  return extractImageFromResponse(response);
}

// 6. 虚拟试衣
async function generateVirtualTryOn(
  personImage: string,
  garmentImage: string,
  mode: TryOnMode
): Promise<string> {
  const ai = getAiClient();
  const mimeType = 'image/jpeg';

  const personBase64 = cleanBase64(personImage);
  const garmentBase64 = cleanBase64(garmentImage);

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

  return extractImageFromResponse(response);
}

// 7. 提示词增强
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
    model: 'gemini-2.5-flash',
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
    const body: GenerateRequest = await request.json();
    let result: string;

    switch (body.action) {
      case 'styleTransform':
        if (!body.sourceImage || !body.promptModifier) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing required parameters'));
        }
        result = await generateStyleTransform(body.sourceImage, body.promptModifier);
        break;

      case 'referenceTransform':
        if (!body.sourceImage || !body.referenceImageUrl || !body.promptModifier) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing required parameters'));
        }
        result = await generateReferenceTransform(body.sourceImage, body.referenceImageUrl, body.promptModifier);
        break;

      case 'freeStyle':
        if (!body.customPrompt) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing customPrompt'));
        }
        result = await generateFreeStyle(body.sourceImage || null, body.customPrompt, body.imageConfig);
        break;

      case 'customSwap':
        if (!body.sourceImage || !body.targetImage) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing required parameters'));
        }
        result = await generateCustomSwap(body.sourceImage, body.targetImage, body.poseImage || null);
        break;

      case 'inpainting':
        if (!body.sourceImage || !body.maskImage || !body.promptModifier) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing required parameters'));
        }
        result = await generateInpainting(body.sourceImage, body.maskImage, body.promptModifier);
        break;

      case 'virtualTryOn':
        if (!body.sourceImage || !body.garmentImage || !body.tryOnMode) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing required parameters'));
        }
        result = await generateVirtualTryOn(body.sourceImage, body.garmentImage, body.tryOnMode);
        break;

      case 'enhancePrompt':
        if (!body.customPrompt) {
          return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Missing customPrompt'));
        }
        result = await enhancePrompt(body.customPrompt, body.language || 'en');
        break;

      default:
        return NextResponse.json(createErrorResponse(ERROR_CODES.UNKNOWN, 'Invalid action'));
    }

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
  return NextResponse.json({ status: 'ok', message: 'StyleMorph AI API is running' });
}

