/**
 * 前端 API 客户端 - 调用后端代理接口
 * 所有 AI 请求通过 /api/generate 发送，API Key 在后端安全处理
 */

import { 
  GenerateRequest, 
  GenerateResponse, 
  ImageConfig, 
  TryOnMode,
  Language,
  ERROR_CODES 
} from './types';

// API 端点
const API_ENDPOINT = '/api/generate';

// 通用请求函数
async function callApi(request: GenerateRequest): Promise<string> {
  // 设置 90 秒前端超时（比后端 60 秒略长，以便接收后端可能的超时响应）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 504) {
        throw new Error('生成时间过长，服务器响应超时。请稍后重试或简化提示词。');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: GenerateResponse = await response.json();

    if (!data.success) {
      const error = new Error(data.errorCode || ERROR_CODES.UNKNOWN);
      error.name = data.errorCode || ERROR_CODES.UNKNOWN;
      (error as any).originalMessage = data.error;
      throw error;
    }

    return data.data!;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // 处理前端主动超时
    if (error.name === 'AbortError') {
      throw new Error('请求等待超时，生成过程可能仍在后台进行，请稍后刷新查看结果。');
    }
    throw error;
  }
}

// Helper: 压缩图片 (前端执行，减少上传体积)
const compressImage = async (base64Str: string, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      console.warn('Image compression failed, using original');
      resolve(base64Str);
    };
  });
};

// ==================== 导出的 API 函数 ====================

/**
 * 1. 风格滤镜转换
 */
export const generateImageTransformation = async (
  sourceImage: string,
  promptModifier: string
): Promise<string> => {
  const optimizedImage = await compressImage(sourceImage);
  return callApi({
    action: 'styleTransform',
    sourceImage: optimizedImage,
    promptModifier,
  });
};

/**
 * 2. 参考图场景替换
 */
export const generateReferenceTransformation = async (
  userImage: string,
  referenceImageUrl: string,
  promptModifier: string
): Promise<string> => {
  const optimizedImage = await compressImage(userImage, 800, 0.6);
  return callApi({
    action: 'referenceTransform',
    sourceImage: optimizedImage,
    referenceImageUrl,
    promptModifier,
  });
};

/**
 * 3. 自由风格创作
 */
export const generateFreeStyleTransformation = async (
  sourceImage: string | null,
  customPrompt: string,
  imageConfig?: ImageConfig
): Promise<string> => {
  let optimizedImage: string | undefined;
  if (sourceImage) {
    optimizedImage = await compressImage(sourceImage, 2048, 0.9);
  }
  return callApi({
    action: 'freeStyle',
    sourceImage: optimizedImage,
    customPrompt,
    imageConfig,
  });
};

/**
 * 4. 自定义换身
 */
export const generateCustomSwapTransformation = async (
  sourceImage: string,
  targetImage: string,
  poseImage: string | null
): Promise<string> => {
  const optimizedSource = await compressImage(sourceImage, 768, 0.6);
  const optimizedTarget = await compressImage(targetImage, 768, 0.6);
  let optimizedPose: string | undefined;
  if (poseImage) {
    optimizedPose = await compressImage(poseImage, 768, 0.6);
  }
  return callApi({
    action: 'customSwap',
    sourceImage: optimizedSource,
    targetImage: optimizedTarget,
    poseImage: optimizedPose,
  });
};

/**
 * 5. 局部重绘
 */
export const generateInpaintingTransformation = async (
  sourceImage: string,
  maskImage: string,
  promptModifier: string
): Promise<string> => {
  const optimizedSource = await compressImage(sourceImage, 1024, 0.8);
  const optimizedMask = await compressImage(maskImage, 1024, 0.8);
  return callApi({
    action: 'inpainting',
    sourceImage: optimizedSource,
    maskImage: optimizedMask,
    promptModifier,
  });
};

/**
 * 6. 虚拟试衣
 */
export const generateVirtualTryOnTransformation = async (
  personImage: string,
  garmentImage: string,
  mode: TryOnMode
): Promise<string> => {
  const optimizedPerson = await compressImage(personImage, 768, 0.6);
  const optimizedGarment = await compressImage(garmentImage, 768, 0.6);
  return callApi({
    action: 'virtualTryOn',
    sourceImage: optimizedPerson,
    garmentImage: optimizedGarment,
    tryOnMode: mode,
  });
};

/**
 * 7. 提示词智能润色
 */
export const enhancePrompt = async (
  simplePrompt: string,
  language: Language
): Promise<string> => {
  return callApi({
    action: 'enhancePrompt',
    customPrompt: simplePrompt,
    language,
  });
};

// 重新导出错误码供组件使用
export { ERROR_CODES };

