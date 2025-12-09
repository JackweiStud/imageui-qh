'use client';

import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from './Button';

import { Language } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/constants';

interface CreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    requiredCredits: number;
    currentCredits: number;
    language: Language;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({
    isOpen,
    onClose,
    requiredCredits,
    currentCredits,
    language
}) => {
    const t = TRANSLATIONS[language];
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-[#0F0F0F] rounded-2xl shadow-2xl border border-[#222] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center text-red-400 ring-1 ring-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <Sparkles size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                        {language === 'zh' ? '积分不足' : 'Insufficient Credits'}
                    </h3>

                    <p className="text-gray-400 text-sm mb-6 max-w-[280px] leading-relaxed">
                        {language === 'zh' ? (
                            <>
                                生成此图像需要 <span className="text-white font-semibold">{requiredCredits} 积分</span>，但您当前只有 <span className="text-red-400 font-semibold">{currentCredits}</span>。
                            </>
                        ) : (
                            <>
                                You need <span className="text-white font-semibold">{requiredCredits} credits</span> to generate this image, but you only have <span className="text-red-400 font-semibold">{currentCredits}</span>.
                            </>
                        )}
                    </p>

                    <Button
                        onClick={onClose}
                        className="w-full bg-[#D4F46F] hover:bg-[#bce055] text-black border-none font-semibold h-11"
                    >
                        {language === 'zh' ? '我知道了' : 'I Understand'}
                    </Button>

                    <p className="mt-6 text-xs text-slate-400 opacity-60 hover:opacity-100 transition-opacity">
                        {language === 'zh'
                            ? '如需更多帮助，请联系 customerfeedback@huaizhoutechai.com'
                            : 'Please contact customerfeedback@huaizhoutechai.com for more info.'}
                    </p>
                </div>
            </div>
        </div>
    );
};
