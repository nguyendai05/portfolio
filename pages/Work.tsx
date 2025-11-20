import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { PROJECTS } from '../data/mockData';
import { ProjectModal } from '../components/ProjectModal';
import { Project } from '../types';
import { Filter } from 'lucide-react';
import { WorkHero } from '../components/WorkHero';
import { WorkColumns } from '../components/WorkColumns';
import { WorkDeepDiveStrip } from '../components/WorkDeepDiveStrip';
import { WorkScrollProgress } from '../components/WorkScrollProgress';
import { useGamification } from '../context/GamificationContext';

export const Work: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const { unlockAchievement } = useGamification();
  const { scrollYProgress } = useScroll();

  const categories = ['All', ...Array.from(new Set(PROJECTS.map(p => p.category)))];
  const filteredProjects = filter === 'All' ? PROJECTS : PROJECTS.filter(p => p.category === filter);

  // Unlock achievement when reaching the bottom
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      if (v > 0.95) {
        unlockAchievement('deep_lab_explorer');
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, unlockAchievement]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-theme-bg text-theme-text pt-32 pb-24 relative"
    >
      <WorkScrollProgress />

      <AnimatePresence>
        {selectedProject && (
          <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-8 lg:px-32">
        <WorkHero />

        {/* Sticky Filter Bar */}
        <div className="sticky top-20 z-30 mb-16 flex justify-center">
          <div className="bg-theme-bg/80 backdrop-blur-md border border-theme-border px-4 py-3 rounded-full flex items-center gap-2 shadow-xl overflow-x-auto max-w-[90vw] no-scrollbar">
            <Filter size={14} className="text-mantis-green mr-2 flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="relative px-3 py-1 text-xs font-mono uppercase tracking-widest transition-colors whitespace-nowrap"
              >
                {filter === cat && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-theme-text rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={`relative z-10 ${filter === cat ? 'text-theme-bg font-bold' : 'text-theme-text hover:text-mantis-green'}`}>
                  {cat}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Project Lanes */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <WorkColumns
              projects={filteredProjects}
              onProjectClick={setSelectedProject}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Horizontal Deep Dive Strip (Only show if viewing All or if there are featured projects in current filter) */}
      <div className="mt-32 border-t border-theme-border bg-theme-bg relative z-20">
        <WorkDeepDiveStrip
          projects={PROJECTS}
          onProjectClick={setSelectedProject}
        />
      </div>

      {/* Footer Note */}
      <div className="text-center py-24 opacity-30 font-mono text-xs uppercase tracking-widest">
        End of Archives
      </div>
    </motion.div>
  );
};