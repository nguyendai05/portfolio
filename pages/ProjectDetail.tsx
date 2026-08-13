import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import type { Project } from '../types';
import { ProjectCaseStudy } from '../components/ProjectCaseStudy';
import { useLanguage } from '../context/LanguageContext';
import { localizeProject } from '../data/projectTranslations';
import { fetchProjectBySlug } from '../services/api/projects';
import { ApiError } from '../services/api/client';

export const ProjectDetail: React.FC = () => {
  const { slug = '' } = useParams();
  const { language } = useLanguage();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setNotFound(false); setError(null);
    fetchProjectBySlug(slug, controller.signal)
      .then(setProject)
      .catch((reason) => {
        if (reason instanceof ApiError && reason.kind === 'abort') return;
        if (reason instanceof ApiError && reason.status === 404) setNotFound(true);
        else setError(reason instanceof Error ? reason.message : 'Failed to load project');
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [slug]);

  const localized = useMemo(() => project ? localizeProject(project, language) : null, [language, project]);

  useEffect(() => {
    const previousTitle = document.title;
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robots?.content;
    if (localized) document.title = `${localized.title} — Nguyen Xuan Dai`;
    if (notFound) {
      document.title = 'Project not found — Nguyen Xuan Dai';
      robots?.setAttribute('content', 'noindex,nofollow');
    }
    return () => {
      document.title = previousTitle;
      if (robots && previousRobots) robots.content = previousRobots;
    };
  }, [localized, notFound]);

  return (
    <main className="min-h-screen bg-theme-bg px-4 pb-24 pt-28 text-theme-text md:px-10 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <Link to="/work" className="mb-10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-theme-text/60 hover:text-theme-accent"><ArrowLeft size={14} /> Back to work</Link>
        {loading ? <div className="h-[60vh] animate-pulse border border-theme-border/30 bg-theme-panel/30" />
          : localized ? <ProjectCaseStudy project={localized} />
          : <div className="flex min-h-[50vh] flex-col items-center justify-center border border-dashed border-theme-border/50 text-center">
              <AlertTriangle className="mb-4 text-theme-accent" size={42} />
              <h1 className="text-3xl font-black">{notFound ? 'Project not found' : 'Project unavailable'}</h1>
              <p className="mt-3 max-w-lg text-theme-text/60">{error || 'The requested case study does not exist.'}</p>
            </div>}
      </div>
    </main>
  );
};
