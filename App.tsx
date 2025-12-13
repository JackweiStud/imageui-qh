'use client';

import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Sidebar } from './components/Sidebar';
import { ResultDisplay } from './components/ResultDisplay';
import { LandingPage } from './components/LandingPage';
import { SketchPad } from './components/SketchPad';
import { HistoryDrawer } from './components/HistoryDrawer';
import { HistoryPreviewModal } from './components/HistoryPreviewModal';
import { TransformationMode, StylePreset, ReferencePreset, AppMode, Language, ImageConfig, AspectRatio, ImageSize, HistoryItem, TryOnMode } from '@/lib/types';
import { PRESETS, REFERENCE_PRESETS, TRANSLATIONS, ERROR_MESSAGES } from '@/lib/constants';
import {
  generateImageTransformation,
  generateReferenceTransformation,
  generateFreeStyleTransformation,
  generateCustomSwapTransformation,
  generateInpaintingTransformation,
  generateVirtualTryOnTransformation,
  fetchRecentGeneration
} from '@/lib/api-client';
import {
  getHistory,
  saveHistory,
  deleteHistoryItem,
  clearHistory,
  syncFromCloud
} from '@/lib/historyService';
import { Sparkles, Github, Globe, ArrowLeft } from 'lucide-react';

import { useAuth } from './components/auth/AuthProvider';
import { UserAvatarMenu } from './components/UserAvatarMenu';
import { saveLanguage, loadLanguage } from '@/lib/languageStorage';

