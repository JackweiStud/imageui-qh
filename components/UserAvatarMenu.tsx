'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LogOut, CreditCard, User } from 'lucide-react';
import { Language } from '@/lib/types';

interface UserAvatarMenuProps {
    user: {
        email?: string;
        user_metadata?: {
            avatar_url?: string;
            full_name?: string;
        };
    };
    credits: number;
    onSignOut: () => void;
    language: Language;
    theme?: 'light' | 'dark';
}

export const UserAvatarMenu: React.FC<UserAvatarMenuProps> = ({
    user,
    credits,
    onSignOut,
    language,
    theme = 'dark',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const userEmail = user.email || '';
    const avatarUrl = user.user_metadata?.avatar_url;
    const initial = userName[0]?.toUpperCase() || 'U';

    const isLight = theme === 'light';

    return (
        <div ref={menuRef} className="relative">
            {/* Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          relative w-8 h-8 rounded-full overflow-hidden
          ring-2 ring-offset-2 transition-all duration-200
          hover:ring-4 hover:scale-105 active:scale-95
          ${isLight
                        ? 'ring-brand-500/30 ring-offset-[#FDFBF7] hover:ring-brand-500/50'
                        : 'ring-brand-500/30 ring-offset-dark-bg hover:ring-brand-500/50'
                    }
        `}
                aria-label="User menu"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={userName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-base">
                        {initial}
                    </div>
                )}

                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={`
            absolute right-0 mt-3 w-72 rounded-2xl shadow-2xl overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-200
            ${isLight
                            ? 'bg-white border border-slate-200'
                            : 'bg-dark-surface border border-dark-border'
                        }
          `}
                >
                    {/* User Info Header */}
                    <div className={`p-4 ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                        <div className="flex items-center gap-3">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={userName}
                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500/20"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-brand-500/20">
                                    {initial}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                    {userName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Credits Section */}
                    <div className={`px-4 py-3 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-brand-50' : 'bg-brand-500/10'}`}>
                                    <CreditCard size={16} className="text-brand-500" />
                                </div>
                                <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                                    {language === 'zh' ? '积分余额' : 'Credits'}
                                </span>
                            </div>
                            <span className="font-bold text-brand-500 text-lg">
                                {credits}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={`p-2 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onSignOut();
                            }}
                            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
                ${isLight
                                    ? 'hover:bg-red-50 text-slate-600 hover:text-red-600'
                                    : 'hover:bg-red-500/10 text-slate-300 hover:text-red-400'
                                }
              `}
                        >
                            <LogOut size={18} />
                            <span className="font-medium">
                                {language === 'zh' ? '退出登录' : 'Sign Out'}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
