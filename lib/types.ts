/**
 * 类型定义 - StyleMorph AI
 */

export type Language = 'en' | 'zh';

export enum AppMode {
  LANDING = 'LANDING',
  STYLE_MODE = 'STYLE_MODE',
  REFERENCE_MODE = 'REFERENCE_MODE',
  FREE_MODE = 'FREE_MODE',
  CUSTOM_REF_MODE = 'CUSTOM_REF_MODE',
  INPAINTING_MODE = 'INPAINTING_MODE',
  VIRTUAL_TRY_ON = 'VIRTUAL_TRY_ON',
}

export enum TryOnMode {
  KEEP_PERSON = 'KEEP_PERSON', // Change Clothes
  KEEP_CLOTHES = 'KEEP_CLOTHES', // Change Person
}

export enum TransformationMode {
  CLOTHING = 'CLOTHING',
  ART = 'ART',
  MAKEUP = 'MAKEUP',
}

export interface StylePreset {
  id: string;
  name: string;
  name_zh?: string;
  description: string;
  description_zh?: string;
  promptModifier: string;
  previewColor: string;
  icon?: React.ReactNode;
}

export interface ReferencePreset {
  id: string;
  name: string;
  name_zh?: string;
  imageUrl: string;
  promptModifier: string;
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  resultImage: string | null;
}

// 图片配置类型
export type AspectRatio = 'original' | '1:1' | '3:4' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';

export interface ImageConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}

// 历史记录项类型
export interface HistoryItem {
  id: string;
  timestamp: number;

  // 图片数据
  originalImage: string | null;
  resultImage: string;

  // 当时的模式
  appMode: AppMode;

  // Style Mode 参数
  selectedStyleMode?: TransformationMode;
  selectedStyleId?: string;

  // Reference Mode 参数
  selectedReferenceId?: string;

  // Free Mode 参数
  customPrompt?: string;
  imageConfig?: ImageConfig;

  // Custom Ref Mode 参数
  customTargetImage?: string | null;
  customPoseImage?: string | null;

  // Inpainting Mode 参数
  maskImage?: string | null;
  inpaintingPrompt?: string;

  // Virtual Try-On Mode 参数
  tryOnMode?: TryOnMode;
  tryOnReferenceImage?: string | null;
}

// API 请求/响应类型
export interface GenerateRequest {
  action:
  | 'styleTransform'
  | 'referenceTransform'
  | 'freeStyle'
  | 'customSwap'
  | 'inpainting'
  | 'virtualTryOn'
  | 'enhancePrompt';

  // 通用参数
  sourceImage?: string;
  promptModifier?: string;

  // Reference 模式
  referenceImageUrl?: string;

  // Free 模式
  customPrompt?: string;
  imageConfig?: ImageConfig;

  // Custom Swap 模式
  targetImage?: string;
  poseImage?: string | null;

  // Inpainting 模式
  maskImage?: string;

  // Virtual Try-On 模式
  garmentImage?: string;
  tryOnMode?: TryOnMode;

  // Enhance Prompt
  language?: Language;
}

export interface GenerateResponse {
  success: boolean;
  data?: string; // Base64 图片或增强后的 prompt
  error?: string;
  errorCode?: string;
}

// 错误码常量
export const ERROR_CODES = {
  SAFETY_BLOCKED: 'SAFETY_BLOCKED',
  NO_IMAGE_DATA: 'NO_IMAGE_DATA',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  UNKNOWN: 'UNKNOWN',
} as const;

