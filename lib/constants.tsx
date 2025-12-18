import { TransformationMode, StylePreset, ReferencePreset, AspectRatio, ImageSize } from './types';
import { Shirt, Palette, Sparkles } from 'lucide-react';
import React from 'react';

// 错误消息映射 - 根据错误码显示友好提示
export const ERROR_MESSAGES: Record<string, { en: string; zh: string }> = {
  SAFETY_BLOCKED: {
    en: '🛡️ Content blocked by safety filters. Try adjusting your prompt to avoid sensitive topics (e.g., violence, adult content).',
    zh: '🛡️ 内容被安全策略拦截。请尝试调整描述，避免涉及敏感话题（如暴力、成人内容等）。'
  },
  NO_IMAGE_DATA: {
    en: '🎨 AI couldn\'t generate an image from this prompt. Try being more specific or use the Magic Prompt feature.',
    zh: '🎨 AI 无法根据当前描述生成图片。请尝试更具体的描述，或使用「智能润色」功能优化提示词。'
  },
  QUOTA_EXCEEDED: {
    en: '⏳ Too many requests. Please wait a moment (30s) and try again.',
    zh: '⏳ 请求过于频繁，请稍等 30 秒后再试。'
  },
  PAYLOAD_TOO_LARGE: {
    en: '📦 Image too large for network transfer. This may be due to corporate network restrictions. Try uploading a smaller image.',
    zh: '📦 图片体积过大，网络传输受限（可能是公司内网限制）。请尝试上传更小的图片。'
  },
  NETWORK_ERROR: {
    en: '🌐 Network connection failed. Please check your network or proxy settings and try again.',
    zh: '🌐 网络连接失败，请检查网络或代理设置后重试。如在公司内网，请确认代理配置正确。'
  },
  UNKNOWN: {
    en: '❌ Generation failed. Please check your network and try again.',
    zh: '❌ 生成失败，请检查网络后重试。'
  }
};

// 宽高比选项配置
export const ASPECT_RATIO_OPTIONS: { value: AspectRatio; labelKey: string }[] = [
  { value: 'original', labelKey: 'aspectOriginal' },
  { value: '1:1', labelKey: 'aspectSquare' },
  { value: '3:4', labelKey: 'aspectIPad' },
  { value: '9:16', labelKey: 'aspectMobile' },
  { value: '16:9', labelKey: 'aspectMonitor' },
  { value: '21:9', labelKey: 'aspectUltrawide' },
];

// 分辨率选项配置
export const IMAGE_SIZE_OPTIONS: { value: ImageSize; label: string }[] = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

