'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { Language } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/constants';

interface ImageCompareModalProps {
  originalImage: string;
  resultImage: string;
  language: Language;
  onClose: () => void;
}

export const ImageCompareModal: React.FC<ImageCompareModalProps> = ({
  originalImage,
  resultImage,
  language,
  onClose,
}) => {
  const t = TRANSLATIONS[language];
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算滑块位置
  const calculatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  // 鼠标事件
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    calculatePosition(e.clientX);
  }, [calculatePosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    calculatePosition(e.clientX);
  }, [isDragging, calculatePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 触摸事件
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    calculatePosition(e.touches[0].clientX);
  }, [calculatePosition]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    calculatePosition(e.touches[0].clientX);
  }, [isDragging, calculatePosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 键盘事件
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      setSliderPosition(prev => Math.max(0, prev - 2));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition(prev => Math.min(100, prev + 2));
    }
  }, [onClose]);

  // 注册全局事件监听
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd, handleKeyDown]);

  // 阻止背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 弹窗内容 */}
      <div 
        className="relative w-[90vw] max-w-4xl bg-dark-surface rounded-2xl border border-dark-border shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-bg/50">
          <h2 className="text-lg font-bold text-white">{t.compareTitle}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 图片标签 */}
        <div className="flex justify-between px-6 py-2 text-xs font-medium">
          <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300">{t.compareOriginal}</span>
          <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-400">{t.compareResult}</span>
        </div>

        {/* 对比区域 */}
        <div 
          ref={containerRef}
          className="relative w-full aspect-[4/3] cursor-col-resize select-none overflow-hidden bg-black/40"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* 结果图（底层，完整显示） */}
          <div className="absolute inset-0">
            <img 
              src={resultImage} 
              alt="AI Result" 
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          {/* 原图（顶层，裁剪显示左侧部分） */}
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img 
              src={originalImage} 
              alt="Original" 
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          {/* 分割线 */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10"
            style={{ left: `calc(${sliderPosition}% - 2px)` }}
          >
            {/* 拖动手柄 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-4 bg-slate-400 rounded-full"></div>
                <div className="w-0.5 h-4 bg-slate-400 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* 左右箭头指示 */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-white/60 text-2xl font-thin pointer-events-none"
            style={{ left: `calc(${sliderPosition}% - 40px)` }}
          >
            ‹
          </div>
          <div 
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-white/60 text-2xl font-thin pointer-events-none"
            style={{ left: `calc(${sliderPosition}% + 25px)` }}
          >
            ›
          </div>
        </div>

        {/* 提示文字 */}
        <div className="px-6 py-4 text-center text-xs text-slate-500 border-t border-dark-border bg-dark-bg/30">
          {t.compareHint}
        </div>
      </div>
    </div>
  );
};
