'use client';

import React, { useState } from 'react';
import { AppMode, Language } from '@/lib/types';
import { Sparkles, Camera, ArrowRight, Edit3, Layers, Eraser, Shirt, ChevronRight, Globe } from 'lucide-react';
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
  const [previewImage, setPreviewImage] = useState<{ id: number; ext: string } | null>(null);

  return (
    <div className="min-h-screen flex flex-col font-sans">

      {/* ==================== HERO SECTION (Light Theme - CanvAi Style) ==================== */}
      <section className="relative bg-[#FDFBF7] overflow-hidden">

        {/* Navbar - Transparent style like CanvAi */}
        <nav className="relative z-50 flex items-center justify-between px-6 py-5 md:px-16 lg:px-24">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-md">
              <Sparkles size={20} />
            </div>
            <span className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">StyleMorph AI</span>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {user ? (
              <div className="flex items-center gap-3">
                {/* 用户头像 */}
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-9 h-9 rounded-full border-2 border-brand-500/30 shadow-md object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-sm font-semibold text-[#0F172A]">{user.email?.split('@')[0]}</span>
                  <span className="text-xs text-brand-600 font-medium">{credits} Credits</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-sm font-medium text-slate-500 hover:text-[#0F172A] transition-colors"
                >
                  {t.signOut}
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal()}
                  className="text-sm font-semibold text-slate-600 hover:text-[#0F172A] transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onSelectMode(AppMode.FREE_MODE)}
                  className="px-5 py-2.5 rounded-full bg-[#0F172A] text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-sm"
                >
                  Get Started
                </button>
              </>
            )}

            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-slate-600 text-xs font-medium"
            >
              <Globe size={14} />
              {language === 'en' ? 'EN' : '中'}
            </button>
          </div>
        </nav>

        {/* Hero Content - Two Column Layout */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24 pt-12 md:pt-20 pb-4 md:pb-6 lg:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* Left Column: Text Content */}
            <div className="flex flex-col text-left">
              {/* Main Headline - CanvAi uses a serif-like bold font */}
              <h1 className="text-[3.5rem] md:text-[5rem] lg:text-[6rem] font-black leading-[0.95] tracking-tight text-[#0F172A] mb-8">
                <span className="block">Sketch it.</span>
                <span className="block">Frame it.</span>
                <span className="block">Prompt it.</span>
                <span className="relative inline-block text-[#009087]">
                  Ship it.
                  {/* Hand-drawn underline SVG */}
                  <svg
                    className="absolute w-full h-[0.15em] -bottom-1 left-0"
                    viewBox="0 0 200 20"
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <path
                      d="M2 15 Q 50 5, 100 12 T 198 8"
                      stroke="#009087"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-slate-500 max-w-lg mb-10 leading-relaxed">
                {language === 'en'
                  ? "The infinite canvas where rough sketches become polished AI art. Compose your ideas, add a prompt, and generate stunning visuals—all in one creative workspace."
                  : "无限画布，让草图变为精美AI艺术。组合创意，添加提示词，生成惊艳视觉作品——尽在一个创意工作区。"}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onSelectMode(AppMode.FREE_MODE)}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#0F172A] text-white font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {t.startCreating}
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={() => {
                    document.getElementById('features-grid')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-4 text-slate-600 font-semibold text-lg hover:text-[#0F172A] transition-colors"
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Column: App Screenshot - macOS Window Style */}
            <div className="relative lg:translate-x-8">
              {/* macOS Window Frame */}
              <div className="relative rounded-xl overflow-hidden shadow-2xl bg-[#1E293B] border border-slate-700/50">
                {/* Window Title Bar */}
                <div className="h-10 bg-[#1E293B] flex items-center px-4 gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27CA40]"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <span className="text-xs text-slate-400 font-medium">stylemorph.ai/dashboard</span>
                  </div>
                </div>

                {/* Window Content - Demo Video */}
                <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                  <video
                    src="/images/presets/demoMp4.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Decorative Shadow/Glow */}
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-400/20 via-purple-400/10 to-pink-400/20 blur-3xl -z-10 rounded-3xl"></div>
            </div>

          </div>
        </div>

        {/* ==================== IMAGE GALLERY MARQUEE ==================== */}
        <div className="relative z-10 w-full overflow-hidden py-4 md:py-6 mb-20 md:mb-32">
          {/* Left/Right Gradient Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-[#FDFBF7] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-[#FDFBF7] to-transparent z-10 pointer-events-none" />

          {/* Scrolling Container */}
          <div
            className="flex gap-4 md:gap-6 animate-marquee hover:[animation-play-state:paused]"
            style={{
              width: 'max-content',
              animationPlayState: previewImage ? 'paused' : 'running', // 预览时暂停动画
            }}
          >
            {/* Gallery images config: id and extension */}
            {(() => {
              const images = [
                { id: 1, ext: 'jpg' }, { id: 2, ext: 'jpg' }, { id: 3, ext: 'jpg' },
                { id: 4, ext: 'jpg' }, { id: 5, ext: 'jpg' }, { id: 6, ext: 'png' },
                { id: 7, ext: 'png' }, { id: 8, ext: 'png' }, { id: 9, ext: 'png' },
                { id: 10, ext: 'png' }, { id: 11, ext: 'png' }, { id: 12, ext: 'png' },
              ];

              const renderImage = (img: { id: number; ext: string }, prefix: string) => (
                <div
                  key={`${prefix}-${img.id}`}
                  className="group relative flex-shrink-0 w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                  onClick={() => setPreviewImage(img)}
                >
                  <img
                    src={`/images/goodpic/optimized/${img.id}.webp`}
                    alt={`Gallery ${img.id}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Hover border effect */}
                  <div className="absolute inset-0 border-4 border-transparent group-hover:border-white/50 rounded-2xl transition-colors duration-300" />
                  {/* Click hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                    <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">
                      {language === 'zh' ? '点击查看' : 'Click to view'}
                    </span>
                  </div>
                </div>
              );

              return (
                <>
                  {/* First set of images */}
                  {images.map((img) => renderImage(img, 'a'))}
                  {/* Duplicate set for seamless loop */}
                  {images.map((img) => renderImage(img, 'b'))}
                </>
              );
            })()}
          </div>

          {/* Preview Modal - Click to close */}
          {previewImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer bg-black/80"
              onClick={() => setPreviewImage(null)}
            >
              <div
                className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={`/images/goodpic/${previewImage.id}.${previewImage.ext}`}
                  alt={`Gallery ${previewImage.id} Full`}
                  className="max-w-full max-h-[85vh] object-contain"
                />
                {/* Close button */}
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>



        {/* ==================== WAVE SEPARATOR (CanvAi Multi-layer Waves) ==================== */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg
            className="relative block w-full h-[120px] md:h-[180px] lg:h-[240px]"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Wave Layer 1: Teal/Cyan */}
            <path
              d="M0,192 C320,280 480,100 720,180 C960,260 1120,120 1440,200 L1440,320 L0,320 Z"
              fill="#06B6D4"
              opacity="0.9"
            />
            {/* Wave Layer 2: Yellow/Gold */}
            <path
              d="M0,224 C240,140 480,280 720,200 C960,120 1200,260 1440,180 L1440,320 L0,320 Z"
              fill="#EAB308"
              opacity="0.9"
            />
            {/* Wave Layer 3: Pink/Rose */}
            <path
              d="M0,256 C180,200 420,300 720,240 C1020,180 1260,280 1440,220 L1440,320 L0,320 Z"
              fill="#EC4899"
              opacity="0.9"
            />
            {/* Wave Layer 4: Dark (connects to next section) */}
            <path
              d="M0,288 C360,240 720,320 1080,260 C1260,230 1380,280 1440,260 L1440,320 L0,320 Z"
              fill="#0f172a"
            />
          </svg>
        </div>

      </section>

      {/* ==================== FEATURES SECTION (Dark Theme) ==================== */}
      <section className="bg-dark-bg text-white flex-1">
        <div id="features-grid" className="w-full max-w-7xl mx-auto px-6 pt-8 md:pt-12 pb-20 md:pb-28">

          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-sm font-semibold mb-4">
              {t.chooseWorkflow}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {language === 'en' ? 'Everything you need' : '您需要的一切'}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              {language === 'en'
                ? 'From rough sketches to polished masterpieces, StyleMorph AI provides all the tools you need.'
                : '从草图到精美杰作，StyleMorph AI 提供您所需的所有工具。'}
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Sparkles size={24} />}
              color="blue"
              title={t.styleFilters}
              description={t.styleFiltersDesc}
              onClick={() => onSelectMode(AppMode.STYLE_MODE)}
              delay={0}
            />
            <FeatureCard
              icon={<Shirt size={24} />}
              color="cyan"
              title={t.professionalTryOn}
              description={t.professionalTryOnDesc}
              onClick={() => onSelectMode(AppMode.VIRTUAL_TRY_ON)}
              delay={100}
            />
            <FeatureCard
              icon={<Camera size={24} />}
              color="purple"
              title={t.virtualTryOn}
              description={t.virtualTryOnDesc}
              onClick={() => onSelectMode(AppMode.REFERENCE_MODE)}
              delay={200}
            />
            <FeatureCard
              icon={<Layers size={24} />}
              color="pink"
              title={t.customSwap}
              description={t.customSwapSubtitle}
              onClick={() => onSelectMode(AppMode.CUSTOM_REF_MODE)}
              delay={300}
            />
            <FeatureCard
              icon={<Edit3 size={24} />}
              color="emerald"
              title={t.freeStyle}
              description={t.freeStyleSubtitle}
              onClick={() => onSelectMode(AppMode.FREE_MODE)}
              delay={400}
            />
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

        {/* Footer */}
        <footer className="w-full py-10 border-t border-white/5 text-center">
          <div className="flex items-center justify-center gap-2 mb-3 text-slate-500">
            <Sparkles size={16} />
            <span className="font-bold">StyleMorph AI</span>
          </div>
          <p className="text-slate-600 text-sm">{t.footerCopyright}</p>
        </footer>
      </section>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, color, title, description, onClick, delay }: any) => {
  const iconColorClasses: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20",
    purple: "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20",
    pink: "bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20",
    red: "bg-red-500/10 text-red-400 group-hover:bg-red-500/20",
  };

  const cardHoverClasses: Record<string, string> = {
    blue: "hover:border-blue-500/30 hover:bg-gradient-to-br hover:from-blue-500/30 hover:to-transparent",
    cyan: "hover:border-cyan-500/30 hover:bg-gradient-to-br hover:from-cyan-500/30 hover:to-transparent",
    purple: "hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-500/30 hover:to-transparent",
    pink: "hover:border-pink-500/30 hover:bg-gradient-to-br hover:from-pink-500/30 hover:to-transparent",
    emerald: "hover:border-emerald-500/30 hover:bg-gradient-to-br hover:from-emerald-500/30 hover:to-transparent",
    red: "hover:border-red-500/30 hover:bg-gradient-to-br hover:from-red-500/30 hover:to-transparent",
  };

  return (
    <button
      onClick={onClick}
      className={`group relative p-6 rounded-2xl bg-dark-surface border border-white/5 transition-all duration-300 hover:-translate-y-1 text-left flex flex-col h-56 justify-between ${cardHoverClasses[color]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors ${iconColorClasses[color]}`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{description}</p>
      </div>
      <div className="flex items-center text-slate-500 group-hover:text-white transition-colors text-sm font-medium">
        Try Now <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};
