import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Layers, Send } from 'lucide-react';
import { GlitchText } from '../GlitchText';
import { useLanguage } from '../../context/LanguageContext';

interface Stat {
  value: number | string;
  label: string;
}

interface IdentityIntroProps {
  stats: Stat[];
}

export const IdentityIntro: React.FC<IdentityIntroProps> = ({ stats }) => {
  const { t } = useLanguage();

  return (
    <section className="relative border-t border-theme-border bg-theme-bg overflow-hidden">
      <div className="container mx-auto px-6 md:px-16 lg:px-32 py-24 md:py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-7 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-theme-accent mb-8"
            >
              <span className="w-8 h-[1px] bg-theme-accent" />
              {t('home.intro.eyebrow')}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6 }}
              className="text-[8vw] md:text-[5vw] lg:text-[3.6vw] leading-[1.05] font-black tracking-tight text-theme-text mb-10"
            >
              <GlitchText
                text={t('home.intro.headline')}
                highlightWord={t('home.intro.headlineHighlight')}
                highlightStyle="font-serif italic text-theme-accent"
              />
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 font-mono text-sm leading-relaxed text-theme-text/80">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-theme-text/40 mb-3">
                  {t('home.intro.buildLabel')}
                </div>
                <p>{t('home.intro.buildCopy')}</p>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-theme-text/40 mb-3">
                  {t('home.intro.focusLabel')}
                </div>
                <p>{t('home.intro.focusCopy')}</p>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap gap-3">
              <Link
                to="/work"
                className="group inline-flex items-center gap-2 bg-theme-text text-theme-bg px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] hover:bg-theme-accent hover:text-black transition-colors"
              >
                {t('home.intro.primaryCta')}
                <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 border border-theme-text text-theme-text px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] hover:bg-theme-text hover:text-theme-bg transition-colors"
              >
                <Send size={12} />
                {t('home.intro.secondaryCta')}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative border border-theme-border bg-theme-panel/60 backdrop-blur p-6 md:p-8 shadow-[12px_12px_0_0_var(--color-text)]"
            >
              <div className="flex items-center justify-between border-b border-theme-border pb-3 mb-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-theme-text/50">
                  IDENTITY // v1.0
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-theme-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
                  ONLINE
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-theme-text/40 mb-1">
                    OPERATOR
                  </div>
                  <div className="text-lg md:text-xl font-bold tracking-tight text-theme-text">
                    {t('home.intro.identity')}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-theme-accent mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-theme-text/40 mb-0.5">
                      {t('home.intro.locationLabel')}
                    </div>
                    <div className="text-sm text-theme-text/85">{t('home.intro.location')}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Layers size={14} className="text-theme-accent mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-theme-text/40 mb-0.5">
                      {t('home.intro.stackLabel')}
                    </div>
                    <div className="text-sm text-theme-text/85 font-mono">{t('home.intro.stack')}</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-theme-border bg-theme-bg/50 p-3 flex flex-col"
                  >
                    <span className="text-2xl md:text-3xl font-black tracking-tight text-theme-text">
                      {stat.value}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-theme-text/50 mt-1">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
