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
import { createClient } from '@/lib/supabase/client';

// API 端点
const API_ENDPOINT = '/api/generate';

// 辅助：Base64 转 Blob
const base64ToBlob = (base64: string, mimeType = 'image/jpeg'): Blob => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
};

// 辅助：上传图片到 Supabase Storage ('raw_uploads')
// 返回带签名的 URL (有效期 1 小时)
const uploadImageToSupabase = async (base64Str: string): Promise<string> => {
  const supabase = createClient();

  // 1. 获取当前用户
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Please login to upload images');
  }

  // 2. 转换文件
  const blob = base64ToBlob(base64Str);
  const fileExt = 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`; // 必须匹配 RLS 策略: uid/filename

  // 3. 上传
  const { error: uploadError } = await supabase.storage
    .from('raw_uploads')
    .upload(filePath, blob, {
      upsert: true,
      contentType: 'image/jpeg'
    });

  if (uploadError) {
    console.error('Storage Upload Error:', uploadError);
    throw new Error('Failed to upload image to storage');
  }

  // 4. 获取 Signed URL (有效期 3600 秒 = 1 小时)
  // 因为我们的 bucket 设为 private，后端需要 signed url 才能读取 (或者后端用 admin key 也可以 download，但 fetch 更通用)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('raw_uploads')
    .createSignedUrl(filePath, 3600);

  if (signedError || !signedData?.signedUrl) {
    console.error('Get Signed URL Error:', signedError);
    throw new Error('Failed to get image URL');
  }

  return signedData.signedUrl;
};

// 查询最近的生成记录 (用于恢复)
export const fetchRecentGeneration = async (sinceTimestamp: number): Promise<string | null> => {
  try {
    const response = await fetch(`/api/generations?since=${sinceTimestamp}&limit=1`);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.success && data.data?.length > 0) {
      return data.data[0].result_image_url;
    }
    return null;
  } catch {
    return null;
  }
};

// 查询云端历史记录 (用于同步)
export const fetchCloudGenerations = async (limit: number = 50): Promise<any[]> => {
  try {
    const response = await fetch(`/api/generations?limit=${limit}`);
    if (!response.ok) return [];

    const data = await response.json();
    return data.success ? data.data : [];
  } catch {
    return [];
  }
};

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 尝试从云端恢复最近的生成结果
const attemptRecovery = async (sinceTimestamp: number, maxRetries: number = 2): Promise<string | null> => {
  for (let i = 0; i < maxRetries; i++) {
    // 等待 5 秒让后端 DB 写入完成
    await delay(5000);

    const recovered = await fetchRecentGeneration(sinceTimestamp);
    if (recovered) {
      console.log(`[Recovery] Successfully recovered generation on attempt ${i + 1}`);
      return recovered;
    }
    console.log(`[Recovery] Attempt ${i + 1} failed, retrying...`);
  }
  return null;
};

// 通用请求函数
async function callApi(request: GenerateRequest): Promise<string> {
  // 记录请求开始时间 (用于恢复查询)
  const requestStartTime = Date.now();

  // 略长于服务端 maxDuration（300s），以便收到函数自己的超时响应。
  // huaizhoutechai.com 若走 Cloudflare 橙色云，源站连接仍会在约 100s 被切断。
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 310000);

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

    // 检测网络相关错误 (AbortError, TypeError, 或包含 network 关键词)
    const isNetworkError =
      error.name === 'AbortError' ||
      error.name === 'TypeError' ||
      error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('failed to fetch');

    if (isNetworkError) {
      console.log('[Recovery] Network error detected, attempting recovery...');

      // 尝试从云端恢复
      const recovered = await attemptRecovery(requestStartTime);
      if (recovered) {
        return recovered;
      }

      // 恢复失败，抛出可恢复错误 (供手动刷新)
      const recoverableError = new Error('RECOVERABLE_ERROR');
      recoverableError.name = 'RECOVERABLE_ERROR';
      (recoverableError as any).requestStartTime = requestStartTime;
      (recoverableError as any).originalError = error.message;
      throw recoverableError;
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
  const imageUrl = await uploadImageToSupabase(optimizedImage);

  return callApi({
    action: 'styleTransform',
    sourceImage: imageUrl,
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
  const sourceUrl = await uploadImageToSupabase(optimizedImage);

  // existing referenceImageUrl is likely already a URL (e.g. preset or previously generated)
  // If it's base64, we should also upload it, but currently types assume string.
  // We assume referenceImageUrl is a remote URL for now as per preset logic.

  return callApi({
    action: 'referenceTransform',
    sourceImage: sourceUrl,
    referenceImageUrl,
    promptModifier,
  });
};

/**
 * 3. 自由风格创作 (Multi-image support: 0-5 images)
 */
export const generateFreeStyleTransformation = async (
  sourceImages: string[], // Array of 0-5 base64 images
  customPrompt: string,
  imageConfig?: ImageConfig
): Promise<string> => {
  let sourceUrls: string[] = [];

  if (sourceImages.length > 0) {
    // Compress and upload all images in parallel
    const compressedImages = await Promise.all(
      sourceImages.map(img => compressImage(img, 2048, 0.9))
    );
    sourceUrls = await Promise.all(
      compressedImages.map(img => uploadImageToSupabase(img))
    );
  }

  return callApi({
    action: 'freeStyle',
    sourceImage: sourceUrls.length > 0 ? sourceUrls[0] : undefined, // Backward compat: first image
    sourceImages: sourceUrls.length > 0 ? sourceUrls : undefined, // Multi-image array
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

  // Parallel upload
  const uploadPromises = [
    uploadImageToSupabase(optimizedSource),
    uploadImageToSupabase(optimizedTarget)
  ];

  if (poseImage) {
    const optimizedPose = await compressImage(poseImage, 768, 0.6);
    uploadPromises.push(uploadImageToSupabase(optimizedPose));
  }

  const urls = await Promise.all(uploadPromises);

  return callApi({
    action: 'customSwap',
    sourceImage: urls[0],
    targetImage: urls[1],
    poseImage: poseImage ? urls[2] : undefined,
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

  const [sourceUrl, maskUrl] = await Promise.all([
    uploadImageToSupabase(optimizedSource),
    uploadImageToSupabase(optimizedMask)
  ]);

  return callApi({
    action: 'inpainting',
    sourceImage: sourceUrl,
    maskImage: maskUrl,
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

  const [personUrl, garmentUrl] = await Promise.all([
    uploadImageToSupabase(optimizedPerson),
    uploadImageToSupabase(optimizedGarment)
  ]);

  return callApi({
    action: 'virtualTryOn',
    sourceImage: personUrl,
    garmentImage: garmentUrl,
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
