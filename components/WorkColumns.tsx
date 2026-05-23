import React, { useMemo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Project } from '../types';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { localizeProjects } from '../data/projectTranslations';

interface WorkColumnsProps {
    projects: Project[];
    onProjectClick: (project: Project) => void;
}

export const WorkColumns: React.FC<WorkColumnsProps> = ({ projects, onProjectClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { language } = useLanguage();
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Featured flagship projects surface first, keeping remaining order stable.
    // Apply localization once at the list level so card-level rendering stays simple.
    const orderedProjects = useMemo(() => {
        const localized = localizeProjects(projects, language);
        const featured = localized.filter((p) => p.featured);
        const rest = localized.filter((p) => !p.featured);
        return [...featured, ...rest];
    }, [projects, language]);

    // Split projects into columns for desktop
    const col1 = orderedProjects.filter((_, i) => i % 2 === 0);
    const col2 = orderedProjects.filter((_, i) => i % 2 !== 0);

    // Parallax effects for columns
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
    const y2 = useTransform(scrollYProgress, [0, 1], [50, -100]);

    // Return null if no projects
    if (orderedProjects.length === 0) return null;

    return (
        <div ref={containerRef} className="relative z-20 min-h-[50vh]">
            {/* Mobile Layout (Single Column) */}
            <div className="md:hidden flex flex-col gap-12 pb-24">
                {orderedProjects.map((project) => (
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
    const { t } = useLanguage();
    const isFeatured = !!project.featured;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.5 }}
            onClick={onClick}
            className={`group cursor-pointer relative ${isFeatured ? 'is-featured' : ''}`}
        >
            {/* Image Container */}
            <div
                className={`relative aspect-[3/4] md:aspect-[4/5] overflow-hidden border bg-theme-panel mb-6 transition-shadow duration-500 ${
                    isFeatured
                        ? 'border-mantis-green shadow-[0_0_0_1px_rgba(57,255,20,0.35)] group-hover:shadow-[0_12px_40px_rgba(57,255,20,0.25)]'
                        : 'border-theme-border'
                }`}
            >
                <div className="absolute inset-0 bg-mantis-green/10 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.img
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />

                {/* Featured ribbon */}
                {isFeatured && (
                    <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-mantis-green text-theme-bg px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest shadow-lg">
                        <Sparkles size={12} />
                        {t('modal.featured')}
                    </div>
                )}

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
            <div
                className={`relative pl-4 border-l-2 transition-colors duration-300 ${
                    isFeatured
                        ? 'border-mantis-green'
                        : 'border-transparent group-hover:border-mantis-green'
                }`}
            >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs uppercase tracking-widest text-theme-text/60 block">
                        {project.category}
                    </span>
                    {isFeatured && (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-mantis-green">
                            · {t('work.projects.flagship')}
                        </span>
                    )}
                </div>
                <h3 className={`text-3xl md:text-4xl font-black tracking-tighter mb-2 transition-colors ${isFeatured ? 'text-mantis-green' : 'group-hover:text-mantis-green'}`}>
                    {project.title}
                </h3>
                <p className="text-sm opacity-60 line-clamp-2 max-w-md mb-3">
                    {project.description}
                </p>
                {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {project.technologies.slice(0, 4).map((tech) => (
                            <span
                                key={tech}
                                className="px-2 py-0.5 border border-theme-border/70 bg-theme-bg/40 font-mono text-[10px] tracking-wide text-theme-text/75 group-hover:border-mantis-green/60 group-hover:text-theme-text transition-colors"
                            >
                                {tech}
                            </span>
                        ))}
                        {project.technologies.length > 4 && (
                            <span className="px-2 py-0.5 font-mono text-[10px] tracking-wide text-theme-text/45">
                                +{project.technologies.length - 4}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
