import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GenerativeArt } from '../components/GenerativeArt';
import { GlitchText } from '../components/GlitchText';
import { GalleryControlPanel } from '../components/GalleryControlPanel';
import { useTheme, THEMES } from '../context/ThemeContext';
import { Monitor, Activity, Wifi, Box } from 'lucide-react';

type ArtVariant = 'network' | 'particles' | 'matrix' | 'flow';

export const Gallery: React.FC = () => {
  const { theme } = useTheme();
  const [activeVariant, setActiveVariant] = useState<ArtVariant>('network');
  const [intensity, setIntensity] = useState(50);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const variants: { id: ArtVariant; label: string; desc: string }[] = [
    { id: 'network', label: 'Neural Network', desc: 'Simulated nodes with proximity connections.' },
    { id: 'flow', label: 'Noise Field', desc: 'Perlin-like flow vectors visualizing data streams.' },
    { id: 'particles', label: 'Atomic Dust', desc: 'Loose particles reactive to cursor gravity.' },
    { id: 'matrix', label: 'System Rain', desc: 'Raw data visualization cascade.' },
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Theme logic
  const isMatrix = activeVariant === 'matrix';
  const bgClass = isMatrix ? 'bg-black' : 'bg-theme-bg';
  const textClass = isMatrix ? 'text-white' : 'text-theme-text';
  const accentClass = isMatrix ? 'text-[#39ff14]' : 'text-theme-accent';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen relative flex flex-col ${bgClass} transition-colors duration-700`}
    >
      {/* 1. Background Generative Engine - overflow-hidden only here to prevent background overflow */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <GenerativeArt
          variant={activeVariant}
          intensity={intensity}
          speed={speed}
          color={isMatrix ? '#39ff14' : THEMES[theme].text}
        />

        {/* Vignette & Scanlines Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* 2. HUD / UI Layer - Safe viewing area with padding to avoid fixed navigation */}
      <div className="relative z-10 flex-grow flex flex-col min-h-screen pointer-events-none pt-24 md:pt-28 pb-12 md:pb-16 pl-20 md:pl-28 pr-8 md:pr-12">

        {/* Constrained content wrapper for better visual hierarchy */}
        <div className="mx-auto w-full max-w-7xl flex-grow flex flex-col">

          {/* Top Bar */}
          <div className="w-full py-4 md:py-6 flex justify-between items-start pointer-events-auto">
            <div className="space-y-1">
              <div className={`flex items-center gap-2 opacity-60 ${textClass}`}>
                <Monitor size={14} className="animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                  Visual_Lab // Exp_0{variants.findIndex(v => v.id === activeVariant) + 1}
                </span>
              </div>
              <GlitchText
                text="GENERATIVE_ENGINE"
                className={`text-3xl md:text-5xl font-black tracking-tighter ${textClass}`}
              />
              <div className={`flex items-center gap-4 mt-2 text-[10px] font-mono ${textClass} opacity-50`}>
                <span className="flex items-center gap-1"><Activity size={10} /> SYSTEM_NORMAL</span>
                <span className="flex items-center gap-1"><Wifi size={10} /> ONLINE</span>
                <span className="flex items-center gap-1"><Box size={10} /> 3D_RENDER</span>
              </div>
            </div>
          </div>

          {/* Main Content Area - properly centered and spaced */}
          <div className="flex-grow flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between gap-8 md:gap-12 py-8 md:py-0">

            {/* Left Side - Spacer for asymmetric layout, can be used for additional content */}
            <div className="hidden md:block md:flex-grow h-full max-w-md" />

            {/* Right Side (Control Panel) - shifted away from top-right navigation */}
            <div className="w-full md:w-[420px] lg:w-[480px] pointer-events-auto z-20 mt-6 md:mt-0 md:-translate-x-[130px]">
              <GalleryControlPanel
                activeVariant={activeVariant}
                setActiveVariant={setActiveVariant}
                intensity={intensity}
                setIntensity={setIntensity}
                speed={speed}
                setSpeed={setSpeed}
                variants={variants}
                onToggleFullscreen={toggleFullscreen}
                isFullscreen={isFullscreen}
              />
            </div>
          </div>

        </div>

        {/* Decorative HUD Elements (Corners) - positioned within safe area */}
        <div className={`absolute top-28 md:top-32 right-10 md:right-14 w-8 h-8 border-t-2 border-r-2 opacity-30 ${isMatrix ? 'border-white' : 'border-theme-text'}`} />
        <div className={`absolute bottom-16 md:bottom-20 left-24 md:left-32 w-8 h-8 border-b-2 border-l-2 opacity-30 ${isMatrix ? 'border-white' : 'border-theme-text'}`} />

        {/* Bottom Status Strip - positioned within safe area */}
        <div className="absolute bottom-16 md:bottom-20 right-10 md:right-14 hidden md:flex items-center gap-6 pointer-events-none">
          <div className={`text-right font-mono text-[10px] ${textClass} opacity-40`}>
            COORDS: {intensity * 12} , {speed * 884}<br />
            RENDER: CANVAS_2D
          </div>
        </div>

      </div>
    </motion.div>
  );
};