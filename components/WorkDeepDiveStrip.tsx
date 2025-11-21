import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Project } from '../types';
import { ArrowRight, Layers } from 'lucide-react';

interface WorkDeepDiveStripProps {
    projects: Project[];
    onProjectClick: (project: Project) => void;
}

export const WorkDeepDiveStrip: React.FC<WorkDeepDiveStripProps> = ({ projects, onProjectClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const x = useTransform(scrollYProgress, [0.2, 0.8], ["0%", "-20%"]);

    // Filter only featured projects or take first 3
    const featuredProjects = projects.filter(p => p.featured).slice(0, 3);
    if (featuredProjects.length === 0) return null;

    return (
        <div ref={containerRef} className="py-24 md:py-32 overflow-x-auto md:overflow-hidden relative no-scrollbar">
            <div className="container mx-auto px-8 mb-12 flex items-end justify-between sticky left-0">
                <div>
                    <div className="flex items-center gap-2 text-mantis-green mb-2">
                        <Layers size={16} />
                        <span className="font-mono text-xs uppercase tracking-widest">Deep Dives</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter">FLAGSHIP CASES</h2>
                </div>
                <div className="hidden md:block font-mono text-xs opacity-50">
                    SCROLL TO EXPLORE &rarr;
                </div>
            </div>

            {/* Horizontal Scroll Container */}
            <motion.div
                style={{ x: isMobile ? 0 : x }}
                className="flex gap-8 px-8 md:px-32 w-max"
            >
                {featuredProjects.map((project, index) => (
                    <div
                        key={project.id}
                        onClick={() => onProjectClick(project)}
                        className="group relative w-[85vw] md:w-[60vw] lg:w-[45vw] flex-shrink-0 cursor-pointer border border-theme-border bg-theme-panel hover:border-mantis-green transition-colors duration-500"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                            {/* Image Side */}
                            <div className="relative h-64 md:h-auto overflow-hidden border-b md:border-b-0 md:border-r border-theme-border">
                                <img
                                    src={project.image}
                                    alt={project.title}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-mantis-green/20 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 font-mono text-xs uppercase tracking-widest">
                                    CASE_0{index + 1}
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="p-8 flex flex-col justify-between h-full">
                                <div>
                                    <span className="font-mono text-xs text-mantis-green mb-2 block">{project.category}</span>
                                    <h3 className="text-3xl font-bold mb-4 group-hover:text-mantis-green transition-colors">{project.title}</h3>
                                    <p className="opacity-70 text-sm leading-relaxed mb-6">
                                        {project.description}
                                    </p>

                                    {/* Phases */}
                                    {project.phases && (
                                        <div className="space-y-3 mb-8">
                                            {project.phases.map((phase, i) => (
                                                <div key={i} className="flex items-center gap-3 text-xs font-mono uppercase opacity-60">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-mantis-green' : 'bg-theme-text'}`} />
                                                    {phase}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                                    <span>Open Case Study</span>
                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};
