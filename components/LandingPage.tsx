'use client';

import React from 'react';
import { AppMode, Language } from '@/lib/types';
import { Sparkles, Camera, ArrowRight, ImagePlus, Edit3, Layers, Eraser, Shirt } from 'lucide-react';
import { TRANSLATIONS } from '@/lib/constants';

interface LandingPageProps {
  onSelectMode: (mode: AppMode) => void;
  language: Language;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectMode, language }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-dark-bg to-dark-surface px-4 py-12">
      <div className="text-center mb-12 max-w-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl mb-6 shadow-2xl shadow-brand-500/20">
          <Sparkles size={40} className="text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          {t.landingTitle}
        </h1>
        <p className="text-lg text-slate-400">
          {t.landingSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
        
        {/* Option 1: Style Presets */}
        <button
          onClick={() => onSelectMode(AppMode.STYLE_MODE)}
          className="group relative p-6 bg-dark-surface border border-dark-border rounded-3xl hover:border-brand-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-500/10 text-left overflow-hidden h-64 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
            <Sparkles size={100} />
          </div>
          
          <div className="relative z-10">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Sparkles size={20} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t.styleFilters}</h3>
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
              {t.styleFiltersDesc}
            </p>
          </div>
          <div className="flex items-center text-brand-400 font-medium text-sm mt-4">
              {t.startCreating} <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Option 2: Reference Swap (Preset) */}
        <button
          onClick={() => onSelectMode(AppMode.REFERENCE_MODE)}
          className="group relative p-6 bg-dark-surface border border-dark-border rounded-3xl hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 text-left overflow-hidden h-64 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
             <ImagePlus size={100} />
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Camera size={20} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t.virtualTryOn}</h3>
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
              {t.virtualTryOnDesc}
            </p>
          </div>
          <div className="flex items-center text-purple-400 font-medium text-sm mt-4">
              {t.tryReference} <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
        </button>

        {/* Option 6: Professional Try-On (NEW) */}
        <button
          onClick={() => onSelectMode(AppMode.VIRTUAL_TRY_ON)}
          className="group relative p-6 bg-dark-surface border border-dark-border rounded-3xl hover:border-blue-400/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-400/10 text-left overflow-hidden h-64 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
             <Shirt size={100} />
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 bg-blue-400/20 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-400 group-hover:text-white transition-colors">
              <Shirt size={20} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t.professionalTryOn}</h3>
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
              {t.professionalTryOnDesc}
            </p>
          </div>
          <div className="flex items-center text-blue-400 font-medium text-sm mt-4">
              {t.startTryOn} <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Option 3: Custom Reference/Pose (MOVED UP) */}
        <button
          onClick={() => onSelectMode(AppMode.CUSTOM_REF_MODE)}
          className="group relative p-6 bg-dark-surface border border-dark-border rounded-3xl hover:border-pink-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-500/10 text-left overflow-hidden h-64 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
             <Layers size={100} />
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 mb-4 group-hover:bg-pink-500 group-hover:text-white transition-colors">
              <Layers size={20} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t.customSwap}</h3>
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
              {t.customSwapSubtitle}
            </p>
          </div>
          <div className="flex items-center text-pink-400 font-medium text-sm mt-4">
              {t.tryCustom} <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Option 4: Free Style (MOVED DOWN) */}
        <button
          onClick={() => onSelectMode(AppMode.FREE_MODE)}
          className="group relative p-6 bg-dark-surface border border-dark-border rounded-3xl hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 text-left overflow-hidden h-64 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
             <Edit3 size={100} />
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Edit3 size={20} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t.freeStyle}</h3>
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
              {t.freeStyleSubtitle}
            </p>
          </div>
          <div className="flex items-center text-emerald-400 font-medium text-sm mt-4">
              {t.tryFree} <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Option 5: Inpainting Mode (NEW) */}
        <button
          onClick={() => onSelectMode(AppMode.INPAINTING_MODE)}
          className="group relative p-6 bg-dark-surface border border-dark-border rounded-3xl hover:border-red-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/10 text-left overflow-hidden h-64 flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
             <Eraser size={100} />
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 mb-4 group-hover:bg-red-500 group-hover:text-white transition-colors">
              <Eraser size={20} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {language === 'zh' ? '局部重绘' : 'Inpainting'}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
              {language === 'zh' 
                ? '涂抹图片中的瑕疵区域，AI 将精准修复。仅重绘遮罩区域，其余部分完美保留。' 
                : 'Paint over flaws in your image, AI will precisely fix them. Only repaint masked areas, keeping the rest perfect.'}
            </p>
          </div>
          <div className="flex items-center text-red-400 font-medium text-sm mt-4">
              {language === 'zh' ? '开始修复' : 'Start Fixing'} <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

      </div>
    </div>
  );
};
