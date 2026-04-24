import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { translations, TranslationKey } from '../data/translations';

export type Language = 'en' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'xuni_language';
const DEFAULT_LANGUAGE: Language = 'vi';

const detectInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === 'en' || saved === 'vi') return saved;
  } catch {
    // ignore
  }
  const navLang = typeof navigator !== 'undefined' ? navigator.language || '' : '';
  return navLang.toLowerCase().startsWith('vi') ? 'vi' : 'en';
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLanguageState(detectInitialLanguage());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (lang: Language) => setLanguageState(lang);

  const t = useMemo(
    () =>
      (key: TranslationKey): string => {
        const dict = translations[language] || translations.en;
        const value = dict[key];
        if (typeof value === 'string') return value;
        const fallback = translations.en[key];
        return typeof fallback === 'string' ? fallback : (key as string);
      },
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
