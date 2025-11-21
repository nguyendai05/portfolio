import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { VideoData } from './VideoTimelineItem';
import { Activity, ChevronRight, Terminal, Cpu, Zap, Hash } from 'lucide-react';

// --- Types ---

export type TextTimelineItem = {
    type: 'text';
    year: string;
    title: string;
    desc: string;
    icon: React.ReactNode;
};

export type TimelineEntry = TextTimelineItem | VideoData;

interface ExecutionLogProps {
    items: TimelineEntry[];
}

// --- Components ---

const LogNode = ({
    item,
    index,
    isActive,
    onActivate
}: {
    item: TimelineEntry;
    index: number;
    isActive: boolean;
    onActivate: (index: number) => void;
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "-40% 0px -40% 0px", amount: 0.5 });

    useEffect(() => {
        if (isInView) {
            onActivate(index);
        }
    }, [isInView, index, onActivate]);

    const isEven = index % 2 === 0;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-10%", once: false }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`relative flex flex-col md:flex-row items-center justify-between w-full mb-32 md:mb-48 ${isEven ? 'md:flex-row-reverse' : ''
                }`}
        >
            {/* Spacer for Desktop Zigzag */}
            <div className="w-full md:w-5/12 hidden md:block" />

            {/* Center Node (The Anchor) */}
            <div className="hidden md:flex w-2/12 justify-center relative z-10">
                <motion.div
                    animate={{
                        scale: isActive ? 1.2 : 1,
                        borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)'
                    }}
                    className={`w-12 h-12 rounded-full border-4 bg-theme-bg flex items-center justify-center shadow-xl relative transition-colors duration-500`}
                >
                    <div className={`transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                        {item.type === 'text' ? item.icon : <Activity size={20} />}
                    </div>

                    {/* Active Glow */}
                    {isActive && (
                        <motion.div
                            layoutId="activeGlow"
                            className="absolute inset-0 rounded-full bg-theme-accent/30 blur-md"
                            transition={{ duration: 0.3 }}
                        />
                    )}
                </motion.div>
            </div>

            {/* Content Card */}
            <div className={`w-full md:w-5/12 pl-8 md:pl-0 ${isEven ? 'md:pr-12' : 'md:pl-12'}`}>
                <motion.div
                    animate={{
                        scale: isActive ? 1.02 : 1,
                        opacity: isActive ? 1 : 0.7,
                        x: isActive ? 0 : (isEven ? -10 : 10)
                    }}
                    transition={{ duration: 0.4 }}
                    className={`
            relative p-6 border transition-colors duration-300
            ${isActive
                            ? 'bg-theme-panel border-theme-accent shadow-[8px_8px_0px_0px_var(--color-accent)]'
                            : 'bg-theme-bg border-theme-border shadow-[4px_4px_0px_0px_var(--color-border)]'
                        }
          `}
                >
                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 p-2">
                        <div className={`w-2 h-2 ${isActive ? 'bg-theme-accent' : 'bg-theme-border'} transition-colors`} />
                    </div>

                    {item.type === 'text' ? (
                        <>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="font-mono text-xs px-2 py-1 bg-theme-text text-theme-bg font-bold">
                                    {item.year}
                                </span>
                                {isActive && (
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-theme-accent opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-theme-accent"></span>
                                    </span>
                                )}
                            </div>
                            <h4 className="text-xl md:text-2xl font-bold mb-3 tracking-tight">{item.title}</h4>
                            <p className="font-mono text-sm opacity-80 leading-relaxed">
                                {item.desc}
                            </p>
                        </>
                    ) : (
                        // Video Item Wrapper
                        <div className="-m-6">
                            {/* We pass a modified version of VideoTimelineItem or just render it directly. 
                   Since VideoTimelineItem has its own layout logic (left/right), we might need to adjust it.
                   Actually, VideoTimelineItem has built-in layout logic (w-5/12 etc). 
                   To reuse it within this structure, we might need to strip its layout or use it as 'content only'.
                   
                   Looking at VideoTimelineItem, it renders the WHOLE row (flex-row etc).
                   Here we are inside the 'Content Card' side of the row.
                   So we should probably just render the VIDEO CARD part here.
                   
                   However, VideoTimelineItem is complex. 
                   Let's just render a simplified video card here for consistency, 
                   OR we can refactor VideoTimelineItem. 
                   
                   Given the constraints, let's render the VideoTimelineItem's *content* here manually 
                   or wrap it. 
                   
                   Actually, the cleanest way is to let VideoTimelineItem handle itself if possible, 
                   but we want to control the layout from here.
                   
                   Let's just render the video preview here.
               */}
                            <div className="relative group aspect-video bg-black border-b border-theme-border">
                                <iframe
                                    src={
                                        item.platform === 'youtube'
                                            ? `https://www.youtube.com/embed/${item.videoUrl.split('v=')[1]?.split('&')[0]}?controls=0&rel=0`
                                            : item.videoUrl
                                    }
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    title={item.title}
                                    loading="lazy"
                                    allowFullScreen
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                                <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-[10px] bg-theme-accent text-black px-1">REC</span>
                                        <span className="font-mono text-xs text-white">{item.year}</span>
                                    </div>
                                    <h4 className="text-white font-bold text-lg">{item.title}</h4>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="font-mono text-sm opacity-80">{item.description}</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

const FutureNode = () => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ margin: "-10%" }}
            className="flex flex-col items-center justify-center mt-32 mb-32 relative z-10"
        >
            <div className="relative">
                <div className="absolute inset-0 bg-theme-accent/20 blur-xl animate-pulse" />
                <div className="w-24 h-24 bg-theme-bg border-2 border-theme-accent rounded-full flex items-center justify-center relative z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,var(--color-accent)_5px,var(--color-accent)_6px)] opacity-10" />
                    <Zap className="text-theme-accent w-10 h-10 animate-pulse" />
                </div>
            </div>

            <div className="mt-8 text-center max-w-md px-4">
                <div className="font-mono text-xs text-theme-accent mb-2 tracking-[0.2em] uppercase">System Status</div>
                <h3 className="text-3xl font-black mb-4">Awaiting Next Input...</h3>
                <p className="opacity-60 font-mono text-sm">
                    The log is open. The next entry is being written right now.
                </p>
            </div>

            <div className="mt-12 p-4 border border-theme-border/30 bg-theme-panel/30 backdrop-blur-sm rounded-lg max-w-sm w-full">
                <div className="flex items-center gap-2 border-b border-theme-border/20 pb-2 mb-2">
                    <Terminal size={14} className="opacity-50" />
                    <span className="font-mono text-xs opacity-50">future_goals.json</span>
                </div>
                <div className="font-mono text-xs space-y-1 opacity-80">
                    <div className="flex gap-2"><span className="text-theme-accent">➜</span> <span>Mastering WebGL / Three.js</span></div>
                    <div className="flex gap-2"><span className="text-theme-accent">➜</span> <span>Building Scalable Systems</span></div>
                    <div className="flex gap-2"><span className="text-theme-accent">➜</span> <span>Contributing to Open Source</span></div>
                </div>
            </div>
        </motion.div>
    )
}

