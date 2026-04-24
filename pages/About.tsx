
import React, { lazy, Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { GlitchText } from '../components/GlitchText';
import { Terminal, GitBranch, Code2, Cpu, Rocket } from 'lucide-react';
import { useTheme, THEMES } from '../context/ThemeContext';
import type { TimelineEntry } from '../components/ExecutionLog';
import { useIsMobile } from '../hooks/useIsMobile';
import { useLanguage } from '../context/LanguageContext';

// Heavy sub-components are code-split so the initial About chunk stays small
// (previously 55 kB gz). They stream in once the page is ready.
const GenerativeArt = lazy(() =>
  import('../components/GenerativeArt').then((m) => ({ default: m.GenerativeArt }))
);
const LifeGallery = lazy(() =>
  import('../components/LifeGallery').then((m) => ({ default: m.LifeGallery }))
);
const AboutPortrait3D = lazy(() =>
  import('../components/AboutPortrait3D').then((m) => ({ default: m.AboutPortrait3D }))
);
const ExecutionLog = lazy(() =>
  import('../components/ExecutionLog').then((m) => ({ default: m.ExecutionLog }))
);


export const About: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [isVideoOverlayOpen, setIsVideoOverlayOpen] = useState(false);
  const isMobile = useIsMobile();

  // Combined Data: Text Milestones + Video Entries
  const timelineData: TimelineEntry[] = [
    {
      type: "text",
      year: "2023",
      title: t('about.timeline.2023.title'),
      desc: t('about.timeline.2023.desc'),
      icon: <Terminal size={20} />
    },
    {
      type: "text",
      year: "2024",
      title: t('about.timeline.2024.title'),
      desc: t('about.timeline.2024.desc'),
      icon: <Code2 size={20} />
    },
    {
      type: "text",
      year: t('about.timeline.2024late.year'),
      title: t('about.timeline.2024late.title'),
      desc: t('about.timeline.2024late.desc'),
      icon: <Cpu size={20} />
    },
    {
      type: "text",
      year: "2025",
      title: t('about.timeline.2025.title'),
      desc: t('about.timeline.2025.desc'),
      icon: <GitBranch size={20} />
    },
    {
      type: "text",
      year: "2026",
      title: t('about.timeline.2026.title'),
      desc: t('about.timeline.2026.desc'),
      icon: <Rocket size={20} />
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-theme-bg text-theme-text pt-24 md:pt-32 pb-24"
    >
      {!isVideoOverlayOpen && !isMobile && (
        <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
          <Suspense fallback={null}>
            <GenerativeArt variant="network" intensity={30} color={THEMES[theme].text} />
          </Suspense>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-32 relative z-10">
        {/* Header */}
        <div className="mb-32 max-w-4xl">
          <div className="font-mono text-xs uppercase tracking-widest mb-8 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-theme-text"></span>
            {t('about.manifesto')}
          </div>
          <GlitchText
            text={t('about.headline')}
            className="text-4xl md:text-[5vw] leading-[1.1] font-bold tracking-tight"
            highlightWord={t('about.headlineHighlight')}
          />
        </div>

        {/* Content Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-48">
          <div className="md:col-span-5 font-mono text-sm leading-relaxed opacity-80 space-y-8">
            <p>{t('about.bio.p1')}</p>
            <p>{t('about.bio.p2')}</p>
            <div className="p-6 border border-theme-border bg-theme-panel/50 backdrop-blur">
              <h4 className="uppercase font-bold mb-4">{t('about.focus.title')}</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">✦ {t('about.focus.item1')}</li>
                <li className="flex items-center gap-2">✦ {t('about.focus.item2')}</li>
                <li className="flex items-center gap-2">✦ {t('about.focus.item3')}</li>
              </ul>
            </div>
          </div>

          {/* Enhanced 3D Image Section */}
          <div className="md:col-span-7">
            <Suspense fallback={<div className="aspect-square w-full bg-theme-panel/30" />}>
              <AboutPortrait3D motionPaused={isVideoOverlayOpen || isMobile} />
            </Suspense>
          </div>
        </div>

        {/* Scroll Storytelling Section */}
        <Suspense fallback={<div className="min-h-[30vh]" />}>
          <ExecutionLog items={timelineData} />
        </Suspense>
      </div>

      {/* FULL WIDTH GALLERY SECTION */}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <LifeGallery onVideoOverlayChange={setIsVideoOverlayOpen} />
      </Suspense>

      <div className="container mx-auto px-8 md:px-32 relative z-10">
        {/* Team / Me */}
        <div className="border-t border-theme-border pt-24 mt-32">
          <h3 className="text-4xl font-black tracking-tighter mb-16">{t('about.human.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="group border border-theme-border/10 p-6 hover:bg-theme-text hover:text-theme-bg transition-colors duration-300 col-span-1 md:col-span-2"
            >
              <div className="w-12 h-12 bg-theme-text/10 mb-6 rounded-full group-hover:bg-mantis-green group-hover:text-black flex items-center justify-center font-bold">
                XD
              </div>
              <h4 className="text-xl font-bold mb-2">Nguyễn Xuân Đại</h4>
              <div className="font-mono text-xs uppercase opacity-50 mb-4">Xuni-Dizan</div>
              <p className="text-sm opacity-80 group-hover:text-inherit mb-4">
                {t('about.human.quote')}
              </p>
              <div className="flex gap-2 text-xs font-mono">
                <span className="border border-current px-2 py-1">{t('about.human.tag1')}</span>
                <span className="border border-current px-2 py-1">{t('about.human.tag2')}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
