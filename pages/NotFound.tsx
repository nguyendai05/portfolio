import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';

export const NotFound: React.FC = () => {
  useEffect(() => {
    const previousTitle = document.title;
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robots?.content;
    document.title = 'Page not found — Nguyen Xuan Dai';
    robots?.setAttribute('content', 'noindex,nofollow');
    return () => {
      document.title = previousTitle;
      if (robots && previousRobots) robots.content = previousRobots;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-theme-bg px-4 text-theme-text">
      <div className="w-full max-w-xl border border-dashed border-theme-border/50 bg-theme-panel/30 p-10 text-center">
        <SearchX size={44} className="mx-auto text-theme-accent" />
        <div className="mt-5 font-mono text-xs uppercase tracking-[0.35em] text-theme-text/50">404 / route not found</div>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tighter">This page does not exist</h1>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 border border-theme-border px-5 py-3 font-mono text-xs uppercase tracking-widest hover:border-theme-accent hover:text-theme-accent">
          <ArrowLeft size={14} /> Back home
        </Link>
      </div>
    </main>
  );
};
