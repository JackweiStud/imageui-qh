'use client';

import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X, Plus } from 'lucide-react';
import { Button } from './Button';
import { Language } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/constants';

const MAX_IMAGES = 5;

interface MultiImageUploaderProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    language: Language;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
    images,
    onImagesChange,
    language
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const t = TRANSLATIONS[language];

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) return;
        if (images.length >= MAX_IMAGES) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                const newImages = [...images, e.target.result as string];
                onImagesChange(newImages);
                setActiveIndex(newImages.length - 1);
            }
        };
        reader.readAsDataURL(file);
    }, [images, onImagesChange]);

    const handleMultipleFiles = useCallback((files: FileList) => {
        const remainingSlots = MAX_IMAGES - images.length;
        const filesToAdd = Array.from(files).slice(0, remainingSlots);

        let newImages = [...images];
        let loadedCount = 0;

        filesToAdd.forEach((file) => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    newImages = [...newImages, e.target.result as string];
                    loadedCount++;

                    if (loadedCount === filesToAdd.length) {
                        onImagesChange(newImages);
                        setActiveIndex(newImages.length - 1);
                    }
                }
            };
            reader.readAsDataURL(file);
        });
    }, [images, onImagesChange]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (e.dataTransfer.files.length === 1) {
                handleFile(e.dataTransfer.files[0]);
            } else {
                handleMultipleFiles(e.dataTransfer.files);
            }
        }
    }, [handleFile, handleMultipleFiles]);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            if (e.target.files.length === 1) {
                handleFile(e.target.files[0]);
            } else {
                handleMultipleFiles(e.target.files);
            }
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
        if (activeIndex >= newImages.length) {
            setActiveIndex(Math.max(0, newImages.length - 1));
        }
    };

    const clearAll = () => {
        onImagesChange([]);
        setActiveIndex(0);
    };

    // Empty state - no images uploaded yet
    if (images.length === 0) {
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
                <p className="text-slate-400 text-sm mb-2 text-center max-w-xs">
                    {t.dragDrop}
                </p>
                <p className="text-slate-500 text-xs mb-6">
                    {language === 'zh' ? `最多可上传 ${MAX_IMAGES} 张图片` : `Up to ${MAX_IMAGES} images`}
                </p>
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={onInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="secondary" icon={<ImageIcon size={16} />}>
                        {t.chooseFile}
                    </Button>
                </div>
            </div>
        );
    }

    // Has images - show main preview + thumbnails
    return (
        <div className="w-full h-full min-h-[300px] flex flex-col gap-3">
            {/* Main Preview Area */}
            <div
                className="relative flex-1 bg-dark-surface rounded-2xl border border-dark-border overflow-hidden"
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
            >
                <img
                    src={images[activeIndex]}
                    alt={`Image ${activeIndex + 1}`}
                    className="w-full h-full object-contain bg-black/40"
                />

                {/* Clear All Button */}
                <div className="absolute top-3 right-3">
                    <button
                        onClick={clearAll}
                        className="p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-colors"
                        title={language === 'zh' ? '清除所有图片' : 'Clear all images'}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Image Counter Badge */}
                <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1.5 rounded-full text-xs text-white backdrop-blur-sm flex items-center gap-2">
                    <ImageIcon size={14} />
                    <span>{activeIndex + 1} / {images.length}</span>
                </div>

                {/* Drag overlay */}
                {isDragging && (
                    <div className="absolute inset-0 bg-brand-500/20 border-2 border-dashed border-brand-400 rounded-2xl flex items-center justify-center">
                        <div className="bg-dark-bg/90 px-4 py-2 rounded-lg text-brand-400 text-sm font-medium">
                            {language === 'zh' ? '放开以添加图片' : 'Drop to add image'}
                        </div>
                    </div>
                )}
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {images.map((img, index) => (
                    <div
                        key={index}
                        className={`
              relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer
              border-2 transition-all duration-150 group
              ${index === activeIndex
                                ? 'border-brand-500 ring-2 ring-brand-500/30'
                                : 'border-dark-border hover:border-slate-500'
                            }
            `}
                        onClick={() => setActiveIndex(index)}
                    >
                        <img
                            src={img}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        {/* Delete overlay on hover */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeImage(index);
                            }}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                            <X size={16} className="text-white" />
                        </button>
                        {/* Index badge */}
                        <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[10px] px-1 rounded">
                            {index + 1}
                        </div>
                    </div>
                ))}

                {/* Add More Button */}
                {images.length < MAX_IMAGES && (
                    <div className="relative flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-dark-border hover:border-brand-400 bg-dark-surface hover:bg-dark-surface/80 transition-colors cursor-pointer flex items-center justify-center">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={onInputChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Plus size={20} className="text-slate-400" />
                    </div>
                )}
            </div>
        </div>
    );
};
