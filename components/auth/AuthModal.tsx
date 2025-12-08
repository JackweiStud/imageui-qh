'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Loader2, Github, Mail } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'signin' }) => {
    const [view, setView] = useState<'signin' | 'signup' | 'email_signin' | 'email_signup'>(initialView);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { signInWithGoogle, signInWithGithub } = useAuth();
    const supabase = createClient();

    if (!isOpen) return null;

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (view === 'email_signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setSuccessMessage('Registration successful! Please check your email for confirmation.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        try {
            setLoading(true);
            if (provider === 'google') await signInWithGoogle();
            if (provider === 'github') await signInWithGithub();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Shared Styles
    const btnBase = "w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3";
    const btnPrimary = `${btnBase} bg-[#D4F46F] hover:bg-[#bce055] text-black shadow-lg shadow-[#D4F46F]/10`;
    const btnDark = `${btnBase} bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white border border-[#333]`;
    const inputStyle = "w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4F46F] focus:ring-1 focus:ring-[#D4F46F] transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#0F0F0F] rounded-2xl shadow-2xl border border-[#222] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    {/* Logo / Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-10 h-10 mb-4 text-[#D4F46F]">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-2 1 5 2.5 2-1zm0 0l5-2.5 2 1-5 2.5-2-1z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-white mb-2">
                            {view.includes('signup') ? 'Create account' : 'Welcome back'}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            {view.includes('signup') ? 'Sign up to start creating' : 'Sign in to your account'}
                        </p>
                    </div>

                    {/* Social Buttons */}
                    {(view === 'signin' || view === 'signup') && (
                        <div className="space-y-3">
                            <button
                                onClick={() => handleSocialLogin('google')}
                                className={btnDark}
                            >
                                <span className="w-5 h-5 flex items-center justify-center">G</span>
                                <span>Sign in with Google</span>
                            </button>

                            <button
                                onClick={() => handleSocialLogin('github')}
                                className={btnDark}
                            >
                                <Github size={20} />
                                <span>Sign in with GitHub</span>
                            </button>
                        </div>
                    )}

                    {/* Divider */}
                    {(view === 'signin' || view === 'signup') && (
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#222]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-[#0F0F0F] text-gray-500">or</span>
                            </div>
                        </div>
                    )}

                    {/* Email View */}
                    {(view === 'signin' || view === 'signup') ? (
                        <button
                            onClick={() => setView(view === 'signin' ? 'email_signin' : 'email_signup')}
                            className={btnDark + " w-full"}
                        >
                            <Mail size={20} />
                            <span>Continue with email</span>
                        </button>
                    ) : (
                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                    {error}
                                </div>
                            )}
                            {successMessage && (
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                                    {successMessage}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className={inputStyle}
                                    placeholder="name@example.com"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={inputStyle}
                                    placeholder="Enter your password"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={btnPrimary}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (view === 'email_signup' ? 'Sign up' : 'Sign in')}
                            </button>

                            <button
                                type="button"
                                onClick={() => setView('signin')}
                                className="w-full text-sm text-gray-500 hover:text-white transition-colors py-2"
                            >
                                Back to all options
                            </button>
                        </form>
                    )}

                    {/* Footer toggle */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-400">
                            {view.includes('signin') ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setView(view.includes('signin') ? 'signup' : 'signin')}
                                className="text-[#D4F46F] hover:underline hover:text-[#bce055]"
                            >
                                {view.includes('signin') ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};
