import React from 'react';
import { ArrowRight, Database, GitBranch } from 'lucide-react';
import type { Project } from '../types';
import { getOptimizedProjectImage } from '../services/projectImages';

export const ProjectCaseStudy: React.FC<{ project: Project; headingId?: string }> = ({ project, headingId }) => (
  <article className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
    <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-md border border-theme-border/40 bg-theme-panel/80 p-1 sm:p-2">
      <img src={getOptimizedProjectImage(project.image)} alt={project.title}
        className="h-full max-h-[70vh] w-full object-contain p-2 sm:p-4" decoding="async" />
    </div>
    <div className="flex flex-col">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-theme-accent">{project.category}</div>
      <h1 id={headingId} className="mt-4 pr-12 text-4xl font-black uppercase tracking-tighter md:text-6xl">{project.title}</h1>
      <p className="mt-6 text-base leading-relaxed text-theme-text/80">{project.description}</p>
      {project.technologies.length > 0 && (
        <section className="mt-8 border-t border-theme-border/20 pt-6">
          <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-theme-text/60"><Database size={14} /> Technology</div>
          <div className="flex flex-wrap gap-2">{project.technologies.map((technology) => (
            <span key={technology} className="border border-theme-border/50 px-3 py-1 font-mono text-xs">{technology}</span>
          ))}</div>
        </section>
      )}
      {project.phases?.length ? (
        <section className="mt-8 border-t border-theme-border/20 pt-6">
          <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-theme-text/60"><GitBranch size={14} /> Process</div>
          <ol className="grid gap-2 sm:grid-cols-2">{project.phases.map((phase, index) => (
            <li key={`${phase}-${index}`} className="font-mono text-xs text-theme-text/70">{String(index + 1).padStart(2, '0')} / {phase}</li>
          ))}</ol>
        </section>
      ) : null}
      {project.link && (
        <a href={project.link} target="_blank" rel="noopener noreferrer"
          className="mt-10 inline-flex items-center justify-between border border-theme-border bg-theme-text px-5 py-4 font-mono font-bold uppercase tracking-wider text-theme-bg hover:bg-theme-accent hover:text-black">
          Launch project <ArrowRight size={18} />
        </a>
      )}
    </div>
  </article>
);