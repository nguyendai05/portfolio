import React, { useEffect, useMemo, useRef } from 'react';
import { track } from '@vercel/analytics';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Project } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { localizeProject } from '../data/projectTranslations';
import { ProjectCaseStudy } from './ProjectCaseStudy';

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  const { language, t } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  const localized = useMemo(() => localizeProject(project, language), [project, language]);

  useEffect(() => {
    track('project_open', { id: project.id, source: 'modal' });
  }, [project.id]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hasAttribute('hidden'));
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-case-study-title"
        tabIndex={-1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] overflow-y-auto bg-theme-bg/95 p-3 backdrop-blur-md md:p-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={(event) => event.stopPropagation()}
          className="relative mx-auto min-h-[calc(100vh-1.5rem)] max-w-7xl border border-theme-border/40 bg-theme-panel p-5 shadow-2xl md:min-h-0 md:p-10"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={t('modal.close')}
            className="absolute right-4 top-4 z-20 border border-theme-border/40 bg-theme-bg p-2 text-theme-text hover:border-theme-accent hover:text-theme-accent"
          >
            <X size={20} />
          </button>
          <ProjectCaseStudy project={localized} headingId="project-case-study-title" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