export const TRANSLATIONS = {
  en: {
    backToMenu: "Back to Menu",
    styleControls: "Style Controls",
    referenceSwap: "Reference Swap",
    freeStyle: "Free Style",
    customSwap: "Custom Swap & Pose",
    selectCategoryAndStyle: "Select a category and style.",
    reviewAndGenerate: "Review your selection and generate.",
    freeStyleDesc: "Describe what you want to create.",
    customSwapDesc: "Upload target and optional pose.",
    transformationMode: "Transformation Mode",
    selectStyle: "Select Style",
    howToUse: "How to use",
    generate: "Generate Transformation",
    uploadFirst: "Upload Image First",
    uploadImage: "Upload an Image",
    dragDrop: "Drag and drop your photo here, or click to browse.",
    chooseFile: "Choose File",
    originalImage: "Original Image",
    originalImageOptional: "Original Image (Optional)",
    aiResult: "AI Result",
    readyToTransform: "Ready to transform",
    generationComplete: "Generation Complete",
    generating: "Generating Magic...",
    generatingDesc: "Gemini AI is reimagining your photo. This usually takes 5-10 seconds.",
    resultPlaceholder: "Generated image will appear here",
    download: "Download",
    aiGenerated: "AI Generated",
    modeStyle: "Mode: Style Filter",
    modeReference: "Mode: Reference Swap",
    modeFree: "Mode: Free Creation",
    modeCustom: "Mode: Custom Swap",
    footerRef: "Scene replacement mode intelligently replaces backgrounds while preserving the subject.",
    landingTitle: "StyleMorph AI Studio",
    landingSubtitle: "Reimagine your photos with the power of Gemini AI. Choose a workflow to begin your creative journey.",
    styleFilters: "Style Filters",
    styleFiltersDesc: "Transform your photos using text-based AI presets. Create oil paintings, cyberpunk fashion, or glam makeup looks instantly.",
    startCreating: "Start Creating",
    virtualTryOn: "Scene Replacement",
    virtualTryOnDesc: "Intelligently replace photo backgrounds. Upload your photo and choose a new scene (Beach, Shanghai Bund Night, Snow Mountain Summit, Football Field) while keeping the subject intact.",
    tryReference: "Start Scene Replacement",
    selectReferenceScene: "Select Background Scene",
    refStep1: "Upload your photo in the main area.",
    refStep2: "Select a target background scene from the bottom bar.",
    refStep3: "Click Generate to replace the background.",
    styles: "styles",
    // New Translations
    freeStyleTitle: "Free Creative Mode",
    freeStyleSubtitle: "Your imagination is the limit. Describe any changes you want to make to the image.",
    enterPrompt: "Enter your prompt here...",
    promptPlaceholder: "E.g., Change background to a futuristic city, make the person smile, add a hat...",
    customSwapTitle: "Identity & Pose Transfer",
    customSwapSubtitle: "Advanced fusion. Transfer the person from your main photo into a target background/outfit.",
    uploadTarget: "Upload Target Image (Required)",
    uploadTargetDesc: "The background/outfit you want to use.",
    uploadPose: "Upload Pose/Sketch (Optional)",
    uploadPoseDesc: "Sketch or photo to define the pose. If empty, keeps original pose.",
    targetImage: "Target Image",
    poseImage: "Pose/Sketch",
    clear: "Clear",
    customStep1: "1. Upload Subject (Main Area)",
    customStep2: "2. Upload Target Image (Right)",
    customStep3: "3. (Optional) Upload Pose Sketch",
    tryFree: "Try Free Mode",
    tryCustom: "Try Custom Swap",
    // SketchPad & Editing
    editRefine: "Edit & Refine",
    sketchTitle: "Sketch / Annotate",
    saveSketch: "Save & Use",
    brushSize: "Brush Size",
    undo: "Undo",
    eraser: "Eraser",
    pen: "Pen",
    color: "Color",
    sketchInstructions: "Draw a pose or annotate the image to guide the AI.",
    editRefineHint: "Click 'Edit & Refine' on the result to fix details.",
    // Image Compare
    compare: "Compare",
    compareTitle: "Image Compare",
    compareOriginal: "Original",
    compareResult: "AI Result",
    compareHint: "Drag the slider left or right to compare • Use arrow keys for fine adjustment • Press ESC to close",
    // Image Config
    outputSettings: "Output Settings",
    aspectRatio: "Aspect Ratio",
    imageResolution: "Image Resolution",
    aspectOriginal: "Original",
    aspectSquare: "Square 1:1",
    aspectIPad: "iPad 3:4",
    aspectMobile: "Mobile 9:16",
    aspectMonitor: "Monitor 16:9",
    aspectUltrawide: "Ultrawide 21:9",
    defaultLabel: "Default",
    // History
    history: "History",
    historyTitle: "Generation History",
    historyEmpty: "No history yet. Generate some images to see them here.",
    historyItemAgo: "ago",
    historyRestore: "Restore Parameters",
    historyDelete: "Delete",
    historyDeleteConfirm: "Delete this item?",
    historyClearAll: "Clear All",
    historyClearConfirm: "Clear all history?",
    historyPreviewTitle: "History Preview",
    historyDownloadOriginal: "Download Original",
    historyDownloadResult: "Download Result",
    historyClose: "Close",
    historyPrompt: "Prompt",
    historyMode: "Mode",
    historyStyle: "Style",
    historyReference: "Reference",
    historySettings: "Settings",
    historySaved: "Saved to history",
    historyJustNow: "Just now",
    historyMinutesAgo: "min ago",
    historyHoursAgo: "hours ago",
    historyDaysAgo: "days ago",
    // Magic Prompt
    magicPrompt: "Magic Prompt",
    magicPromptTooltip: "AI-powered prompt enhancement",
    magicPromptEnhancing: "Enhancing...",
    magicPromptError: "Enhancement failed, please try again",
    // Continue Inpainting
    fixDefects: "Fix Defects",
    fixDefectsTooltip: "Paint to fix specific areas",
    reImagine: "Re-imagine",
    reImagineTooltip: "Generate new image based on this",
    // Virtual Try-On
    professionalTryOn: "Professional Try-On",
    professionalTryOnDesc: "Specialized for fashion. Swap models while keeping clothes pixel-perfect, or try on clothes while keeping your identity.",
    startTryOn: "Start Try-On",
    loginToSave: "Sign in to save history",
    insufficientCredits: "Insufficient credits (Requires 5)",
    // Landing Page
    login: "Log in",
    signOut: "Sign Out",
    getStarted: "Get Started",
    landingHeroTitle1: "Sketch it",
    landingHeroTitle2: "Prompt it",
    landingHeroTitle3: "Morph it",
    landingHeroDesc: "The infinite canvas where your ideas become reality. Use AI to transform photos, sketches, and prompts into stunning visuals in seconds.",
    exploreFeatures: "Explore Features",
    chooseWorkflow: "Choose Your Workflow",
    footerCopyright: "© 2025 StyleMorph AI. All rights reserved.",
    // Contact Section
    contactTitle: "Contact Us",
    needHelpOrFeedback: "Need help or feedback?",
    emailUs: "Email Us",
    followUsForUpdates: "Follow us for updates"
  },
  zh: {
    backToMenu: "返回菜单",
    styleControls: "风格控制",
    referenceSwap: "参考替换",
    freeStyle: "自由风格",
    customSwap: "自定义移植 & 姿态",
    selectCategoryAndStyle: "选择类别和风格。",
    reviewAndGenerate: "预览选择并生成。",
    freeStyleDesc: "描述您想要创作的内容。",
    customSwapDesc: "上传目标图和可选的姿态图。",
    transformationMode: "转换模式",
    selectStyle: "选择风格",
    howToUse: "如何使用",
    generate: "生成转换",
    uploadFirst: "请先上传图片",
    uploadImage: "上传图片",
    dragDrop: "拖放照片到此处，或点击浏览。",
    chooseFile: "选择文件",
    originalImage: "原始图片",
    originalImageOptional: "原始图片 (可选)",
    aiResult: "AI 结果",
    readyToTransform: "准备转换",
    generationComplete: "生成完成",
    generating: "正在施展魔法...",
    generatingDesc: "Gemini AI 正在重绘您的照片。通常需要 5-10 秒。",
    resultPlaceholder: "生成的图片将显示在这里",
    download: "下载",
    aiGenerated: "AI 生成",
    modeStyle: "模式：风格滤镜",
    modeReference: "模式：参考替换",
    modeFree: "模式：自由创作",
    modeCustom: "模式：自定义移植",
    footerRef: "场景替换模式智能替换背景，同时保持主体完美不变。",
    landingTitle: "StyleMorph AI 工作室",
    landingSubtitle: "利用 AI 重塑您的照片。选择一种工作流开始您的创作之旅。",
    styleFilters: "风格滤镜",
    styleFiltersDesc: "使用基于文本的 AI 预设转换您的照片。即时创建油画、赛博朋克时尚或迷人妆容。",
    startCreating: "开始创作",
    virtualTryOn: "场景替换",
    virtualTryOnDesc: "智能替换照片背景。上传您的照片并选择新场景（海滩、上海外滩夜景、雪山登顶、足球场中央），AI将保持主体不变。",
    tryReference: "开始场景替换",
    selectReferenceScene: "选择背景场景",
    refStep1: "在主区域上传您的照片。",
    refStep2: "从底部栏选择目标背景场景。",
    refStep3: "点击生成替换背景。",
    styles: "种风格",
    // New Translations
    freeStyleTitle: "自由创作模式",
    freeStyleSubtitle: "想象力无极限。描述您想对图片进行的任何更改。",
    enterPrompt: "在此输入您的提示词...",
    promptPlaceholder: "例如：将背景改为未来城市，让人笑起来，加一顶帽子...",
    customSwapTitle: "特征移植 & 姿态控制",
    customSwapSubtitle: "高级融合。将主照片中的人物移植到目标背景/服装中。",
    uploadTarget: "上传目标底图 (必填)",
    uploadTargetDesc: "您想要使用的背景或服装图片。",
    uploadPose: "上传姿态/草图 (选填)",
    uploadPoseDesc: "定义姿势的草图或照片。如为空，保持原姿态。",
    targetImage: "目标底图",
    poseImage: "姿态/草图",
    clear: "清除",
    customStep1: "1. 上传主体人物 (主区域)",
    customStep2: "2. 上传目标背景/服装 (右侧)",
    customStep3: "3. (可选) 上传姿态草图",
    tryFree: "尝试自由模式",
    tryCustom: "尝试自定义移植",
    // SketchPad & Editing
    editRefine: "精修 & 编辑",
    sketchTitle: "草图 / 标注",
    saveSketch: "保存并使用",
    brushSize: "笔刷大小",
    undo: "撤销",
    eraser: "橡皮擦",
    pen: "画笔",
    color: "颜色",
    sketchInstructions: "绘制姿态或在图片上进行标注以指导 AI。",
    editRefineHint: "点击结果图修改细节。",
    // Image Compare
    compare: "对比",
    compareTitle: "图片对比",
    compareOriginal: "原图",
    compareResult: "AI 结果",
    compareHint: "左右拖动滑块对比效果 • 方向键微调 • 按 ESC 关闭",
    // Image Config
    outputSettings: "输出设置",
    aspectRatio: "宽高比",
    imageResolution: "输出分辨率",
    aspectOriginal: "与原图一致",
    aspectSquare: "正方形 1:1",
    aspectIPad: "iPad竖屏 3:4",
    aspectMobile: "手机全屏 9:16",
    aspectMonitor: "标准显示器 16:9",
    aspectUltrawide: "超宽屏 21:9",
    defaultLabel: "默认",
    // History
    history: "历史记录",
    historyTitle: "生成历史",
    historyEmpty: "暂无历史记录，生成一些图片后会显示在这里。",
    historyItemAgo: "前",
    historyRestore: "恢复参数",
    historyDelete: "删除",
    historyDeleteConfirm: "确定删除此记录？",
    historyClearAll: "清空全部",
    historyClearConfirm: "确定清空所有历史记录？",
    historyPreviewTitle: "历史预览",
    historyDownloadOriginal: "下载原图",
    historyDownloadResult: "下载结果",
    historyClose: "关闭",
    historyPrompt: "提示词",
    historyMode: "模式",
    historyStyle: "风格",
    historyReference: "参考",
    historySettings: "设置",
    historySaved: "已保存到历史记录",
    historyJustNow: "刚刚",
    historyMinutesAgo: "分钟前",
    historyHoursAgo: "小时前",
    historyDaysAgo: "天前",
    // Magic Prompt
    magicPrompt: "智能润色",
    magicPromptTooltip: "AI 智能扩写提示词",
    magicPromptEnhancing: "润色中...",
    magicPromptError: "润色失败，请重试",
    // Continue Inpainting
    fixDefects: "局部修补",
    fixDefectsTooltip: "涂抹修改特定区域",
    reImagine: "风格重绘",
    reImagineTooltip: "以此图为基础重新生成",
    // Virtual Try-On
    professionalTryOn: "专业虚拟试衣",
    professionalTryOnDesc: "专为时尚设计。保留服装细节替换模特，或保留人物特征试穿新衣。",
    startTryOn: "开始试衣",
    loginToSave: "登录以保存历史",
    insufficientCredits: "积分不足 (需要 5 积分)",
    // Landing Page
    login: "登录",
    signOut: "退出登录",
    getStarted: "开始使用",
    landingHeroTitle1: "草图勾勒",
    landingHeroTitle2: "灵感提示",
    landingHeroTitle3: "万象幻化",
    landingHeroDesc: "无限画布，创意成真。利用 AI 将照片、草图和提示词瞬间转化为惊艳的视觉作品。",
    exploreFeatures: "探索功能",
    chooseWorkflow: "选择工作流",
    footerCopyright: "© 2025 StyleMorph AI. 保留所有权利。",
    // Contact Section
    contactTitle: "联系我们",
    needHelpOrFeedback: "需要帮助或反馈？",
    emailUs: "发送邮件",
    followUsForUpdates: "关注最新动态"
  }
};

