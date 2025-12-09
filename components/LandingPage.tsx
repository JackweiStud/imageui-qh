'use client';

import React from 'react';
import { AppMode, Language } from '@/lib/types';
import { Sparkles, Camera, ArrowRight, ImagePlus, Edit3, Layers, Eraser, Shirt, Play, Command, ChevronRight, Globe } from 'lucide-react';
import { TRANSLATIONS } from '@/lib/constants';
import { useAuth } from './auth/AuthProvider';

interface LandingPageProps {
  onSelectMode: (mode: AppMode) => void;
  language: Language;
  onToggleLanguage: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectMode, language, onToggleLanguage }) => {
  const t = TRANSLATIONS[language];
  const { user, openAuthModal, signOut, credits } = useAuth();

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
                <span className="text-xs text-brand-400">{credits} Credits</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4F46F] to-emerald-500 flex items-center justify-center text-black font-bold text-sm">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
              <button
                onClick={() => signOut()}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {t.signOut}
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => openAuthModal()}
                className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {t.login}
              </button>
              <button
                onClick={() => onSelectMode(AppMode.FREE_MODE)} // Direct access for "Get Started"
                className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-slate-200 transition-colors shadow-lg shadow-white/5"
              >
                {t.getStarted}
              </button>
            </>
          )}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-colors text-slate-300 text-xs font-medium"
          >
            <Globe size={14} />
            {language === 'en' ? 'English' : '中文'}
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center">

        {/* Hero Section */}
        <div className="w-full max-w-7xl px-6 pt-20 pb-24 md:pt-32 md:pb-32 text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
            {t.landingHeroTitle1}<br />
            {t.landingHeroTitle2}<br />
            <span className="text-brand-400">{t.landingHeroTitle3}</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
            {t.landingHeroDesc}
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 fill-mode-both">
            <button
              onClick={() => onSelectMode(AppMode.FREE_MODE)}
              className="group relative px-8 py-4 rounded-full bg-brand-500 text-black font-bold text-lg hover:bg-brand-400 transition-all shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-1 w-full md:w-auto"
            >
              {t.startCreating} <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                const grid = document.getElementById('features-grid');
                grid?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 rounded-full bg-white/5 text-white font-semibold text-lg hover:bg-white/10 border border-white/10 transition-all w-full md:w-auto"
            >
              {t.exploreFeatures}
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div id="features-grid" className="w-full max-w-7xl px-6 pb-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <span className="text-slate-500 text-sm font-medium uppercase tracking-widest">{t.chooseWorkflow}</span>
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
        <p>{t.footerCopyright}</p>
      </footer>
    </div>
  );
};

// Helper Component for consistency
// Helper Component for consistency
const FeatureCard = ({ icon, color, title, description, onClick, delay }: any) => {
  // Dynamic color mapping for the icon box
  const iconColorClasses: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)]",
    cyan: "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_50px_-12px_rgba(34,211,238,0.5)]",
    purple: "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:shadow-[0_0_50px_-12px_rgba(168,85,247,0.5)]",
    pink: "bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/20 group-hover:shadow-[0_0_50px_-12px_rgba(236,72,153,0.5)]",
    emerald: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)]",
    red: "bg-red-500/10 text-red-400 group-hover:bg-red-500/20 group-hover:shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)]",
  };

  // Dynamic hover background for the entire card
  const cardHoverClasses: Record<string, string> = {
    blue: "hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-blue-600/5 hover:border-blue-500/20",
    cyan: "hover:bg-gradient-to-br hover:from-cyan-500/10 hover:to-cyan-600/5 hover:border-cyan-500/20",
    purple: "hover:bg-gradient-to-br hover:from-purple-500/10 hover:to-purple-600/5 hover:border-purple-500/20",
    pink: "hover:bg-gradient-to-br hover:from-pink-500/10 hover:to-pink-600/5 hover:border-pink-500/20",
    emerald: "hover:bg-gradient-to-br hover:from-emerald-500/10 hover:to-emerald-600/5 hover:border-emerald-500/20",
    red: "hover:bg-gradient-to-br hover:from-red-500/10 hover:to-red-600/5 hover:border-red-500/20",
  };

  return (
    <button
      onClick={onClick}
      className={`group relative p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-dark-surface border border-white/5 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] text-left flex flex-col min-h-[180px] sm:h-64 justify-between overflow-hidden ${cardHoverClasses[color]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 right-0 p-8 sm:p-12 opacity-0 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500`}>
        {/* Clone icon for background effect */}
        {React.cloneElement(icon, { size: 100 })}
      </div>

      <div className="relative z-10">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-all duration-300 ${iconColorClasses[color]}`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">{title}</h3>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      <div className="relative z-10 flex items-center text-white/40 group-hover:text-white active:text-brand-400 transition-colors text-xs sm:text-sm font-medium mt-3 sm:mt-4">
        Try Now <ChevronRight size={14} className="sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};
