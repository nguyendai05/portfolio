import React, { useRef, useMemo, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Project } from '../types';
import { ArrowRight, Layers } from 'lucide-react';

interface WorkDeepDiveStripProps {
    projects: Project[];
    onProjectClick: (project: Project) => void;
}

export const WorkDeepDiveStrip: React.FC<WorkDeepDiveStripProps> = ({ projects, onProjectClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const prefersReducedMotion = useReducedMotion();

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Featured projects logic
    const featuredProjects = useMemo(() => {
        const featured = projects.filter(p => p.featured);
        const base = featured.length > 0 ? featured : projects;
        return base.slice(0, 4);
    }, [projects]);

    // Scroll-driven motion hooks
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Desktop rail transforms
    const railX = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

    // If no projects to show, return null
    if (!featuredProjects || featuredProjects.length === 0) return null;

    // Determine if we should apply motion
    const shouldAnimate = !isMobile && !prefersReducedMotion;

    return (
        <div
            ref={containerRef}
            className="py-24 md:py-32 relative overflow-x-auto md:overflow-hidden no-scrollbar group/section"
        >
            {/* Background Layer */}
            <div className="absolute inset-0 bg-theme-panel/30 backdrop-blur-[2px] -z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-theme-bg via-transparent to-theme-bg opacity-80 -z-10" />

            {/* Header Row */}
            <div className="container mx-auto px-6 md:px-8 mb-12 md:mb-16 flex items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-mantis-green">
                        <Layers size={18} />
                        <span className="font-mono text-xs uppercase tracking-[0.2em]">Deep Dives</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-theme-text">
                        FLAGSHIP CASES
                    </h2>
                </div>

                <div className="hidden md:flex items-center gap-2 font-mono text-xs text-theme-text/50 uppercase tracking-widest">
                    <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        Scroll to Explore
                    </motion.span>
                    <span>&rarr;</span>
                </div>
                <div className="md:hidden font-mono text-xs text-theme-text/50 uppercase tracking-widest">
                    Swipe to explore
                </div>
            </div>

            {/* Horizontal Rail */}
            <motion.div
                className={`flex gap-6 md:gap-10 px-6 md:px-8 w-max ${!isMobile ? 'mask-linear-fade' : 'snap-x snap-mandatory'}`}
                style={shouldAnimate ? { x: railX } : {}}
            >
                {featuredProjects.map((project) => (
                    <motion.button
                        key={project.id}
                        onClick={() => onProjectClick(project)}
                        className="group relative shrink-0 w-[85vw] sm:w-[70vw] md:w-[480px] lg:w-[520px] text-left
                                 bg-theme-panel/80 border border-theme-border/40 rounded-3xl
                                 overflow-hidden flex flex-col justify-between
                                 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)]
                                 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)]
                                 transition-all duration-500 snap-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mantis-green focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg"
                        whileHover={shouldAnimate ? { y: -10, scale: 1.01 } : undefined}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Image Layer */}
                        <div className="relative h-48 md:h-64 overflow-hidden">
                            <motion.img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-full object-cover"
                                initial={{ scale: 1.05 }}
                                whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                                transition={{ duration: 0.7, ease: "easeOut" }}
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-theme-panel via-theme-panel/20 to-transparent opacity-90" />

                            {/* Accent Bar */}
                            <div className="absolute left-0 bottom-0 h-1 w-0 group-hover:w-full bg-mantis-green transition-all duration-700 ease-out" />

                            {/* Top Metadata Chip */}
                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-widest bg-theme-bg/90 text-theme-text border border-theme-border/40 backdrop-blur-md shadow-lg">
                                    <span className="w-1.5 h-1.5 rounded-full bg-mantis-green mr-2 animate-pulse" />
                                    Case Study
                                </span>
                            </div>
                        </div>

                        {/* Content Layer */}
                        <div className="flex-1 flex flex-col p-6 md:p-8 gap-6">
                            {/* Header Info */}
                            <div className="space-y-3">
                                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mantis-green/80">
                                    {project.category}
                                </p>
                                <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-none text-theme-text group-hover:text-mantis-green transition-colors duration-300">
                                    {project.title}
                                </h3>
                                <p className="text-sm text-theme-text/70 line-clamp-2 leading-relaxed">
                                    {project.description}
                                </p>
                            </div>

                            {/* Tech Stack */}
                            <div className="flex flex-wrap gap-2">
                                {project.technologies.slice(0, 4).map((tech) => (
                                    <span
                                        key={tech}
                                        className="text-[10px] font-mono px-2.5 py-1 rounded-md border border-theme-border/40 text-theme-text/60 bg-theme-bg/50"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>

                            {/* Phases Timeline */}
                            {project.phases && project.phases.length > 0 && (
                                <div className="mt-auto pt-4 border-t border-theme-border/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-theme-text/50">
                                            Process
                                        </span>
                                        <span className="font-mono text-[10px] text-theme-text/40">
                                            {project.phases.length} Steps
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2 overflow-hidden">
                                        {project.phases.slice(0, 3).map((phase, index) => (
                                            <div key={index} className="flex-1 min-w-0">
                                                <div className="h-0.5 w-full bg-theme-border/30 rounded-full mb-2 overflow-hidden">
                                                    <div className="h-full bg-mantis-green w-0 group-hover:w-full transition-all duration-700 ease-out" style={{ transitionDelay: `${index * 100}ms` }} />
                                                </div>
                                                <p className="text-[10px] text-theme-text/60 truncate font-mono">
                                                    {phase}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CTA */}
                            <div className="flex items-center justify-between pt-4 mt-2 border-t border-theme-border/20">
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-theme-text/40 group-hover:text-theme-text/60 transition-colors">
                                    Explore
                                </span>
                                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-mantis-green group-hover:translate-x-1 transition-transform duration-300">
                                    <span>View Case</span>
                                    <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
};