export const PRESETS: Record<TransformationMode, StylePreset[]> = {
  [TransformationMode.CLOTHING]: [
    {
      id: 'business-suit',
      name: 'Business Professional',
      name_zh: '商务职业装',
      description: 'A sharp, tailored business suit.',
      description_zh: '剪裁利落的商务西装。',
      promptModifier: 'wearing a high-end tailored navy blue business suit, professional lighting, realistic fabric texture',
      previewColor: 'bg-blue-900'
    },
    {
      id: 'casual-summer',
      name: 'Casual Summer',
      name_zh: '休闲夏日',
      description: 'Light, breezy summer attire.',
      description_zh: '轻盈透气的夏日装扮。',
      promptModifier: 'wearing a casual white linen shirt and summer accessories, bright sunny lighting',
      previewColor: 'bg-yellow-200'
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Techwear',
      name_zh: '赛博朋克机能风',
      description: 'Futuristic urban fashion.',
      description_zh: '未来主义的都市时尚。',
      promptModifier: 'wearing futuristic cyberpunk techwear with neon accents, dark moody atmosphere',
      previewColor: 'bg-purple-600'
    },
    {
      id: 'evening-gown',
      name: 'Evening Gala',
      name_zh: '晚宴礼服',
      description: 'Elegant formal wear.',
      description_zh: '优雅的正式晚礼服。',
      promptModifier: 'wearing an elegant red evening gown or tuxedo, red carpet lighting, glamorous',
      previewColor: 'bg-red-700'
    },
    {
      id: 'leather-jacket',
      name: 'Edgy Leather',
      name_zh: '前卫皮衣',
      description: 'Cool leather jacket style.',
      description_zh: '帅气的皮夹克风格。',
      promptModifier: 'wearing a vintage black leather biker jacket, urban street photography style',
      previewColor: 'bg-gray-800'
    }
  ],
  [TransformationMode.ART]: [
    {
      id: 'oil-painting',
      name: 'Oil Painting',
      name_zh: '油画风格',
      description: 'Classic oil on canvas.',
      description_zh: '经典布面油画质感。',
      promptModifier: 'in the style of a classical oil painting, thick brushstrokes, rich texture, masterpiece',
      previewColor: 'bg-amber-700'
    },
    {
      id: 'anime',
      name: 'Anime Style',
      name_zh: '动漫风格',
      description: 'Japanese animation style.',
      description_zh: '日式动画艺术风格。',
      promptModifier: 'in high quality anime art style, vibrant colors, cel shading, studio ghibli inspired',
      previewColor: 'bg-pink-400'
    },
    {
      id: 'watercolor',
      name: 'Watercolor',
      name_zh: '水彩画',
      description: 'Soft watercolor art.',
      description_zh: '柔和的水彩艺术。',
      promptModifier: 'in the style of watercolor painting, soft edges, paper texture, artistic',
      previewColor: 'bg-blue-300'
    },
    {
      id: 'cyber-neon',
      name: 'Neon Digital',
      name_zh: '霓虹数字艺术',
      description: 'Glowing digital art.',
      description_zh: '发光的数字艺术风格。',
      promptModifier: 'in a synthwave digital art style, neon aesthetics, glowing lines, futuristic',
      previewColor: 'bg-fuchsia-500'
    },
    {
      id: 'sketch',
      name: 'Pencil Sketch',
      name_zh: '铅笔素描',
      description: 'Detailed charcoal sketch.',
      description_zh: '细腻的炭笔素描。',
      promptModifier: 'as a detailed charcoal pencil sketch on textured paper, high contrast, artistic shading',
      previewColor: 'bg-gray-400'
    }
  ],
  [TransformationMode.MAKEUP]: [
    {
      id: 'natural-glow',
      name: 'Natural Glow',
      name_zh: '自然光泽',
      description: 'Subtle, fresh look.',
      description_zh: '精致清透的妆容。',
      promptModifier: 'wearing soft natural "no-makeup" makeup, dewy skin, healthy glow, high resolution photography',
      previewColor: 'bg-orange-100'
    },
    {
      id: 'hollywood-glam',
      name: 'Hollywood Glam',
      name_zh: '好莱坞魅力',
      description: 'Red carpet ready.',
      description_zh: '红毯级精致妆容。',
      promptModifier: 'wearing bold hollywood glamour makeup, red lipstick, winged eyeliner, dramatic eyelashes, studio lighting',
      previewColor: 'bg-red-500'
    },
    {
      id: 'avant-garde',
      name: 'Avant Garde',
      name_zh: '前卫艺术',
      description: 'Artistic high fashion.',
      description_zh: '艺术化的高级时尚妆容。',
      promptModifier: 'wearing artistic avant-garde fashion makeup, colorful eyeshadow designs, editorial fashion photography',
      previewColor: 'bg-emerald-600'
    },
    {
      id: 'smokey-eye',
      name: 'Smokey Night',
      name_zh: '烟熏晚妆',
      description: 'Dramatic evening look.',
      description_zh: '富有戏剧感的晚宴妆。',
      promptModifier: 'wearing intense dark smokey eye makeup, nude lips, evening look, flash photography',
      previewColor: 'bg-slate-800'
    }
  ]
};

