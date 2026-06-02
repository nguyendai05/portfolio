import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { Project } from '../types';
import { AlertTriangle, Filter, Wrench, Globe, RefreshCw } from 'lucide-react';
import { WorkHero } from '../components/WorkHero';
import { WorkColumns } from '../components/WorkColumns';
import { WorkScrollProgress } from '../components/WorkScrollProgress';
import { ToolShowcase } from '../components/ToolShowcase';
import { useGamification } from '../context/GamificationContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeProjects } from '../data/projectTranslations';
import { useWorkPortfolioData } from '../services/api/hooks';

const ProjectModal = lazy(() =>
  import('../components/ProjectModal').then((module) => ({ default: module.ProjectModal }))
);
const WorkDeepDiveStrip = lazy(() =>
  import('../components/WorkDeepDiveStrip').then((module) => ({
    default: module.WorkDeepDiveStrip,
  }))
);

interface WorkLoadErrorProps {
  loading: boolean;
  onRetry: () => void;
  t: ReturnType<typeof useLanguage>['t'];
}

const WorkLoadError: React.FC<WorkLoadErrorProps> = ({ loading, onRetry, t }) => (
  <div className="rounded-2xl border border-theme-border/50 bg-theme-panel/40 px-6 py-12 text-center">
    <AlertTriangle className="mx-auto mb-5 h-12 w-12 text-mantis-green" />
    <h3 className="mb-3 text-2xl font-black tracking-tight">{t('work.loadError.title')}</h3>
    <p className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-theme-text/60">
      {t('work.loadError.desc')}
    </p>
    <button
      type="button"
      onClick={onRetry}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-mantis-green/50 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-mantis-green transition-colors hover:bg-mantis-green/10 disabled:cursor-wait disabled:opacity-60"
    >
      <RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />
      {t('work.loadError.retry')}
    </button>
  </div>
);

