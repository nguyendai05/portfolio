import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Project } from '../types';
import { ArrowRight, Layers, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface WorkDeepDiveStripProps {
    projects: Project[];
    onProjectClick: (project: Project) => void;
}

export const WorkDeepDiveStrip: React.FC<WorkDeepDiveStripProps> = ({ projects, onProjectClick }) => {
    const { t } = useLanguage();
    const prefersReducedMotion = useReducedMotion();

    // Featured projects are promoted to the top of Flagship Cases.
    // When there are no explicit featured ones, show up to 6 recent projects.
    // The parent passes localized projects so each card renders the right language.
    const featuredProjects = useMemo(() => {
        const featured = projects.filter(p => p.featured);
        const base = featured.length > 0 ? featured : projects;
        return base.slice(0, 6);
    }, [projects]);

    if (!featuredProjects || featuredProjects.length === 0) return null;

    const shouldAnimate = !prefersReducedMotion;

    // Layout rule: if there are 3 or fewer items, use a responsive grid so
    // every flagship card is fully visible side-by-side on desktop. Beyond
    // that, fall back to a horizontal scroll rail (native scrollbar, snap).
    const useGrid = featuredProjects.length <= 3;

    return (
        <section
            aria-label={t('work.deepdive.aria')}
            className="py-20 md:py-28 relative group/section"
        >
            {/* Background accents */}
            <div className="absolute inset-0 bg-theme-panel/30 backdrop-blur-[2px] -z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-theme-bg via-transparent to-theme-bg opacity-80 -z-10" />

            {/* Header */}
            <div className="container mx-auto px-6 md:px-8 mb-10 md:mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-mantis-green">
                        <Layers size={18} />
                        <span className="font-mono text-xs uppercase tracking-[0.2em]">{t('work.deepdive.deepDives')}</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-theme-text">
                        {t('work.deepdive.flagshipCases')}
                    </h2>
                    <p className="max-w-xl text-sm text-theme-text/60 leading-relaxed">
                        {t('work.deepdive.intro')}
                    </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-theme-text/50 uppercase tracking-widest self-start sm:self-end">
                    <Sparkles size={14} className="text-mantis-green" />
                    <span>{t('work.deepdive.cases').replace('{n}', String(featuredProjects.length)).replace('{s}', featuredProjects.length === 1 ? '' : 's')}</span>
                    {!useGrid && <span className="ml-2 md:hidden">{t('work.deepdive.swipe')}</span>}
                </div>
            </div>

            {/* Cards */}
            <div className="container mx-auto px-6 md:px-8">
                {useGrid ? (
                    <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {featuredProjects.map((project, index) => (
                            <FlagshipCard
                                key={project.id}
                                project={project}
                                index={index}
                                onClick={() => onProjectClick(project)}
                                shouldAnimate={shouldAnimate}
                            />
                        ))}
                    </div>
                ) : (
                    <div
                        className="flex gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 md:-mx-8 px-6 md:px-8 scroll-smooth"
                        style={{ scrollbarWidth: 'thin' }}
                    >
                        {featuredProjects.map((project, index) => (
                            <FlagshipCard
                                key={project.id}
                                project={project}
                                index={index}
                                onClick={() => onProjectClick(project)}
                                shouldAnimate={shouldAnimate}
                                scrollVariant
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

interface FlagshipCardProps {
    project: Project;
    index: number;
    onClick: () => void;
    shouldAnimate: boolean;
    scrollVariant?: boolean;
}

const FlagshipCard: React.FC<FlagshipCardProps> = ({ project, index, onClick, shouldAnimate, scrollVariant }) => {
    const { t } = useLanguage();
    const widthClass = scrollVariant
        ? 'w-[85vw] sm:w-[420px] md:w-[460px] shrink-0 snap-start'
        : 'w-full';

    return (
        <motion.button
            onClick={onClick}
            type="button"
            className={`group relative text-left bg-theme-panel/80 border border-theme-border/40 rounded-3xl
                overflow-hidden flex flex-col
                shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)]
                hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)]
                hover:border-mantis-green/60
                transition-all duration-500
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mantis-green focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg
                ${widthClass}`}
            whileHover={shouldAnimate ? { y: -8 } : undefined}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
        >
            {/* Image */}
            <div className="relative aspect-[16/10] overflow-hidden">
                <img
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-theme-panel via-theme-panel/10 to-transparent opacity-90" />

                {/* Accent bar */}
                <div className="absolute left-0 bottom-0 h-1 w-0 group-hover:w-full bg-mantis-green transition-all duration-700 ease-out" />

                {/* Case-study chip */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-widest bg-theme-bg/90 text-theme-text border border-theme-border/40 backdrop-blur-md shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-mantis-green mr-2 animate-pulse" />
                        {t('work.deepdive.caseStudy')}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-6 md:p-7 gap-5">
                <div className="space-y-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mantis-green/80">
                        {project.category}
                    </p>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight leading-tight text-theme-text group-hover:text-mantis-green transition-colors duration-300">
                        {project.title}
                    </h3>
                    <p className="text-sm text-theme-text/70 line-clamp-3 leading-relaxed">
                        {project.description}
                    </p>
                </div>

                {/* Tech stack */}
                <div className="flex flex-wrap gap-1.5">
                    {project.technologies.slice(0, 5).map((tech) => (
                        <span
                            key={tech}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-theme-border/40 text-theme-text/70 bg-theme-bg/50"
                        >
                            {tech}
                        </span>
                    ))}
                    {project.technologies.length > 5 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-theme-text/50">
                            +{project.technologies.length - 5}
                        </span>
                    )}
                </div>

                {/* Phases */}
                {project.phases && project.phases.length > 0 && (
                    <div className="mt-auto pt-3 border-t border-theme-border/20">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-theme-text/50">
                                {t('work.deepdive.process')}
                            </span>
                            <span className="font-mono text-[10px] text-theme-text/40">
                                {t('work.deepdive.steps').replace('{n}', String(project.phases.length))}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {project.phases.slice(0, 3).map((phase, i) => (
                                <div key={i} className="min-w-0">
                                    <div className="h-0.5 w-full bg-theme-border/30 rounded-full mb-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-mantis-green w-0 group-hover:w-full transition-all duration-700 ease-out phase-progress-bar"
                                            data-delay-index={i}
                                        />
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
                <div className="flex items-center justify-between pt-3 border-t border-theme-border/20">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-theme-text/40 group-hover:text-theme-text/60 transition-colors">
                        {t('work.deepdive.explore')}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-mantis-green group-hover:translate-x-1 transition-transform duration-300">
                        <span>{t('work.deepdive.viewCase')}</span>
                        <ArrowRight size={14} />
                    </div>
                </div>
            </div>
        </motion.button>
    );
};
