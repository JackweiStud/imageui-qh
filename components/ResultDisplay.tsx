'use client';

import React, { useState } from 'react';
import { Download, Maximize2, Columns, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { ImageCompareModal } from './ImageCompareModal';
import { Language } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/constants';
import { downloadImage } from '@/lib/historyService';

// 自定义创可贴图标 (lucide-react 没有 Bandage)
const BandageIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.5 5.5L5.5 18.5" />
    <path d="M5.5 5.5l13 13" />
    <rect x="3" y="3" width="18" height="18" rx="2" transform="rotate(45 12 12)" />
    <circle cx="12" cy="9" r="1" fill="currentColor" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="15" r="1" fill="currentColor" />
  </svg>
);

interface ResultDisplayProps {
  resultImage: string | null;
  originalImage?: string | null;
  isLoading: boolean;
  language: Language;
  onEdit?: () => void;     // 对应 Free Mode (Re-imagine / 风格重绘)
  onInpaint?: () => void;  // 新增：对应 Inpainting (Fix Defects / 局部修补)
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ resultImage, originalImage, isLoading, language, onEdit, onInpaint }) => {
  const t = TRANSLATIONS[language];
  const [showCompare, setShowCompare] = useState(false);

  const handleDownload = async () => {
    if (!resultImage) return;
    await downloadImage(resultImage, `stylemorph-generated-${Date.now()}.png`);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[300px] bg-dark-surface rounded-2xl border border-dark-border flex flex-col items-center justify-center p-8">
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 border-4 border-brand-500/30 rounded-full animate-pulse"></div>
           <div className="absolute inset-0 border-t-4 border-brand-500 rounded-full animate-spin"></div>
           <div className="absolute inset-4 bg-brand-500/20 rounded-full blur-xl"></div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2 animate-pulse">{t.generating}</h3>
        <p className="text-slate-400 text-center max-w-xs">
          {t.generatingDesc}
        </p>
      </div>
    );
  }

  if (!resultImage) {
    return (
      <div className="w-full h-full min-h-[300px] bg-dark-surface/50 rounded-2xl border border-dashed border-dark-border flex flex-col items-center justify-center text-slate-500">
        <Maximize2 className="w-12 h-12 mb-4 opacity-20" />
        <p>{t.resultPlaceholder}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[300px] bg-dark-surface rounded-2xl border border-brand-500/50 overflow-hidden shadow-2xl shadow-brand-500/10 group">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
      
      <img 
        src={resultImage} 
        alt="Generated Result" 
        className="w-full h-full object-contain bg-black/40"
      />
      
      {/* Top Controls - 移动端始终显示，PC端 hover 显示 */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex flex-wrap gap-1.5 sm:gap-2 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all md:transform md:translate-y-2 md:group-hover:translate-y-0">
        {/* 对比按钮 - 需要原图才显示 */}
        {originalImage && (
          <Button
            variant="secondary"
            onClick={() => setShowCompare(true)}
            icon={<Columns size={14} className="sm:w-4 sm:h-4" />}
            className="shadow-xl bg-white/90 hover:bg-white active:bg-slate-100 text-slate-900 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">{t.compare}</span>
            <span className="sm:hidden">{language === 'zh' ? '对比' : 'Compare'}</span>
          </Button>
        )}
        
        {/* 1. 局部修补 (Inpaint) - 高频需求，用醒目样式 */}
        {onInpaint && (
          <Button
            variant="primary"
            onClick={onInpaint}
            icon={<BandageIcon size={14} />}
            className="shadow-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:from-emerald-700 active:to-teal-700 border-0 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm"
            title={t.fixDefectsTooltip}
          >
            <span className="hidden sm:inline">{t.fixDefects}</span>
            <span className="sm:hidden">{language === 'zh' ? '修复' : 'Fix'}</span>
          </Button>
        )}
        
        {/* 2. 整体重绘 (Refine/Free Mode) - 探索性需求 */}
        {onEdit && (
          <Button
            variant="secondary"
            onClick={onEdit}
            icon={<Sparkles size={14} className="sm:w-4 sm:h-4" />}
            className="shadow-xl bg-white/90 hover:bg-white active:bg-slate-100 text-slate-900 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm"
            title={t.reImagineTooltip}
          >
            <span className="hidden sm:inline">{t.reImagine}</span>
            <span className="sm:hidden">{language === 'zh' ? '重绘' : 'Edit'}</span>
          </Button>
        )}
        
        <Button 
          variant="primary" 
          onClick={handleDownload}
          icon={<Download size={14} className="sm:w-4 sm:h-4" />}
          className="shadow-xl px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">{t.download}</span>
          <span className="sm:hidden">{language === 'zh' ? '下载' : 'Save'}</span>
        </Button>
      </div>

      {/* 图片对比弹窗 */}
      {showCompare && originalImage && (
        <ImageCompareModal
          originalImage={originalImage}
          resultImage={resultImage}
          onClose={() => setShowCompare(false)}
          language={language}
        />
      )}

      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-20 bg-brand-500/90 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs backdrop-blur-sm font-medium shadow-lg">
        {t.aiGenerated}
      </div>
    </div>
  );
};
