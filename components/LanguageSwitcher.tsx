import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Compact two-state language toggle (EN / VI). Designed to live next to the
 * ThemeSwitcher in the top-right HUD.
 */
export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggle = () => setLanguage(language === 'vi' ? 'en' : 'vi');

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2 py-1.5 hover:text-theme-accent transition-colors rounded-md"
      title={t('lang.switch')}
      aria-label={t('lang.switch')}
    >
      <Languages size={16} />
      <span className="font-mono text-[10px] font-bold tracking-wider uppercase">
        {language === 'vi' ? 'VI' : 'EN'}
      </span>
    </button>
  );
};