const App: React.FC = () => {
  // -- State Management --
  const { user, credits, signOut } = useAuth();
  const [appMode, setAppMode] = useState<AppMode>(AppMode.LANDING);
  const [language, setLanguage] = useState<Language>('en');

  // Handle global errors (e.g. from Auth callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error_description') || params.get('error');
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      // Clean up the URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const saved = loadLanguage();
    if (saved) {
      setLanguage(saved);
    }
  }, []);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recovery state (for network error recovery)
  const [isRecoverable, setIsRecoverable] = useState(false);
  const [recoveryTimestamp, setRecoveryTimestamp] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // SketchPad State
  const [showSketchPad, setShowSketchPad] = useState(false);
  const [sketchBackground, setSketchBackground] = useState<string | null>(null);
  const [sketchMode, setSketchMode] = useState<'POSE' | 'EDIT_RESULT' | 'INPAINTING'>('POSE');
  const [sketchPadMode, setSketchPadMode] = useState<'drawing' | 'masking'>('drawing');

  // Style Mode State
  const [selectedStyleMode, setSelectedStyleMode] = useState<TransformationMode>(TransformationMode.CLOTHING);
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>(PRESETS[TransformationMode.CLOTHING][0]);

  // Reference Mode State (Preset)
  const [selectedReference, setSelectedReference] = useState<ReferencePreset>(REFERENCE_PRESETS[0]);

  // Free Mode State
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [imageConfig, setImageConfig] = useState<ImageConfig>({
    aspectRatio: 'original',
    imageSize: '1K'
  });

  // Custom Reference Mode State
  const [customTargetImage, setCustomTargetImage] = useState<string | null>(null);
  const [customPoseImage, setCustomPoseImage] = useState<string | null>(null);

  // Inpainting Mode State
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [inpaintingPrompt, setInpaintingPrompt] = useState<string>('');

  // Virtual Try-On Mode State
  const [tryOnMode, setTryOnMode] = useState<TryOnMode>(TryOnMode.KEEP_PERSON);
  const [tryOnReferenceImage, setTryOnReferenceImage] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const t = TRANSLATIONS[language];

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const items = await getHistory();
      setHistory(items);
    };
    loadHistory();
  }, []);

  // -- Handlers --

  const handleModeSwitch = (newStyleMode: TransformationMode) => {
    setSelectedStyleMode(newStyleMode);
    setSelectedStyle(PRESETS[newStyleMode][0]);
  };

  const toggleLanguage = () => {
    setLanguage(prev => {
      const newLang = prev === 'en' ? 'zh' : 'en';
      saveLanguage(newLang);
      return newLang;
    });
  };

  // Helper to convert File to Base64 for custom uploads
  const handleFileUpload = (file: File, setter: (val: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setter(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    // Basic validation moved inside logic to support Free Mode without image

    // 性能日志：记录开始时间
    const startTime = Date.now();
    console.log(`[Performance] Generation started at ${new Date(startTime).toISOString()}`);

    setIsGenerating(true);
    setError(null);
    setResultImage(null);
    setIsRecoverable(false);
    setRecoveryTimestamp(null);

    try {
      let result: string;

      if (appMode === AppMode.STYLE_MODE) {
        if (!originalImage) throw new Error("Please upload an image first.");
        // Logic 1: Single Image + Text Prompt
        result = await generateImageTransformation(originalImage, selectedStyle.promptModifier);
      } else if (appMode === AppMode.REFERENCE_MODE) {
        if (!originalImage) throw new Error("Please upload an image first.");
        // Logic 2: Two Images (User + Preset URL)
        result = await generateReferenceTransformation(
          originalImage,
          selectedReference.imageUrl,
          selectedReference.promptModifier
        );
      } else if (appMode === AppMode.FREE_MODE) {
        // Logic 3: Free Style (User Image OPTIONAL + Custom Text)
        if (!customPrompt.trim()) throw new Error("Please enter a prompt.");
        result = await generateFreeStyleTransformation(originalImage, customPrompt, imageConfig);
      } else if (appMode === AppMode.CUSTOM_REF_MODE) {
        if (!originalImage) throw new Error("Please upload an image first.");
        // Logic 4: Custom Swap (User + Custom Target + Optional Pose)
        if (!customTargetImage) throw new Error("Please upload a target image.");
        result = await generateCustomSwapTransformation(
          originalImage,
          customTargetImage,
          customPoseImage
        );
      } else if (appMode === AppMode.INPAINTING_MODE) {
        if (!originalImage) throw new Error("Please upload an image first.");
        if (!maskImage) throw new Error("Please create a mask by painting the areas to modify.");
        if (!inpaintingPrompt.trim()) throw new Error("Please describe what you want to change.");
        // Logic 5: Inpainting (User Image + Mask + Prompt)
        result = await generateInpaintingTransformation(
          originalImage,
          maskImage,
          inpaintingPrompt
        );
      } else if (appMode === AppMode.VIRTUAL_TRY_ON) {
        if (!originalImage) throw new Error("Please upload the main image.");
        if (!tryOnReferenceImage) throw new Error("Please upload a reference garment.");
        // Logic 6: Virtual Try-On
        result = await generateVirtualTryOnTransformation(
          originalImage,
          tryOnReferenceImage,
          tryOnMode
        );
      } else {
        throw new Error("Invalid Mode");
      }

      // 性能日志：记录成功完成时间
      const endTime = Date.now();
      const elapsedSeconds = ((endTime - startTime) / 1000).toFixed(1);
      console.log(`[Performance] Generation completed successfully in ${elapsedSeconds}s`);
      console.log(`[Performance] Mode: ${appMode}, Start: ${new Date(startTime).toISOString()}, End: ${new Date(endTime).toISOString()}`);

      setResultImage(result);

      // 保存到历史记录
      const savedItem = await saveHistory({
        originalImage,
        resultImage: result,
        appMode,
        selectedStyleMode,
        selectedStyleId: selectedStyle?.id,
        selectedReferenceId: selectedReference?.id,
        customPrompt: appMode === AppMode.FREE_MODE ? customPrompt : undefined,
        imageConfig: appMode === AppMode.FREE_MODE ? imageConfig : undefined,
        customTargetImage: appMode === AppMode.CUSTOM_REF_MODE ? customTargetImage : undefined,
        customPoseImage: appMode === AppMode.CUSTOM_REF_MODE ? customPoseImage : undefined,
        maskImage: appMode === AppMode.INPAINTING_MODE ? maskImage : undefined,
        inpaintingPrompt: appMode === AppMode.INPAINTING_MODE ? inpaintingPrompt : undefined,
        tryOnMode: appMode === AppMode.VIRTUAL_TRY_ON ? tryOnMode : undefined,
        tryOnReferenceImage: appMode === AppMode.VIRTUAL_TRY_ON ? tryOnReferenceImage : undefined,
      });

      if (savedItem) {
        const updatedHistory = await getHistory();
        setHistory(updatedHistory);
      }
    } catch (err: any) {
      // 性能日志：记录失败时间
      const endTime = Date.now();
      const elapsedSeconds = ((endTime - startTime) / 1000).toFixed(1);
      console.log(`[Performance] Generation failed after ${elapsedSeconds}s - Error: ${err.name || err.message}`);

      console.error(err);

      // 检查是否为可恢复错误
      if (err.name === 'RECOVERABLE_ERROR') {
        setIsRecoverable(true);
        setRecoveryTimestamp(err.requestStartTime || startTime);
        setError(language === 'zh'
          ? '网络错误，图片可能已生成。点击下方按钮重新获取。'
          : 'Network error. Image may have been generated. Click button below to retry.');
      } else {
        // 根据错误码映射友好文案
        const errorCode = err.name || 'UNKNOWN';
        const messages = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN;
        setError(messages[language]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 手动重新获取图片 (网络错误后)
  const handleRetryFetch = async () => {
    if (!recoveryTimestamp) return;

    setIsRetrying(true);
    try {
      const recovered = await fetchRecentGeneration(recoveryTimestamp);
      if (recovered) {
        console.log('[Recovery] Manual retry successful');
        setResultImage(recovered);
        setError(null);
        setIsRecoverable(false);
        setRecoveryTimestamp(null);

        // 保存到历史记录
        await saveHistory({
          originalImage,
          resultImage: recovered,
          appMode,
          selectedStyleMode,
          selectedStyleId: selectedStyle?.id,
          selectedReferenceId: selectedReference?.id,
          customPrompt: appMode === AppMode.FREE_MODE ? customPrompt : undefined,
          imageConfig: appMode === AppMode.FREE_MODE ? imageConfig : undefined,
        });
        const updatedHistory = await getHistory();
        setHistory(updatedHistory);
      } else {
        setError(language === 'zh'
          ? '未找到生成结果，请重新生成。'
          : 'No result found. Please try generating again.');
        setIsRecoverable(false);
      }
    } catch (e) {
      console.error('[Recovery] Manual retry failed:', e);
    } finally {
      setIsRetrying(false);
    }
  };

  // SketchPad Handlers
  const openSketchPadForPose = () => {
    setSketchBackground(null);
    setSketchMode('POSE');
    setShowSketchPad(true);
  };

  const openSketchPadForRefine = () => {
    if (resultImage) {
      setSketchBackground(resultImage);
      setSketchMode('EDIT_RESULT');
      setSketchPadMode('drawing');
      setShowSketchPad(true);
    }
  };

  // 新增：将结果图转为 Inpainting 的底图（Continue Inpainting 功能）
  // 注意：延迟模式切换，只有用户保存遮罩后才真正切换，点击 X 关闭时恢复原状态
  const handleInpaintResult = () => {
    if (resultImage) {
      // 只打开 SketchPad，不立即切换模式
      // 模式切换在 handleSketchSave 中处理
      setSketchBackground(resultImage);
      setSketchMode('INPAINTING');
      setSketchPadMode('masking');
      setShowSketchPad(true);
    }
  };

  const openSketchPadForInpainting = () => {
    if (originalImage) {
      setSketchBackground(originalImage);
      setSketchMode('INPAINTING');
      setSketchPadMode('masking');
      setShowSketchPad(true);
    }
  };

  const handleSketchSave = (dataUrl: string, maskDataUrl?: string) => {
    if (sketchMode === 'POSE') {
      setCustomPoseImage(dataUrl);
    } else if (sketchMode === 'INPAINTING') {
      // Inpainting 模式：保存遮罩图，切换到 INPAINTING_MODE
      if (maskDataUrl) {
        // 如果是从 "Fix Defects" 进入（sketchBackground 来自 resultImage），
        // 需要把它设为新的 originalImage
        if (sketchBackground && sketchBackground !== originalImage) {
          setOriginalImage(sketchBackground);
          setInpaintingPrompt(''); // 重置提示词
        }
        setMaskImage(maskDataUrl);
        setAppMode(AppMode.INPAINTING_MODE);
        setResultImage(null); // 清空之前的结果
      }
    } else {
      // Logic for Edit/Refine:
      // 1. Set the edited image as the new Input (Original Image)
      setOriginalImage(dataUrl);
      // 2. Clear the previous result
      setResultImage(null);
      // 3. Switch to Free Mode so user can describe changes
      setAppMode(AppMode.FREE_MODE);
      setCustomPrompt(''); // Reset prompt for new instructions
      // 4. (Optional) Maybe pre-fill prompt with "Refine this image..."? 
    }
    setShowSketchPad(false);
    setSketchBackground(null);
  };

  // History Handlers
  const handleHistoryToggle = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
  };

  const handleHistoryDelete = async (id: string) => {
    await deleteHistoryItem(id);
    const updatedHistory = await getHistory();
    setHistory(updatedHistory);
  };

  const handleHistoryClear = async () => {
    await clearHistory();
    setHistory([]);
  };

  // 云端同步历史记录
  const handleCloudSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncFromCloud();
      if (result.added > 0) {
        const updatedHistory = await getHistory();
        setHistory(updatedHistory);
        console.log(`[Cloud Sync] Synced ${result.added} new records`);
      }
    } catch (error) {
      console.error('[Cloud Sync] Failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleHistoryRestore = (item: HistoryItem) => {
    // 恢复模式
    setAppMode(item.appMode);

    // 恢复图片
    setOriginalImage(item.originalImage);
    setResultImage(item.resultImage);

    // 根据模式恢复具体参数
    if (item.appMode === AppMode.STYLE_MODE) {
      if (item.selectedStyleMode) {
        setSelectedStyleMode(item.selectedStyleMode);
        const preset = PRESETS[item.selectedStyleMode]?.find(p => p.id === item.selectedStyleId);
        if (preset) {
          setSelectedStyle(preset);
        }
      }
    } else if (item.appMode === AppMode.REFERENCE_MODE) {
      const refPreset = REFERENCE_PRESETS.find(r => r.id === item.selectedReferenceId);
      if (refPreset) {
        setSelectedReference(refPreset);
      }
    } else if (item.appMode === AppMode.FREE_MODE) {
      setCustomPrompt(item.customPrompt || '');
      if (item.imageConfig) {
        setImageConfig(item.imageConfig);
      }
    } else if (item.appMode === AppMode.CUSTOM_REF_MODE) {
      setCustomTargetImage(item.customTargetImage || null);
      setCustomPoseImage(item.customPoseImage || null);
    } else if (item.appMode === AppMode.INPAINTING_MODE) {
      setMaskImage(item.maskImage || null);
      setInpaintingPrompt(item.inpaintingPrompt || '');
    } else if (item.appMode === AppMode.VIRTUAL_TRY_ON) {
      if (item.tryOnMode) setTryOnMode(item.tryOnMode);
      setTryOnReferenceImage(item.tryOnReferenceImage || null);
    }

    // 关闭历史抽屉和预览模态框
    setSelectedHistoryItem(null);
    setIsHistoryOpen(false);
  };

  // -- Language Switcher Component --
  const LanguageSwitcher = () => (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-surface border border-dark-border hover:border-slate-500 transition-colors text-slate-300 text-xs font-medium"
    >
      <Globe size={14} />
      {language === 'en' ? 'English' : '中文'}
    </button>
  );

  const getHeaderTitle = () => {
    switch (appMode) {
      case AppMode.STYLE_MODE: return t.modeStyle;
      case AppMode.REFERENCE_MODE: return t.modeReference;
      case AppMode.FREE_MODE: return t.modeFree;
      case AppMode.CUSTOM_REF_MODE: return t.modeCustom;
      case AppMode.INPAINTING_MODE: return language === 'zh' ? '局部重绘模式' : 'Inpainting Mode';
      case AppMode.VIRTUAL_TRY_ON: return language === 'zh' ? '虚拟试衣模式' : 'Virtual Try-On Mode';
      default: return "StyleMorph AI";
    }
  };

  // -- Render --

  if (appMode === AppMode.LANDING) {
    return (
      <LandingPage
        onSelectMode={setAppMode}
        language={language}
        onToggleLanguage={toggleLanguage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-slate-200 font-sans selection:bg-brand-500/30">
      {/* History Drawer (Left Side) */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onToggle={handleHistoryToggle}
        history={history}
        onSelectItem={handleHistorySelect}
        onDeleteItem={handleHistoryDelete}
        onClearAll={handleHistoryClear}
        language={language}
        onSyncCloud={handleCloudSync}
        isSyncing={isSyncing}
      />

      {/* History Preview Modal */}
      {selectedHistoryItem && (
        <HistoryPreviewModal
          item={selectedHistoryItem}
          onClose={() => setSelectedHistoryItem(null)}
          onRestore={handleHistoryRestore}
          language={language}
        />
      )}

      {/* Sketch Pad Modal */}
      {showSketchPad && (
        <SketchPad
          onSave={handleSketchSave}
          onClose={() => setShowSketchPad(false)}
          language={language}
          backgroundImage={sketchBackground}
          mode={sketchPadMode}
        />
      )}

      {/* Mobile/Tablet Header */}
      <header className="lg:hidden flex items-center justify-between p-3 sm:p-4 border-b border-dark-border bg-dark-surface/50 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* 返回按钮 - 移动端醒目显示 */}
          <button
            onClick={() => setAppMode(AppMode.LANDING)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all active:scale-95"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">{language === 'zh' ? '返回' : 'Back'}</span>
          </button>
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">StyleMorph AI</h1>
        </div>
        {/* 移动端用户信息 */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-full border border-white/10">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-6 h-6 rounded-full border border-white/10 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4F46F] to-emerald-500 flex items-center justify-center text-black font-bold text-[10px]">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-[10px] sm:text-xs text-brand-400 font-medium">{credits}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400 bg-white/5 px-2 py-1 rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-[10px] font-medium">{language === 'zh' ? '未登录' : 'Login'}</span>
            </div>
          )}
        </div>
      </header>

      <main className={`lg:mr-96 flex flex-col min-h-screen ${appMode === AppMode.REFERENCE_MODE ? 'pb-48' : ''}`}>
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-6">
          {/* Left Side: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20 bg-gradient-to-br from-brand-400 to-brand-600`}>
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white leading-none mb-1">StyleMorph AI</h1>
              <p className="text-xs text-slate-400">
                {getHeaderTitle()}
              </p>
            </div>
          </div>

          {/* Right Side: User Info + GitHub */}
          <div className="flex items-center gap-4">
            {user ? (
              <UserAvatarMenu
                user={user}
                credits={credits}
                onSignOut={signOut}
                language={language}
                theme="dark"
              />
            ) : (
              <div className="flex items-center gap-2 animate-in fade-in duration-300 text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-xs font-medium">{language === 'zh' ? '请先登录' : 'Please Login'}</span>
              </div>
            )}
            <div className="h-6 w-px bg-white/10"></div>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Github size={20} />
            </a>
          </div>
        </header>

        {/* Workspace Content */}
        <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[600px]">

            {/* Input Section */}
            <div className="flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between mb-1 px-1">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  {appMode === AppMode.FREE_MODE ? t.originalImageOptional : t.originalImage}
                </h3>
                {originalImage && (
                  <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">{t.readyToTransform}</span>
                )}
              </div>
              <div className="flex-1 h-full">
                <ImageUploader
                  currentImage={originalImage}
                  onImageUpload={setOriginalImage}
                  onClear={() => {
                    setOriginalImage(null);
                    setResultImage(null);
                  }}
                  language={language}
                />
              </div>
            </div>

            {/* Output Section */}
            <div className="flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between mb-1 px-1">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{t.aiResult}</h3>
                {resultImage && (
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">{t.generationComplete}</span>
                )}
              </div>
              <div className="flex-1 h-full">
                <ResultDisplay
                  resultImage={resultImage}
                  originalImage={originalImage}
                  isLoading={isGenerating}
                  language={language}
                  onEdit={resultImage ? openSketchPadForRefine : undefined}
                  onInpaint={resultImage ? handleInpaintResult : undefined}
                  error={error}
                  isRecoverable={isRecoverable}
                  isRetrying={isRetrying}
                  onRetryFetch={handleRetryFetch}
                />
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM REFERENCE BAR (Only visible in Reference Mode) */}
        {appMode === AppMode.REFERENCE_MODE && (
          <div className="fixed bottom-0 left-0 right-0 lg:right-96 h-44 bg-dark-surface/95 backdrop-blur-xl border-t border-dark-border z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col h-full p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                <Sparkles size={12} className="text-purple-400" /> {t.selectReferenceScene}
              </h3>
              <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 h-full items-center">
                {REFERENCE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedReference(preset)}
                    className={`
                        relative flex-shrink-0 w-32 h-28 group rounded-xl overflow-hidden border transition-all duration-200
                        ${selectedReference?.id === preset.id
                        ? 'border-purple-500 ring-2 ring-purple-500 shadow-lg shadow-purple-500/20 scale-105'
                        : 'border-dark-border hover:border-slate-500 hover:scale-105'
                      }
                      `}
                  >
                    <div className="absolute inset-0">
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // 如果图片加载失败，显示占位符
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                      {/* 占位符 - 图片加载失败时显示 */}
                      <div
                        className="image-placeholder hidden w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50 items-center justify-center"
                        style={{ display: 'none' }}
                      >
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto mb-1 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-[8px] text-purple-300 font-medium">{language === 'zh' ? (preset.name_zh || preset.name) : preset.name}</p>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
                      <p className={`text-[10px] font-bold truncate ${selectedReference?.id === preset.id ? 'text-white' : 'text-slate-300'}`}>
                        {language === 'zh' ? (preset.name_zh || preset.name) : preset.name}
                      </p>
                    </div>

                    {selectedReference?.id === preset.id && (
                      <div className="absolute top-1 right-1 bg-purple-500 text-white rounded-full p-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sidebar Controls */}
      <Sidebar
        appMode={appMode}
        onBack={() => setAppMode(AppMode.LANDING)}
        language={language}

        // Style Mode Props
        selectedMode={selectedStyleMode}
        onSelectMode={handleModeSwitch}
        selectedStyleId={selectedStyle?.id}
        onSelectStyle={setSelectedStyle}

        // Reference Mode Props
        selectedReferenceId={selectedReference?.id}
        onSelectReference={setSelectedReference}

        // Free Mode Props
        customPrompt={customPrompt}
        onCustomPromptChange={setCustomPrompt}
        imageConfig={imageConfig}
        onImageConfigChange={setImageConfig}

        // Custom Swap Props
        customTargetImage={customTargetImage}
        onCustomTargetUpload={(f) => handleFileUpload(f, setCustomTargetImage)}
        customPoseImage={customPoseImage}
        onCustomPoseUpload={(f) => handleFileUpload(f, setCustomPoseImage)}
        onClearCustomImages={() => {
          setCustomTargetImage(null);
          setCustomPoseImage(null);
        }}
        onOpenSketchPad={openSketchPadForPose}

        // Inpainting Mode Props
        inpaintingPrompt={inpaintingPrompt}
        onInpaintingPromptChange={setInpaintingPrompt}
        maskImage={maskImage}
        onOpenInpaintingMask={openSketchPadForInpainting}

        // Virtual Try-On Props
        tryOnMode={tryOnMode}
        onTryOnModeChange={setTryOnMode}
        tryOnReferenceImage={tryOnReferenceImage}
        onTryOnRefUpload={(f) => handleFileUpload(f, setTryOnReferenceImage)}

        // Shared Props
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        hasImage={!!originalImage}
      />
    </div>
  );
};

export default App;
