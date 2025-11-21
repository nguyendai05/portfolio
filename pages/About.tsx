
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GenerativeArt } from '../components/GenerativeArt';
import { GlitchText } from '../components/GlitchText';
import { Terminal, GitBranch, Code2, Cpu } from 'lucide-react';
import { useTheme, THEMES } from '../context/ThemeContext';
import { LifeGallery } from '../components/LifeGallery';
import { VideoTimelineItem, VideoData } from '../components/VideoTimelineItem';
import { AboutPortrait3D } from '../components/AboutPortrait3D';

// Define types for the mixed timeline
type TextTimelineItem = {
  type: 'text';
  year: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
};

type TimelineEntry = TextTimelineItem | VideoData;

const TimelineItem: React.FC<{
  data: TextTimelineItem;
  index: number
}> = ({ data, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ margin: "-20%" }}
      transition={{ duration: 0.8, type: "spring" }}
      className={`flex items-center justify-between w-full mb-32 ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}
    >
      {/* Mobile Connector line alignment adjustment */}
      <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-theme-border/10 md:hidden -z-10"></div>

      <div className="w-full md:w-5/12 hidden md:block"></div>

      {/* Center Node */}
      <div className="hidden md:flex w-2/12 justify-center relative z-10">
        <div className="w-12 h-12 bg-theme-text text-theme-bg rounded-full border-4 border-theme-bg flex items-center justify-center shadow-xl relative group">
          {data.icon}
          <div className="absolute inset-0 bg-mantis-green rounded-full opacity-0 group-hover:opacity-50 blur-md transition-opacity"></div>
        </div>
      </div>

      <div className={`w-full md:w-5/12 pl-12 md:pl-0 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
        <div className={`bg-theme-panel p-6 border border-theme-border shadow-[8px_8px_0px_0px_var(--color-border)] hover:translate-x-1 hover:-translate-y-1 transition-transform group ${index % 2 === 0 ? 'md:text-right' : ''}`}>
          <span className="font-mono text-xs text-theme-bg bg-theme-text px-2 py-1 mb-2 inline-block">{data.year}</span>
          <h4 className="text-xl font-bold mb-2">{data.title}</h4>
          <p className="font-mono text-xs opacity-70 leading-relaxed">{data.desc}</p>
        </div>
      </div>
    </motion.div>
  );
};

export const About: React.FC = () => {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 0.8], ["0%", "100%"]);

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
      className="min-h-screen bg-theme-bg text-theme-text pt-32 pb-24"
    >
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <GenerativeArt variant="network" intensity={30} color={THEMES[theme].text} />
      </div>

      <div className="container mx-auto px-8 md:px-32 relative z-10">
        {/* Header */}
        <div className="mb-32 max-w-4xl">
          <div className="font-mono text-xs uppercase tracking-widest mb-8 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-theme-text"></span>
            Manifesto
          </div>
          <GlitchText
            text="I don't just use the browser. I explore it."
            className="text-[5vw] leading-[1.1] font-bold tracking-tight"
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
            <AboutPortrait3D />
          </div>
        </div>

        {/* Scroll Storytelling Section */}
        <div className="relative py-12 mb-32">
          <h3 className="text-center text-4xl font-black tracking-tighter mb-24">Execution Log</h3>

          {/* Vertical Line (Desktop) */}
          <div className="absolute left-1/2 top-32 bottom-0 w-[2px] bg-theme-border/10 -translate-x-1/2 hidden md:block">
            <motion.div
              style={{ height: lineHeight }}
              className="w-full bg-mantis-green origin-top"
            />
          </div>

          {/* Timeline Items */}
          <div className="relative">
            {timelineData.map((item, i) => (
              <React.Fragment key={i}>
                {item.type === 'text' ? (
                  <TimelineItem data={item} index={i} />
                ) : (
                  <VideoTimelineItem data={item} index={i} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Future Node */}
          <div className="flex justify-center relative mt-12">
            <div className="bg-theme-text text-theme-bg px-8 py-4 font-mono uppercase tracking-widest text-xs animate-pulse border border-theme-bg shadow-[4px_4px_0px_0px_var(--color-accent)]">
              Awaiting Next Input...
            </div>
          </div>
        </div>
      </div>

      {/* FULL WIDTH GALLERY SECTION */}
      <LifeGallery />

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
                "Cười người hôm trước – Hôm sau debug." <br />
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
