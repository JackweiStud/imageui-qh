'use client';

import React from 'react';
import { HistoryItem, Language, AppMode, TransformationMode } from '@/lib/types';
import { TRANSLATIONS, PRESETS, REFERENCE_PRESETS } from '@/lib/constants';
import { 
  X, Download, RotateCcw, Clock, Wand2, Edit3, 
  Image as ImageIcon, Layers, Settings2, FileText 
} from 'lucide-react';
import { downloadImage } from '@/lib/historyService';

interface HistoryPreviewModalProps {
  item: HistoryItem;
  onClose: () => void;
  onRestore: (item: HistoryItem) => void;
  language: Language;
}

export const HistoryPreviewModal: React.FC<HistoryPreviewModalProps> = ({
  item,
  onClose,
  onRestore,
  language
}) => {
  const t = TRANSLATIONS[language];

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取模式名称和颜色
  const getModeInfo = (mode: AppMode) => {
    switch (mode) {
      case AppMode.STYLE_MODE:
        return {
          name: language === 'zh' ? '风格滤镜' : 'Style Filters',
          icon: <Wand2 size={16} />,
          color: 'text-brand-400',
          bgColor: 'bg-brand-500/20'
        };
      case AppMode.FREE_MODE:
        return {
          name: language === 'zh' ? '自由创作' : 'Free Creation',
          icon: <Edit3 size={16} />,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/20'
        };
      case AppMode.REFERENCE_MODE:
        return {
          name: language === 'zh' ? '参考替换' : 'Reference Swap',
          icon: <ImageIcon size={16} />,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20'
        };
      case AppMode.CUSTOM_REF_MODE:
        return {
          name: language === 'zh' ? '自定义移植' : 'Custom Swap',
          icon: <Layers size={16} />,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/20'
        };
      default:
        return {
          name: 'Unknown',
          icon: <Wand2 size={16} />,
          color: 'text-slate-400',
          bgColor: 'bg-slate-500/20'
        };
    }
  };

  // 获取风格名称
  const getStyleName = (): string | null => {
    if (!item.selectedStyleId || !item.selectedStyleMode) return null;
    const presets = PRESETS[item.selectedStyleMode];
    const style = presets?.find(p => p.id === item.selectedStyleId);
    if (!style) return null;
    return language === 'zh' ? (style.name_zh || style.name) : style.name;
  };

  // 获取参考场景名称
  const getReferenceName = (): string | null => {
    if (!item.selectedReferenceId) return null;
    const ref = REFERENCE_PRESETS.find(r => r.id === item.selectedReferenceId);
    if (!ref) return null;
    return language === 'zh' ? (ref.name_zh || ref.name) : ref.name;
  };

  const modeInfo = getModeInfo(item.appMode);
  const styleName = getStyleName();
  const referenceName = getReferenceName();

  // Handle download
  const handleDownload = (imageData: string, type: 'original' | 'result') => {
    const filename = `stylemorph-${type}-${item.id}.png`;
    downloadImage(imageData, filename);
  };

  // Handle restore and close
  const handleRestore = () => {
    onRestore(item);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-dark-surface rounded-2xl border border-dark-border shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border bg-dark-bg/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${modeInfo.bgColor} ${modeInfo.color}`}>
              {modeInfo.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.historyPreviewTitle}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock size={12} />
                {formatTime(item.timestamp)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-border text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {/* Images Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Original Image */}
            {item.originalImage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-300">{t.compareOriginal}</h3>
                  <button
                    onClick={() => handleDownload(item.originalImage!, 'original')}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                  >
                    <Download size={12} />
                    {t.download}
                  </button>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden border border-dark-border bg-dark-bg">
                  <img
                    src={item.originalImage}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Result Image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-300">{t.compareResult}</h3>
                <button
                  onClick={() => handleDownload(item.resultImage, 'result')}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                >
                  <Download size={12} />
                  {t.download}
                </button>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-dark-border bg-dark-bg">
                <img
                  src={item.resultImage}
                  alt="Result"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Parameters Info */}
          <div className="space-y-4 p-4 rounded-xl bg-dark-bg border border-dark-border">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings2 size={14} className="text-brand-400" />
              {t.historySettings}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Mode */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider">{t.historyMode}</label>
                <div className={`flex items-center gap-2 ${modeInfo.color}`}>
                  {modeInfo.icon}
                  <span className="font-medium">{modeInfo.name}</span>
                </div>
              </div>

              {/* Style (for Style Mode) */}
              {styleName && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase tracking-wider">{t.historyStyle}</label>
                  <p className="text-slate-300">{styleName}</p>
                </div>
              )}

              {/* Reference (for Reference Mode) */}
              {referenceName && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase tracking-wider">{t.historyReference}</label>
                  <p className="text-slate-300">{referenceName}</p>
                </div>
              )}

              {/* Image Config (for Free Mode) */}
              {item.imageConfig && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 uppercase tracking-wider">{t.aspectRatio}</label>
                    <p className="text-slate-300">{item.imageConfig.aspectRatio}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 uppercase tracking-wider">{t.imageResolution}</label>
                    <p className="text-slate-300">{item.imageConfig.imageSize}</p>
                  </div>
                </>
              )}
            </div>

            {/* Prompt (for Free Mode) */}
            {item.customPrompt && (
              <div className="space-y-2 pt-3 border-t border-dark-border">
                <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <FileText size={12} />
                  {t.historyPrompt}
                </label>
                <p className="text-slate-300 text-sm leading-relaxed p-3 rounded-lg bg-dark-surface border border-dark-border">
                  {item.customPrompt}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-dark-border bg-dark-bg/50 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-dark-border transition-colors"
          >
            {t.historyClose}
          </button>
          
          <button
            onClick={handleRestore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20 transition-all duration-200"
          >
            <RotateCcw size={16} />
            {t.historyRestore}
          </button>
        </div>
      </div>
    </div>
  );
};

