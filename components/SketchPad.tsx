'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Undo, Eraser, PenTool } from 'lucide-react';
import { Button } from './Button';
import { TRANSLATIONS } from '@/lib/constants';
import { Language } from '@/lib/types';

interface SketchPadProps {
  onSave: (dataUrl: string, maskDataUrl?: string) => void;
  onClose: () => void;
  language: Language;
  backgroundImage?: string | null;
  mode?: 'drawing' | 'masking'; // 新增：绘图模式 or 遮罩模式
}

export const SketchPad: React.FC<SketchPadProps> = ({ onSave, onClose, language, backgroundImage, mode = 'drawing' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null); // 新增：遮罩层 Canvas
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(mode === 'masking' ? 'rgba(255, 0, 0, 0.5)' : '#ef4444'); // Masking 模式默认半透明红色
  // Masking 模式默认更粗的笔刷，移动端手指操作需要更大
  const [lineWidth, setLineWidth] = useState(mode === 'masking' ? 30 : 6);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const t = TRANSLATIONS[language];

  /* New State for Undo */
  const [history, setHistory] = useState<Array<{ main: ImageData, mask: ImageData | null }>>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const setupCanvas = () => {
      // Set canvas size to window size for fullscreen feel, or fixed container
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // If background image exists, draw it
      if (backgroundImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = backgroundImage;
        img.onload = () => {
          // Calculate aspect ratio fit
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width / 2) - (img.width / 2) * scale;
          const y = (canvas.height / 2) - (img.height / 2) * scale;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

          // Save initial state after image loads
          saveHistory();
        };
      } else {
        // White background for pure sketch
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Save initial state
        saveHistory();
      }

      // 如果是 masking 模式，初始化遮罩 Canvas
      if (mode === 'masking' && maskCanvas) {
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (maskCtx) {
          // 遮罩初始化为全黑（表示不修改）
          maskCtx.fillStyle = '#000000';
          maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
          maskCtx.lineCap = 'round';
          maskCtx.lineJoin = 'round';
        }
      }
    };

    setupCanvas();

    // Handle resize
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [backgroundImage, mode]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mainData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let maskData = null;

    if (mode === 'masking' && maskCanvas) {
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      }
    }

    // If we are effectively "rewriting" history by drawing after undoing, truncate future history
    const newHistory = history.slice(0, historyStep + 1);

    newHistory.push({ main: mainData, mask: maskData });
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      const rectoredState = history[newStep];

      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;

      if (canvas && rectoredState.main) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.putImageData(rectoredState.main, 0, 0);
      }

      if (mode === 'masking' && maskCanvas && rectoredState.mask) {
        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx) maskCtx.putImageData(rectoredState.mask, 0, 0);
      }

      setHistoryStep(newStep);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);

    // 在主 Canvas 上绘制（用于可视化反馈）
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = lineWidth;

    // 如果是 masking 模式，同时在遮罩 Canvas 上绘制白色
    if (mode === 'masking' && maskCanvas) {
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskCtx.beginPath();
        maskCtx.moveTo(x, y);
        maskCtx.strokeStyle = tool === 'eraser' ? '#000000' : '#ffffff'; // 画笔=白色（需修改），橡皮=黑色（保留）
        maskCtx.lineWidth = lineWidth;
      }
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);

    // 在主 Canvas 上绘制
    ctx.lineTo(x, y);
    ctx.stroke();

    // 如果是 masking 模式，同时在遮罩 Canvas 上绘制
    if (mode === 'masking' && maskCanvas) {
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskCtx.lineTo(x, y);
        maskCtx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistory();
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleSave = () => {
    if (canvasRef.current) {
      const mainImage = canvasRef.current.toDataURL('image/jpeg', 0.8);

      // 如果是 masking 模式，同时导出遮罩图
      if (mode === 'masking' && maskCanvasRef.current) {
        const maskImage = maskCanvasRef.current.toDataURL('image/jpeg', 0.9);
        onSave(mainImage, maskImage);
      } else {
        onSave(mainImage);
      }
    }
  };

  const colors = mode === 'masking'
    ? ['rgba(255, 0, 0, 0.5)'] // Masking 模式只提供半透明红色
    : ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#000000', '#ffffff'];

  // 移动端检测
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Masking 模式在移动端使用更大的笔刷
  const minLineWidth = mode === 'masking' ? 10 : 1;
  const maxLineWidth = mode === 'masking' ? 60 : 30;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-2 sm:p-4">
      {/* Header - 移动端紧凑布局 */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between mb-2 sm:mb-4 text-white px-1">
        <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
          <PenTool size={18} className="sm:w-5 sm:h-5" /> 
          <span className="hidden sm:inline">{mode === 'masking' ? (language === 'zh' ? '遮罩模式' : 'Masking Mode') : t.sketchTitle}</span>
          <span className="sm:hidden">{mode === 'masking' ? (language === 'zh' ? '遮罩' : 'Mask') : (language === 'zh' ? '绘图' : 'Draw')}</span>
        </h2>
        <button 
          onClick={onClose} 
          className="p-2 sm:p-3 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors"
        >
          <X size={24} className="sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Canvas Area - 移动端使用更多垂直空间 */}
      <div className="relative w-full max-w-4xl mx-auto flex-1 min-h-0 bg-dark-surface rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair touch-none"
        />
      </div>

      {/* Controls - 移动端响应式布局 */}
      <div className="w-full max-w-4xl mx-auto mt-2 sm:mt-4 p-3 sm:p-4 bg-dark-surface rounded-xl border border-slate-700">
        {/* 第一行：工具和笔刷大小 */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3">
          {/* Tools - 增大触摸区域 */}
          <div className="flex gap-1 p-1 bg-dark-bg rounded-lg border border-slate-700">
            <button
              onClick={() => setTool('pen')}
              className={`p-3 sm:p-2 rounded-md transition-colors ${tool === 'pen' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white active:bg-white/10'}`}
            >
              <PenTool size={20} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-3 sm:p-2 rounded-md transition-colors ${tool === 'eraser' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white active:bg-white/10'}`}
            >
              <Eraser size={20} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          {/* Line Width - 移动端更宽的滑块 */}
          <div className="flex-1 flex items-center gap-2 px-2 max-w-[200px] sm:max-w-[180px]">
            <div className={`w-2 h-2 rounded-full bg-current flex-shrink-0 ${tool === 'pen' ? 'text-white' : 'text-slate-500'}`}></div>
            <input
              type="range"
              min={minLineWidth}
              max={maxLineWidth}
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="flex-1 h-2 accent-brand-500 cursor-pointer"
            />
            <div className={`w-4 h-4 rounded-full bg-current flex-shrink-0 ${tool === 'pen' ? 'text-white' : 'text-slate-500'}`}></div>
          </div>

          {/* Undo - 移动端单独放在右侧 */}
          <button
            onClick={undo}
            disabled={historyStep <= 0}
            className={`p-3 sm:p-2 rounded-lg border border-slate-700 transition-colors ${historyStep <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 active:bg-white/20'}`}
          >
            <Undo size={20} className="sm:w-4 sm:h-4 text-slate-300" />
          </button>
        </div>

        {/* 第二行：颜色选择器(drawing模式) + 保存按钮 */}
        <div className="flex items-center justify-between gap-2">
          {/* Colors (只在 drawing 模式显示) - 移动端滚动 */}
          {mode === 'drawing' ? (
            <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setTool('pen');
                  }}
                  className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full border-2 transition-transform flex-shrink-0 active:scale-95 ${color === c && tool === 'pen' ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          ) : (
            <div className="flex-1" /> /* Masking 模式的占位 */
          )}

          {/* Save Button - 移动端更大的触摸区域 */}
          <Button 
            variant="primary" 
            onClick={handleSave} 
            icon={<Check size={18} />}
            className="px-4 sm:px-6 py-3 sm:py-2 text-sm sm:text-base flex-shrink-0"
          >
            <span className="hidden sm:inline">{t.saveSketch}</span>
            <span className="sm:hidden">{language === 'zh' ? '保存' : 'Save'}</span>
          </Button>
        </div>
      </div>

      {/* Instructions - 移动端更紧凑 */}
      <p className="text-slate-400 text-[10px] sm:text-xs mt-2 text-center px-4 max-w-4xl mx-auto">
        {mode === 'masking'
          ? (language === 'zh' ? '涂抹需要修改的区域（红色部分将被AI重绘）' : 'Paint areas to modify (red = AI repaint)')
          : t.sketchInstructions
        }
      </p>

      {/* 隐藏的遮罩 Canvas，仅在 masking 模式使用 */}
      {mode === 'masking' && (
        <canvas ref={maskCanvasRef} style={{ display: 'none' }} />
      )}
    </div>
  );
};
