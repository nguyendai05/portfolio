
import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GenerativeArt } from '../components/GenerativeArt';
import { GlitchText } from '../components/GlitchText';
import { Terminal, GitBranch, Code2, Cpu } from 'lucide-react';
import { useTheme, THEMES } from '../context/ThemeContext';
import { LifeGallery } from '../components/LifeGallery';
import { AboutPortrait3D } from '../components/AboutPortrait3D';
import { ExecutionLog, TimelineEntry } from '../components/ExecutionLog';



export const About: React.FC = () => {
  const { theme } = useTheme();
  const [isVideoOverlayOpen, setIsVideoOverlayOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Combined Data: Text Milestones + Video Entries
  const timelineData: TimelineEntry[] = [
    {
      type: "text",
      year: "2023",
      title: "System Boot",
      desc: "Entered Nong Lam University. Initialized core programming modules. First 'Hello World' printed to console.",
      icon: <Terminal size={20} />
    },
    {
      type: "text",
      year: "2024",
      title: "Learning Curve",
      desc: "Discovered the chaos of the DOM. Built first static sites. Started battling CSS specificity wars.",
      icon: <Code2 size={20} />
    },
    {
      type: "text",
      year: "2024 - Late",
      title: "HCI Experiments",
      desc: "University coursework focused on user interaction. Realized that code must also feel good, not just work.",
      icon: <Cpu size={20} />
    },
    {
      type: "text",
      year: "2025",
      title: "Modern Stack",
      desc: "Adopting React, TypeScript, and Tailwind. Moving from 'making it work' to 'making it scale'.",
      icon: <GitBranch size={20} />
    },
  ];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-theme-bg text-theme-text pt-24 md:pt-32 pb-24"
    >
      {!isVideoOverlayOpen && !isMobile && (
        <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
          <GenerativeArt variant="network" intensity={30} color={THEMES[theme].text} />
        </div>
      )}

      <div className="container mx-auto px-4 md:px-32 relative z-10">
        {/* Header */}
        <div className="mb-32 max-w-4xl">
          <div className="font-mono text-xs uppercase tracking-widest mb-8 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-theme-text"></span>
            Manifesto
          </div>
          <GlitchText
            text="I don't just use the browser. I explore it."
            className="text-4xl md:text-[5vw] leading-[1.1] font-bold tracking-tight"
            highlightWord="explore it."
          />
        </div>

        {/* Content Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-48">
          <div className="md:col-span-5 font-mono text-sm leading-relaxed opacity-80 space-y-8">
            <p>
              My name is Nguyễn Xuân Đại (Xuni-Dizan). I am an Information Technology student at Nong Lam University, Ho Chi Minh City.
            </p>
            <p>
              In a world of frameworks and abstraction, I'm interested in the fundamentals.
              This portfolio is my sandbox—brutalist, slightly glitchy, and honest about my level.
            </p>
            <div className="p-6 border border-theme-border bg-theme-panel/50 backdrop-blur">
              <h4 className="uppercase font-bold mb-4">My Focus</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">✦ Front-End Development</li>
                <li className="flex items-center gap-2">✦ Human-Computer Interaction</li>
                <li className="flex items-center gap-2">✦ Experimental UI</li>
              </ul>
            </div>
          </div>

          {/* Enhanced 3D Image Section */}
          <div className="md:col-span-7">
            <AboutPortrait3D motionPaused={isVideoOverlayOpen || isMobile} />
          </div>
        </div>

        {/* Scroll Storytelling Section */}
        <ExecutionLog items={timelineData} />
      </div>

      {/* FULL WIDTH GALLERY SECTION */}
      <LifeGallery onVideoOverlayChange={setIsVideoOverlayOpen} />

      <div className="container mx-auto px-8 md:px-32 relative z-10">
        {/* Team / Me */}
        <div className="border-t border-theme-border pt-24 mt-32">
          <h3 className="text-4xl font-black tracking-tighter mb-16">The Human.</h3>
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
                "Ngày ta đại thành Java kinh phổ - ắt sẽ danh chấn thiên hạ!" <br />
                Student, Developer, and Explorer.
              </p>
              <div className="flex gap-2 text-xs font-mono">
                <span className="border border-current px-2 py-1">NLU Student</span>
                <span className="border border-current px-2 py-1">Front-End</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