export const Work: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const { unlockAchievement } = useGamification();
  const { t, language } = useLanguage();
  const { scrollYProgress } = useScroll();

  const [activeSection, setActiveSection] = useState<'tools' | 'projects'>('tools');
  const [hasManuallySelectedSection, setHasManuallySelectedSection] = useState(false);

  const { data: workData, loading, errors: loadErrors, refetch } = useWorkPortfolioData();
  // DB-driven data. `null` = loading, `[]` = loaded empty or API branch failed.
  const PROJECTS = workData?.projects ?? null;
  const TOOLS = workData?.tools ?? null;

  // Localize projects once per language so categories, descriptions, and
  // phases all render in the active language across the page (cards, deep
  // dive strip, modal, etc.).
  const LOCALIZED_PROJECTS = useMemo(
    () => localizeProjects(PROJECTS ?? [], language),
    [PROJECTS, language],
  );
  const LOCALIZED_TOOLS = useMemo(
    () => localizeProjects(TOOLS ?? [], language),
    [TOOLS, language],
  );

  const categories = ['All', ...Array.from(new Set(LOCALIZED_PROJECTS.map(p => p.category)))];
  const filteredProjects = filter === 'All' ? LOCALIZED_PROJECTS : LOCALIZED_PROJECTS.filter(p => p.category === filter);
  const hasVisibleWorkData = LOCALIZED_PROJECTS.length > 0 || LOCALIZED_TOOLS.length > 0;
  const hasBlockingLoadError = loadErrors.length > 0 && !loading && !hasVisibleWorkData;

  const handleSectionChange = (section: 'tools' | 'projects') => {
    setHasManuallySelectedSection(true);
    setActiveSection(section);
  };

  useEffect(() => {
    if (
      !hasManuallySelectedSection &&
      PROJECTS !== null &&
      TOOLS !== null &&
      TOOLS.length === 0 &&
      PROJECTS.length > 0
    ) {
      setActiveSection('projects');
    }
  }, [PROJECTS, TOOLS, hasManuallySelectedSection]);

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
      className="min-h-screen bg-theme-bg text-theme-text pt-24 md:pt-32 pb-24 relative"
    >
      <WorkScrollProgress />

      <AnimatePresence>
        {selectedProject && (
          <Suspense fallback={null}>
            <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
          </Suspense>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-8 lg:px-32">
        <WorkHero
          totalProjects={LOCALIZED_PROJECTS.length}
          uniqueCategories={categories.length - 1}
        />

        {/* Section Toggle - Tools vs Projects */}
        <div className="sticky top-20 z-30 mb-12 flex justify-center">
          <div className="bg-theme-bg/90 backdrop-blur-md border border-theme-border p-1.5 rounded-2xl shadow-xl">
            <div className="flex gap-2">
              <button
                onClick={() => handleSectionChange('tools')}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-sm uppercase tracking-wider transition-all duration-300 ${activeSection === 'tools'
                    ? 'bg-mantis-green text-theme-bg font-bold shadow-lg shadow-mantis-green/20'
                    : 'text-theme-text/70 hover:text-theme-text hover:bg-theme-panel/50'
                  }`}
              >
                <Wrench size={16} />
                <span>{t('work.tab.tools')}</span>
                {LOCALIZED_TOOLS.length > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeSection === 'tools' ? 'bg-theme-bg/20' : 'bg-mantis-green/20 text-mantis-green'
                    }`}>
                    {LOCALIZED_TOOLS.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSectionChange('projects')}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-sm uppercase tracking-wider transition-all duration-300 ${activeSection === 'projects'
                    ? 'bg-theme-text text-theme-bg font-bold'
                    : 'text-theme-text/70 hover:text-theme-text hover:bg-theme-panel/50'
                  }`}
              >
                <Globe size={16} />
                <span>{t('work.tab.projects')}</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeSection === 'projects' ? 'bg-theme-bg/20' : 'bg-theme-text/10'
                  }`}>
                  {LOCALIZED_PROJECTS.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar for Projects - Always visible when projects tab active */}
        {activeSection === 'projects' && (
          <div className="mb-12 flex justify-center">
            <div className="bg-theme-panel/50 backdrop-blur-sm border border-theme-border/50 px-4 py-3 rounded-full flex items-center gap-2 overflow-x-auto max-w-[90vw] no-scrollbar">
              <Filter size={14} className="text-theme-text/50 mr-2 flex-shrink-0" />
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`relative px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-all whitespace-nowrap rounded-full ${filter === cat
                      ? 'bg-theme-text text-theme-bg font-bold'
                      : 'text-theme-text/70 hover:text-theme-text hover:bg-theme-panel'
                    }`}
                >
                  {cat === 'All' ? t('work.filter.all') : cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {loadErrors.length > 0 && hasVisibleWorkData && (
          <div className="mb-8 rounded-xl border border-theme-border/40 bg-theme-panel/40 px-4 py-3 font-mono text-xs uppercase tracking-wider text-theme-text/60">
            {t('work.loadError.stale')}
          </div>
        )}

        {/* Content Sections */}
        {hasBlockingLoadError ? (
          <WorkLoadError
            loading={loading}
            onRetry={() => {
              void refetch();
            }}
            t={t}
          />
        ) : activeSection === 'tools' ? (
          <motion.div
            key="tools"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {TOOLS === null ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-56 border border-theme-border bg-theme-panel/20 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <>
                <ToolShowcase tools={LOCALIZED_TOOLS} onToolClick={setSelectedProject} />
                {/* Empty state when no tools */}
                {LOCALIZED_TOOLS.length === 0 && (
                  <div className="text-center py-24 border border-dashed border-theme-border/50 rounded-3xl bg-theme-panel/20">
                    <Wrench className="w-16 h-16 mx-auto mb-6 text-theme-text/20" />
                    <h3 className="text-2xl font-bold mb-2 text-theme-text/50">{t('work.tools.comingSoonTitle')}</h3>
                    <p className="text-theme-text/40 font-mono text-sm max-w-md mx-auto">
                      {t('work.tools.comingSoonDesc')}
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <div>
            {/* Project Grid */}
            {PROJECTS === null ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-72 border border-theme-border bg-theme-panel/20 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <WorkColumns
                projects={filteredProjects}
                onProjectClick={setSelectedProject}
              />
            ) : (
              <div className="text-center py-16 border border-dashed border-theme-border/50 rounded-2xl">
                <Globe className="w-12 h-12 mx-auto mb-4 text-theme-text/20" />
                <p className="text-theme-text/50 font-mono text-sm">
                  {t('work.projects.emptyForCategory').replace('{category}', filter)}
                </p>
                <button
                  onClick={() => setFilter('All')}
                  className="mt-4 px-4 py-2 text-xs font-mono uppercase tracking-wider text-mantis-green border border-mantis-green/30 rounded-full hover:bg-mantis-green/10 transition-colors"
                >
                  {t('work.projects.viewAll')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Horizontal Deep Dive Strip (Only show if viewing All or if there are featured projects in current filter) */}
      {PROJECTS !== null && LOCALIZED_PROJECTS.length > 0 && (
        <div className="mt-32 border-t border-theme-border bg-theme-bg relative z-20">
          <Suspense fallback={null}>
            <WorkDeepDiveStrip
              projects={LOCALIZED_PROJECTS}
              onProjectClick={setSelectedProject}
            />
          </Suspense>
        </div>
      )}

      {/* Footer Note */}
      <div className="text-center py-24 opacity-30 font-mono text-xs uppercase tracking-widest">
        {t('work.footer.end')}
      </div>
    </motion.div>
  );
};
