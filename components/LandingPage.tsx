'use client';

import React from 'react';
import { AppMode, Language } from '@/lib/types';
import { Sparkles, Camera, ArrowRight, ImagePlus, Edit3, Layers, Eraser, Shirt, Play, Command, ChevronRight } from 'lucide-react';
import { TRANSLATIONS } from '@/lib/constants';
import { useAuth } from './auth/AuthProvider';

interface LandingPageProps {
  onSelectMode: (mode: AppMode) => void;
  language: Language;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectMode, language }) => {
  const t = TRANSLATIONS[language];
  const { user, openAuthModal, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-white selection:bg-brand-500/30 font-sans">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-white/5 sticky top-0 bg-dark-bg/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Sparkles size={20} className="md:w-6 md:h-6" />
          </div>
          <span className="text-xl md:text-2xl font-bold tracking-tight">StyleMorph AI</span>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-medium text-white">{user.email}</span>
                <span className="text-xs text-brand-400">Free Plan</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4F46F] to-emerald-500 flex items-center justify-center text-black font-bold text-sm">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
              <button
                onClick={() => signOut()}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => openAuthModal()}
                className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => onSelectMode(AppMode.FREE_MODE)} // Direct access for "Get Started"
                className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-slate-200 transition-colors shadow-lg shadow-white/5"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center">

        {/* Hero Section */}
        <div className="w-full max-w-7xl px-6 pt-20 pb-24 md:pt-32 md:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm text-brand-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles size={14} />
            <span>Powered by Gemini 2.0 Multimodal</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
            Sketch it.<br />
            Prompt it.<br />
            <span className="text-brand-400">Morph it.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
            The infinite canvas where your ideas become reality.
            Use AI to transform photos, sketches, and prompts into stunning visuals in seconds.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 fill-mode-both">
            <button
              onClick={() => onSelectMode(AppMode.FREE_MODE)}
              className="group relative px-8 py-4 rounded-full bg-brand-500 text-black font-bold text-lg hover:bg-brand-400 transition-all shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-1 w-full md:w-auto"
            >
              Start Creating <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                const grid = document.getElementById('features-grid');
                grid?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 rounded-full bg-white/5 text-white font-semibold text-lg hover:bg-white/10 border border-white/10 transition-all w-full md:w-auto"
            >
              Explore Features
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div id="features-grid" className="w-full max-w-7xl px-6 pb-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <span className="text-slate-500 text-sm font-medium uppercase tracking-widest">Choose Your Workflow</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* 1. Style Filters */}
            <FeatureCard
              icon={<Sparkles size={24} />}
              color="blue"
              title={t.styleFilters}
              description={t.styleFiltersDesc}
              onClick={() => onSelectMode(AppMode.STYLE_MODE)}
              delay={0}
            />

            {/* 2. Professional Try-On */}
            <FeatureCard
              icon={<Shirt size={24} />}
              color="cyan"
              title={t.professionalTryOn}
              description={t.professionalTryOnDesc}
              onClick={() => onSelectMode(AppMode.VIRTUAL_TRY_ON)}
              delay={100}
            />

            {/* 3. Reference Swap */}
            <FeatureCard
              icon={<Camera size={24} />}
              color="purple"
              title={t.virtualTryOn}
              description={t.virtualTryOnDesc}
              onClick={() => onSelectMode(AppMode.REFERENCE_MODE)}
              delay={200}
            />

            {/* 4. Custom Swap */}
            <FeatureCard
              icon={<Layers size={24} />}
              color="pink"
              title={t.customSwap}
              description={t.customSwapSubtitle}
              onClick={() => onSelectMode(AppMode.CUSTOM_REF_MODE)}
              delay={300}
            />

            {/* 5. Free Style */}
            <FeatureCard
              icon={<Edit3 size={24} />}
              color="emerald"
              title={t.freeStyle}
              description={t.freeStyleSubtitle}
              onClick={() => onSelectMode(AppMode.FREE_MODE)}
              delay={400}
            />

            {/* 6. Inpainting */}
            <FeatureCard
              icon={<Eraser size={24} />}
              color="red"
              title={language === 'zh' ? '局部重绘' : 'Inpainting'}
              description={language === 'zh' ? '涂抹修复图片瑕疵' : 'Paint to fix image defects'}
              onClick={() => onSelectMode(AppMode.INPAINTING_MODE)}
              delay={500}
            />

          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full py-8 border-t border-white/5 text-center text-slate-600 text-sm">
        <p>© 2025 StyleMorph AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

// Helper Component for consistency
const FeatureCard = ({ icon, color, title, description, onClick, delay }: any) => {
  // Dynamic color mapping
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]",
    cyan: "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_50px_-12px_rgba(34,211,238,0.3)]",
    purple: "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:shadow-[0_0_50px_-12px_rgba(168,85,247,0.3)]",
    pink: "bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/20 group-hover:shadow-[0_0_50px_-12px_rgba(236,72,153,0.3)]",
    emerald: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)]",
    red: "bg-red-500/10 text-red-400 group-hover:bg-red-500/20 group-hover:shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]",
  };

  return (
    <button
      onClick={onClick}
      className="group relative p-8 rounded-3xl bg-dark-surface border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 text-left flex flex-col h-64 justify-between overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 right-0 p-12 opacity-0 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500`}>
        {/* Clone icon for background effect */}
        {React.cloneElement(icon, { size: 120 })}
      </div>

      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${colorClasses[color]}`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      <div className="relative z-10 flex items-center text-white/40 group-hover:text-white transition-colors text-sm font-medium mt-4">
        Try Now <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};
