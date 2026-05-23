import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchSkills, Skill } from '../../services/portfolioService';
import { useLanguage } from '../../context/LanguageContext';

const GROUP_ORDER: Array<Skill['type']> = [
  'frontend',
  'backend',
  'database',
  'tool',
  'design',
  'language',
  'other',
];

export const Toolkit: React.FC = () => {
  const { t } = useLanguage();
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSkills()
      .then((data) => {
        if (!cancelled) setSkills(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
  const isEmpty = error || (skills !== null && skills.length === 0);

  return (
    <section className="border-t border-theme-border pt-24 mt-32">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-theme-accent mb-4">
            SKILLS // LIVE
          </div>
          <h3 className="text-4xl md:text-5xl font-black tracking-tighter">
            {t('about.toolkit.title')}
          </h3>
        </div>
        <p className="font-mono text-sm text-theme-text/60 md:max-w-md leading-relaxed">
          {t('about.toolkit.copy')}
        </p>
      </div>

      {isEmpty ? (
        <div className="border border-dashed border-theme-border p-12 text-center font-mono text-sm text-theme-text/50">
          {t('about.toolkit.empty')}
        </div>
      ) : skills === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-theme-border bg-theme-panel/30 h-32 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {groupsToRender.map((key, idx) => {
            const list = grouped.get(key) ?? [];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="border border-theme-border bg-theme-panel/40 backdrop-blur p-6 hover:border-theme-accent transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-theme-accent">
                    {String(idx + 1).padStart(2, '0')} /{' '}
                    {t(`home.capability.group.${key}` as never)}
                  </span>
                  <span className="font-mono text-[10px] text-theme-text/40">
                    {list.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((skill) => (
                    <span
                      key={skill.id ?? skill.name}
                      className="px-2.5 py-1 border border-theme-border bg-theme-bg/60 font-mono text-[11px] tracking-wide text-theme-text/85"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};
