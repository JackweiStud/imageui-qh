'use client';

import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from './Button';
import { Language } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/constants';

interface ImageUploaderProps {
  currentImage: string | null;
  onImageUpload: (base64: string) => void;
  onClear: () => void;
  language: Language;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onImageUpload, onClear, language }) => {
  const [isDragging, setIsDragging] = useState(false);
  const t = TRANSLATIONS[language];

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageUpload(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  if (currentImage) {
    return (
      <div className="relative w-full h-full min-h-[300px] bg-dark-surface rounded-2xl border border-dark-border overflow-hidden group">
        <img 
          src={currentImage} 
          alt="Source" 
          className="w-full h-full object-contain bg-black/40"
        />
        <div className="absolute top-4 right-4">
          <button 
            onClick={onClear}
            className="p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs text-white backdrop-blur-sm">
          {t.originalImage}
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`
        w-full h-full min-h-[300px] flex flex-col items-center justify-center 
        rounded-2xl border-2 border-dashed transition-all duration-200
        ${isDragging 
          ? 'border-brand-500 bg-brand-500/10' 
          : 'border-dark-border bg-dark-surface hover:border-brand-400/50'
        }
      `}
    >
      <div className="bg-dark-bg p-4 rounded-full mb-4">
        <Upload className={`w-8 h-8 ${isDragging ? 'text-brand-400' : 'text-slate-400'}`} />
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{t.uploadImage}</h3>
      <p className="text-slate-400 text-sm mb-6 text-center max-w-xs">
        {t.dragDrop}
      </p>
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={onInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Button variant="secondary" icon={<ImageIcon size={16} />}>
          {t.chooseFile}
        </Button>
      </div>
    </div>
  );
};
