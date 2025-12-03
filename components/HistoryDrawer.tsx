'use client';

import React from 'react';
import { HistoryItem, Language, AppMode } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/constants';
import { History, X, Trash2, ChevronLeft, ChevronRight, Clock, Wand2, Edit3, Image as ImageIcon, Layers } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  language: Language;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onToggle,
  history,
  onSelectItem,
  onDeleteItem,
  onClearAll,
  language
}) => {
  const t = TRANSLATIONS[language];

  // 格式化时间差
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t.historyJustNow;
    if (minutes < 60) return `${minutes} ${t.historyMinutesAgo}`;
    if (hours < 24) return `${hours} ${t.historyHoursAgo}`;
    return `${days} ${t.historyDaysAgo}`;
  };

  // 获取模式图标
  const getModeIcon = (mode: AppMode) => {
    switch (mode) {
      case AppMode.STYLE_MODE:
        return <Wand2 size={12} className="text-brand-400" />;
      case AppMode.FREE_MODE:
        return <Edit3 size={12} className="text-emerald-400" />;
      case AppMode.REFERENCE_MODE:
        return <ImageIcon size={12} className="text-purple-400" />;
      case AppMode.CUSTOM_REF_MODE:
        return <Layers size={12} className="text-amber-400" />;
      default:
        return <Wand2 size={12} className="text-slate-400" />;
    }
  };

  // 获取模式名称
  const getModeName = (mode: AppMode): string => {
    switch (mode) {
      case AppMode.STYLE_MODE:
        return language === 'zh' ? '风格滤镜' : 'Style';
      case AppMode.FREE_MODE:
        return language === 'zh' ? '自由创作' : 'Free';
      case AppMode.REFERENCE_MODE:
        return language === 'zh' ? '参考替换' : 'Reference';
      case AppMode.CUSTOM_REF_MODE:
        return language === 'zh' ? '自定义移植' : 'Custom';
      default:
        return '';
    }
  };

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={onToggle}
        className={`
          fixed left-0 top-1/2 -translate-y-1/2 z-40
          flex items-center gap-1 px-2 py-3 
          bg-dark-surface border border-dark-border border-l-0
          rounded-r-xl shadow-lg
          text-slate-400 hover:text-white hover:bg-dark-surface/80
          transition-all duration-300
          ${isOpen ? 'translate-x-72' : 'translate-x-0'}
        `}
        title={t.history}
      >
        {isOpen ? (
          <ChevronLeft size={16} />
        ) : (
          <>
            <History size={16} />
            <ChevronRight size={14} />
          </>
        )}
      </button>

      {/* Drawer Panel */}
      <div
        className={`
          fixed left-0 top-0 bottom-0 z-30
          w-72 bg-dark-surface border-r border-dark-border
          shadow-2xl shadow-black/50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-dark-border flex items-center justify-between bg-dark-bg/50">
          <div className="flex items-center gap-2">
            <History size={20} className="text-brand-400" />
            <h2 className="text-lg font-bold text-white">{t.historyTitle}</h2>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-dark-border text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-full bg-dark-border/50 flex items-center justify-center mb-4">
                <History size={28} className="text-slate-500" />
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t.historyEmpty}
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="group relative bg-dark-bg rounded-xl border border-dark-border hover:border-brand-500/50 transition-all duration-200 overflow-hidden cursor-pointer"
                onClick={() => onSelectItem(item)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden">
                  <img
                    src={item.resultImage}
                    alt="Result"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t.historyDeleteConfirm)) {
                        onDeleteItem(item.id);
                      }
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-slate-400 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title={t.historyDelete}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  {/* Mode & Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-dark-border/50">
                      {getModeIcon(item.appMode)}
                      <span className="text-[10px] font-medium text-slate-400">
                        {getModeName(item.appMode)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock size={10} />
                      {formatTimeAgo(item.timestamp)}
                    </div>
                  </div>

                  {/* Prompt preview (if available) */}
                  {item.customPrompt && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      "{item.customPrompt}"
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - Clear All */}
        {history.length > 0 && (
          <div className="p-3 border-t border-dark-border bg-dark-bg/50">
            <button
              onClick={() => {
                if (confirm(t.historyClearConfirm)) {
                  onClearAll();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all duration-200"
            >
              <Trash2 size={14} />
              {t.historyClearAll}
            </button>
          </div>
        )}
      </div>

      {/* Backdrop when open (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};