const SignatureCard = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex justify-center pb-32 relative z-10"
        >
            <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-theme-accent to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                <div className="relative px-8 py-6 bg-theme-bg ring-1 ring-theme-border leading-none flex items-center space-x-6 rounded-lg">
                    <div className="space-y-2">
                        <p className="text-theme-text font-bold text-lg">Nguyễn Xuân Đại</p>
                        <p className="text-theme-text/60 font-mono text-xs">Xuni-Dizan // Operator</p>
                    </div>
                    <div className="h-12 w-[1px] bg-theme-border/50" />
                    <div className="text-2xl font-black tracking-tighter">XD</div>
                </div>
            </div>
        </motion.div>
    )
}

export const ExecutionLog: React.FC<ExecutionLogProps> = ({ items }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIdx, setActiveIdx] = useState(0);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const lineHeight = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

    // Background Parallax
    const bgY = useTransform(smoothProgress, [0, 1], ["0%", "20%"]);
    const bgOpacity = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

    return (
        <section ref={containerRef} className="relative min-h-[200vh] py-24">

            {/* --- STICKY BACKGROUND CANVAS --- */}
            <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center pointer-events-none z-0">
                <motion.div
                    style={{ y: bgY, opacity: bgOpacity }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {/* Big Year Display */}
                    <div className="relative">
                        <motion.h2
                            key={activeIdx}
                            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 0.1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-[20vw] font-black leading-none select-none text-theme-text whitespace-nowrap"
                        >
                            {items[activeIdx]?.year.split(' ')[0]}
                        </motion.h2>

                        {/* Decorative Grid/Lines */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
                    </div>
                </motion.div>

                {/* Status Bar at bottom of screen */}
                <div className="absolute bottom-12 left-8 right-8 flex justify-between items-end font-mono text-xs opacity-60">
                    <div className="flex flex-col gap-1">
                        <span className="uppercase tracking-widest">System Log</span>
                        <span className="text-theme-accent">
                            ID: {items[activeIdx]?.year} // {activeIdx + 1} of {items.length}
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${activeIdx === items.length - 1 ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                            <span>{activeIdx === items.length - 1 ? 'ONLINE' : 'EXECUTING'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FOREGROUND CONTENT --- */}
            <div className="relative z-10 container mx-auto px-4 md:px-12 -mt-[100vh]">

                {/* Header */}
                <div className="text-center mb-32 pt-32">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-theme-border/50 bg-theme-bg/50 backdrop-blur mb-4">
                        <Hash size={12} className="text-theme-accent" />
                        <span className="font-mono text-xs uppercase tracking-wider">Execution Log</span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                        Journey Protocol
                    </h3>
                    <p className="max-w-lg mx-auto opacity-60 font-mono text-sm">
                        Initializing timeline sequence. Tracking progress from origin to current state.
                    </p>
                </div>

                {/* Timeline Container */}
                <div className="relative max-w-5xl mx-auto">

                    {/* Vertical Spine (Desktop) */}
                    <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-theme-border/10 md:-translate-x-1/2">
                        <motion.div
                            style={{ height: lineHeight }}
                            className="w-full bg-theme-accent origin-top shadow-[0_0_10px_var(--color-accent)]"
                        />
                    </div>

                    {/* Items */}
                    <div className="space-y-12 md:space-y-0">
                        {items.map((item, i) => (
                            <LogNode
                                key={i}
                                item={item}
                                index={i}
                                isActive={i === activeIdx}
                                onActivate={setActiveIdx}
                            />
                        ))}
                    </div>

                    {/* Future & Signature */}
                    <FutureNode />
                    <SignatureCard />

                </div>
            </div>

        </section>
    );
};
