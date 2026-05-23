import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GlitchText } from './GlitchText';
import { useLanguage } from '../context/LanguageContext';

interface WorkHeroProps {
    totalProjects: number;
    uniqueCategories: number;
}

export const WorkHero: React.FC<WorkHeroProps> = ({
    totalProjects,
    uniqueCategories,
}) => {
    const { t } = useLanguage();
    const { scrollY } = useScroll();
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);
    const scale = useTransform(scrollY, [0, 300], [1, 0.9]);
    const y = useTransform(scrollY, [0, 300], [0, 50]);

    // Disable pointer events when hero fades out
    const pointerEvents = useTransform(opacity, (v) => v < 0.5 ? 'none' : 'auto');

    return (
        <motion.section
            style={{ opacity, scale, y, pointerEvents }}
            className="relative min-h-[60vh] flex flex-col justify-center items-center text-center px-4 mb-24 sticky top-20 z-10"
        >
            <div className="mb-8">
                <div className="flex items-center justify-center gap-4 mb-6 opacity-60">
                    <div className="w-2 h-2 bg-mantis-green rounded-full animate-pulse"></div>
                    <span className="font-mono text-xs uppercase tracking-widest">{t('work.hero.badge')}</span>
                </div>

                <GlitchText
                    text={t('work.hero.headline')}
                    className="text-4xl md:text-[6vw] leading-[0.8] font-black tracking-tighter mb-8"
                    highlightWord={t('work.hero.highlight')}
                />

                <p className="font-mono text-sm md:text-base max-w-2xl mx-auto opacity-70 leading-relaxed">
                    {t('work.hero.copy')}
                </p>
            </div>

            {/* Stats Strip */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 border-t border-b border-theme-border py-6 px-12 bg-theme-bg/50 backdrop-blur-sm">
                <div className="text-center">
                    <div className="font-mono text-xs uppercase tracking-widest opacity-50 mb-1">{t('work.hero.statProjects')}</div>
                    <div className="text-2xl font-bold font-mono">{String(totalProjects).padStart(2, '0')}</div>
                </div>
                <div className="text-center">
                    <div className="font-mono text-xs uppercase tracking-widest opacity-50 mb-1">{t('work.hero.statCategories')}</div>
                    <div className="text-2xl font-bold font-mono">{String(uniqueCategories).padStart(2, '0')}</div>
                </div>
                <div className="text-center">
                    <div className="font-mono text-xs uppercase tracking-widest opacity-50 mb-1">{t('work.hero.statCommits')}</div>
                    <div className="text-2xl font-bold font-mono">404</div>
                </div>
                <div className="text-center hidden md:block">
                    <div className="font-mono text-xs uppercase tracking-widest opacity-50 mb-1">{t('work.hero.statStatus')}</div>
                    <div className="text-2xl font-bold font-mono text-mantis-green">{t('work.hero.online')}</div>
                </div>
            </div>
        </motion.section>
    );
};
