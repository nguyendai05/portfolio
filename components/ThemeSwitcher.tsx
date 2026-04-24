import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Sun, Moon, CloudRain, Zap, Terminal, PartyPopper, Coffee } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { TranslationKey } from '../data/translations';

const themes: { id: ThemeMode; icon: React.ReactNode; labelKey: TranslationKey }[] = [
  { id: 'focused', icon: <Terminal size={16} />, labelKey: 'theme.focused' },
  { id: 'night_owl', icon: <Moon size={16} />, labelKey: 'theme.nightOwl' },
  { id: 'early_bird', icon: <Sun size={16} />, labelKey: 'theme.earlyBird' },
  { id: 'rainy_day', icon: <CloudRain size={16} />, labelKey: 'theme.rainyDay' },
  { id: 'celebration', icon: <PartyPopper size={16} />, labelKey: 'theme.celebration' },
  { id: 'zen', icon: <Coffee size={16} />, labelKey: 'theme.zen' },
  { id: 'cyberpunk', icon: <Zap size={16} />, labelKey: 'theme.cyberpunk' },
  { id: 'retro', icon: <Terminal size={16} />, labelKey: 'theme.retro' },
];

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:text-theme-accent transition-colors"
        title={t('nav.changeTheme')}
      >
        <Palette size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-4 w-48 bg-theme-panel border border-theme-border shadow-xl rounded-lg overflow-hidden"
          >
             <div className="py-2">
                <div className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest opacity-50">{t('theme.selectMood')}</div>
                {themes.map((themeItem) => (
                   <button
                     key={themeItem.id}
                     onClick={() => { setTheme(themeItem.id); setIsOpen(false); }}
                     className={`w-full px-4 py-2 text-sm flex items-center gap-3 hover:bg-theme-accent hover:text-black transition-colors ${theme === themeItem.id ? 'text-theme-accent font-bold' : ''}`}
                   >
                      {themeItem.icon}
                      <span>{t(themeItem.labelKey)}</span>
                   </button>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isOpen && (
         <div 
           className="fixed inset-0 z-[-1]" 
           onClick={() => setIsOpen(false)}
         ></div>
      )}
    </div>
  );
};
