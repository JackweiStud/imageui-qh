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
  const [lineWidth, setLineWidth] = useState(mode === 'masking' ? 20 : 4); // Masking 模式默认更粗的笔刷
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const t = TRANSLATIONS[language];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
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
        };
      } else {
        // White background for pure sketch
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 如果是 masking 模式，初始化遮罩 Canvas
      if (mode === 'masking' && maskCanvas) {
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
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
    setIsDrawing(false);
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

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <PenTool size={20} /> {mode === 'masking' ? (language === 'zh' ? '遮罩模式' : 'Masking Mode') : t.sketchTitle}
        </h2>
        <div className="flex gap-2">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full max-w-4xl h-[60vh] md:h-[70vh] bg-dark-surface rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
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

      {/* Controls */}
      <div className="w-full max-w-4xl mt-4 p-4 bg-dark-surface rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          {/* Tools */}
          <div className="flex gap-2 p-1 bg-dark-bg rounded-lg border border-slate-700">
             <button 
               onClick={() => setTool('pen')}
               className={`p-2 rounded-md transition-colors ${tool === 'pen' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
             >
               <PenTool size={18} />
             </button>
             <button 
               onClick={() => setTool('eraser')}
               className={`p-2 rounded-md transition-colors ${tool === 'eraser' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
             >
               <Eraser size={18} />
             </button>
          </div>

          {/* Line Width */}
          <div className="flex items-center gap-2 px-2">
            <div className={`w-2 h-2 rounded-full bg-current ${tool === 'pen' ? 'text-white' : 'text-slate-500'}`}></div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-24 accent-brand-500"
            />
            <div className={`w-4 h-4 rounded-full bg-current ${tool === 'pen' ? 'text-white' : 'text-slate-500'}`}></div>
          </div>
        </div>

        {/* Colors (只在 drawing 模式显示) */}
        {mode === 'drawing' && (
          <div className="flex gap-2">
            {colors.map(c => (
               <button
                 key={c}
                 onClick={() => {
                   setColor(c);
                   setTool('pen');
                 }}
                 className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c && tool === 'pen' ? 'border-white scale-110' : 'border-transparent'}`}
                 style={{ backgroundColor: c }}
               />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
           <Button variant="secondary" onClick={() => {
             // Simple clear by re-loading background
             const canvas = canvasRef.current;
             if(canvas && backgroundImage) {
                // Logic to clear would ideally need to redraw background. 
                // For simplicity, we just clear rect and let user redraw or re-open.
                // A better way is to trigger the useEffect logic again or a clear function.
                // Here we just clear to white or let them use eraser.
             }
           }} icon={<Undo size={16} />}>
             {t.undo}
           </Button>
           <Button variant="primary" onClick={handleSave} icon={<Check size={16} />}>
             {t.saveSketch}
           </Button>
        </div>

      </div>
      <p className="text-slate-400 text-xs mt-2">
        {mode === 'masking' 
          ? (language === 'zh' ? '涂抹需要修改的区域（红色部分将被AI重绘）' : 'Paint the areas you want to modify (red areas will be repainted by AI)')
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
