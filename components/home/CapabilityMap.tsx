import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import type { Skill } from '../../services/portfolioService';

const GROUP_ORDER: Array<Skill['type']> = [
  'frontend',
  'backend',
  'database',
  'tool',
  'design',
  'language',
  'other',
];

interface CapabilityMapProps {
  skills: Skill[] | null;
}

export const CapabilityMap: React.FC<CapabilityMapProps> = ({ skills }) => {
  const { t } = useLanguage();

  const grouped = useMemo(() => {
    const result = new Map<Skill['type'], Skill[]>();
    if (!skills) return result;
    for (const skill of skills) {
      const key = (GROUP_ORDER.includes(skill.type as Skill['type'])
        ? skill.type
        : 'other') as Skill['type'];
      const list = result.get(key) ?? [];
      list.push(skill);
      result.set(key, list);
    }
    return result;
  }, [skills]);

  const groupsToRender = GROUP_ORDER.filter((key) => (grouped.get(key)?.length ?? 0) > 0);

  return (
    <section className="relative border-t border-theme-border bg-theme-bg">
      <div className="container mx-auto px-6 md:px-16 lg:px-32 py-24 md:py-32">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-theme-border pb-6 mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-theme-accent mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
              {t('home.capability.eyebrow')}
            </div>
            <h2 className="text-[8vw] md:text-[4.5vw] lg:text-[3.2vw] leading-[1] font-black tracking-tight text-theme-text">
              {t('home.capability.title')}
            </h2>
          </div>
          <p className="font-mono text-sm text-theme-text/60 md:max-w-sm">
            {t('home.capability.copy')}
          </p>
        </div>

        {groupsToRender.length === 0 ? (
          <div className="border border-dashed border-theme-border rounded-none p-12 text-center font-mono text-sm text-theme-text/50">
            {t('home.capability.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groupsToRender.map((key, index) => {
              const list = grouped.get(key) ?? [];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group relative border border-theme-border bg-theme-panel/40 backdrop-blur p-6 hover:border-theme-accent transition-colors"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-theme-accent">
                      {String(index + 1).padStart(2, '0')} /{' '}
                      {t(`home.capability.group.${key}` as never)}
                    </span>
                    <span className="font-mono text-[10px] text-theme-text/40">
                      {list.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {list.map((skill) => (
                      <span
                        key={skill.id ?? skill.name}
                        className="px-2.5 py-1 border border-theme-border bg-theme-bg/60 font-mono text-[11px] tracking-wide text-theme-text/85 hover:border-theme-accent hover:text-theme-accent transition-colors"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>

                  <div className="absolute -bottom-px right-0 w-12 h-px bg-theme-accent scale-x-0 group-hover:scale-x-100 origin-right transition-transform" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
