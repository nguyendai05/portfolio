import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface PreloaderProps {
  onComplete: () => void;
}

/**
 * Full-screen preloader overlay.
 *
 * Visual design giữ giống bản cũ:
 * - Logo "Xuni-Dizan"
 * - Counter 0 → 100%
 * - Thanh progress (horizon line)
 * - Nền blob + noise
 *
 * Chỉ thay đổi logic thời gian để preload nhanh hơn,
 * tránh chặn Largest Contentful Paint.
 */
export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Shorter duration to improve FCP/LCP on both mobile and desktop
    const isMobile = window.innerWidth < 768;
    const duration = isMobile ? 500 : 300; // ms - much faster on desktop for better LCP
    const updateInterval = 20;
    const steps = duration / updateInterval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setCount((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, updateInterval);

    // Hoàn tất và gọi onComplete ngay sau khi đạt 100%
    const completeTimeout = setTimeout(() => {
      setCount(100);
      const extraDelay = isMobile ? 100 : 200; // shorter on mobile
      const endTimeout = setTimeout(onComplete, extraDelay);
      return () => clearTimeout(endTimeout);
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#e6e6e6] text-black cursor-wait overflow-hidden"
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        y: '-100%',
        transition: {
          duration: 1.0,
          ease: [0.76, 0, 0.24, 1],
        },
      }}
    >
      {/* Living Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-mantis-green rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob" />
        <div className="absolute top-[-10%] right-[-20%] w-[60vw] h-[60vw] bg-[#d4d4d4] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-30%] left-[20%] w-[80vw] h-[80vw] bg-mantis-green/30 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-blob animation-delay-4000" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="w-full px-4 md:px-12 relative z-10 max-w-screen-2xl mx-auto">
        {/* Top Section: Brand & Counter */}
        <div className="flex justify-between items-end mb-2 md:mb-4">
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="flex flex-col items-start"
            >
              <h1 className="text-5xl md:text-[8vw] font-black tracking-tighter leading-[0.85] text-black">
                Xuni-Dizan
              </h1>
              <div className="flex items-center gap-3 mt-2 ml-1">
                <span className="w-2 h-2 bg-mantis-green rounded-full animate-pulse shadow-[0_0_10px_rgba(57,255,20,0.6)]" />
                <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] opacity-60">
                  Dev Portfolio
                </span>
              </div>
            </motion.div>
          </div>

          <div className="overflow-hidden">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              className="text-5xl md:text-[8vw] font-mono font-light tracking-tighter tabular-nums leading-[0.85]"
            >
              {Math.round(count)}%
            </motion.div>
          </div>
        </div>

        {/* The Horizon Line */}
        <div className="w-full h-[1px] bg-black/10 relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-black"
            initial={{ width: 0 }}
            animate={{ width: `${count}%` }}
            transition={{ ease: 'linear', duration: 0.05 }}
          />
        </div>

        {/* Bottom Meta Data */}
        <div className="flex justify-between mt-3 text-[9px] md:text-[10px] font-mono uppercase tracking-widest opacity-40 mix-blend-difference text-black">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            Initializing Student Profile...
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            10.8231° N, 106.6297° E
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
