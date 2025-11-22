import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Project } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface WorkColumnsProps {
    projects: Project[];
    onProjectClick: (project: Project) => void;
}

export const WorkColumns: React.FC<WorkColumnsProps> = ({ projects, onProjectClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Split projects into columns for desktop
    const col1 = projects.filter((_, i) => i % 2 === 0);
    const col2 = projects.filter((_, i) => i % 2 !== 0);

    // Parallax effects for columns
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
    const y2 = useTransform(scrollYProgress, [0, 1], [50, -100]);

    return (
        <div ref={containerRef} className="relative z-20 min-h-screen">
            {/* Mobile Layout (Single Column) */}
            <div className="md:hidden flex flex-col gap-12 pb-24">
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} onClick={() => onProjectClick(project)} />
                ))}
            </div>

            {/* Desktop Layout (Dual Column with Parallax) */}
            <div className="hidden md:grid grid-cols-2 gap-12 lg:gap-24 px-4">
                <motion.div style={{ y: y1 }} className="flex flex-col gap-24 pt-0">
                    {col1.map((project) => (
                        <ProjectCard key={project.id} project={project} onClick={() => onProjectClick(project)} />
                    ))}
                </motion.div>

                <motion.div style={{ y: y2 }} className="flex flex-col gap-24 pt-32">
                    {col2.map((project) => (
                        <ProjectCard key={project.id} project={project} onClick={() => onProjectClick(project)} />
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
    return (
        <motion.div
            layoutId={`project-${project.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.5 }}
            onClick={onClick}
            className="group cursor-pointer relative"
        >
            {/* Image Container */}
            <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden border border-theme-border bg-theme-panel mb-6">
                <div className="absolute inset-0 bg-mantis-green/10 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />

                {/* Hover Overlay Info */}
                <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-transparent to-black/80">
                    <div className="flex justify-end">
                        <div className="bg-theme-text text-theme-bg p-3 rounded-full transform rotate-45 group-hover:rotate-0 transition-transform duration-500">
                            <ArrowUpRight size={24} />
                        </div>
                    </div>
                    <div className="text-white">
                        <p className="font-mono text-xs uppercase tracking-widest mb-2 text-mantis-green">
                            {project.technologies.slice(0, 3).join(" / ")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative pl-4 border-l-2 border-transparent group-hover:border-mantis-green transition-colors duration-300">
                <span className="font-mono text-xs uppercase tracking-widest text-theme-text/60 mb-1 block">
                    {project.category}
                </span>
                <h3 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 group-hover:text-mantis-green transition-colors">
                    {project.title}
                </h3>
                <p className="text-sm opacity-60 line-clamp-2 max-w-md">
                    {project.description}
                </p>
            </div>
        </motion.div>
    );
};