export const REFERENCE_PRESETS: ReferencePreset[] = [
  {
    id: 'beach-vacation',
    name: 'Beach Vacation',
    name_zh: '海滩度假',
    imageUrl: '/images/presets/beach-vacation.png',
    promptModifier: 'standing on this sunny beach, ocean background, golden hour lighting, natural scene'
  },
  {
    id: 'shanghai-bund-night',
    name: 'Shanghai Bund Night View',
    name_zh: '上海外滩夜景',
    imageUrl: '/images/presets/shanghai-bund-night.png',
    promptModifier: 'standing on a transparent observation deck at Shanghai Bund, with the Bund behind, camera capturing the entire panoramic night view'
  },
  {
    id: 'snow-mountain-summit',
    name: 'Snow Mountain Summit',
    name_zh: '雪山登顶',
    imageUrl: '/images/presets/snow-mountain-summit.png',
    promptModifier: 'standing on snow mountain summit, majestic mountain peaks background, clear blue sky, epic landscape, adventure photography'
  },
  {
    id: 'football-field-center',
    name: 'Football Field Center',
    name_zh: '足球场中央',
    imageUrl: '/images/presets/football-field-center.png',
    promptModifier: 'standing at the center of a football stadium, green grass field, stadium lights, sports arena background, dramatic lighting'
  },
  {
    id: 'autumn-park',
    name: 'Autumn Park',
    name_zh: '秋日公园',
    imageUrl: '/images/presets/autumn-park.png',
    promptModifier: 'standing in this autumn park with fallen leaves, natural park environment, soft natural light'
  },
  {
    id: 'cyberpunk-city',
    name: 'Cyberpunk City',
    name_zh: '赛博朋克城市',
    imageUrl: '/images/presets/cyberpunk-city.png',
    promptModifier: 'standing in this futuristic cyberpunk city street, neon lights background, night time, urban sci-fi scene'
  },
  {
    id: 'space-station',
    name: 'Space Station',
    name_zh: '太空站',
    imageUrl: '/images/presets/space-station.png',
    promptModifier: 'in outer space environment, space station or cosmic background, sci-fi scene, high fidelity'
  }
];

export const MODE_ICONS = {
  [TransformationMode.CLOTHING]: <Shirt className="w-5 h-5" />,
  [TransformationMode.ART]: <Palette className="w-5 h-5" />,
  [TransformationMode.MAKEUP]: <Sparkles className="w-5 h-5" />
};

export const MODE_LABELS = {
  [TransformationMode.CLOTHING]: { en: "Fashion Swap", zh: "时尚换装" },
  [TransformationMode.ART]: { en: "Artistic Filter", zh: "艺术滤镜" },
  [TransformationMode.MAKEUP]: { en: "Beauty Studio", zh: "美妆工作室" }
};
