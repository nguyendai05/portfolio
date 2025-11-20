import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 
  | 'focused' 
  | 'night_owl' 
  | 'early_bird' 
  | 'rainy_day' 
  | 'celebration' 
  | 'zen' 
  | 'cyberpunk' 
  | 'retro';

export interface ThemeColors {
  bg: string;
  text: string;
  accent: string;
  panel: string;
  border: string;
}

export const THEMES: Record<ThemeMode, ThemeColors> = {
  focused: {
    bg: '#e6e6e6',
    text: '#0a0a0a',
    accent: '#39ff14',
    panel: '#ffffff',
    border: '#0a0a0a',
  },
  night_owl: {
    bg: '#0f172a',
    text: '#e2e8f0',
    accent: '#38bdf8',
    panel: '#1e293b',
    border: '#334155',
  },
  early_bird: {
    bg: '#fff7ed',
    text: '#431407',
    accent: '#f97316',
    panel: '#ffffff',
    border: '#fdba74',
  },
  rainy_day: {
    bg: '#cfd8dc',
    text: '#263238',
    accent: '#607d8b',
    panel: '#eceff1',
    border: '#546e7a',
  },
  celebration: {
    bg: '#fdf4ff',
    text: '#4a044e',
    accent: '#d946ef',
    panel: '#ffffff',
    border: '#f0abfc',
  },
  zen: {
    bg: '#f5f5f4',
    text: '#292524',
    accent: '#78716c',
    panel: '#ffffff',
    border: '#a8a29e',
  },
  cyberpunk: {
    bg: '#000000',
    text: '#39ff14',
    accent: '#ff00ff',
    panel: '#111111',
    border: '#39ff14',
  },
  retro: {
    bg: '#1a1a1a',
    text: '#00ff00',
    accent: '#00ff00',
    panel: '#000000',
    border: '#00ff00',
  },
};

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('focused');

  useEffect(() => {
    // Automatic time-based detection on mount
    const hour = new Date().getHours();
    const savedTheme = localStorage.getItem('xuni_theme') as ThemeMode;
    
    if (savedTheme && THEMES[savedTheme]) {
      setTheme(savedTheme);
    } else if (hour >= 22 || hour < 6) {
      setTheme('night_owl');
    } else if (hour >= 6 && hour < 10) {
      setTheme('early_bird');
    }
  }, []);

  useEffect(() => {
    const colors = THEMES[theme];
    const root = document.documentElement;
    
    root.style.setProperty('--color-bg', colors.bg);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-panel', colors.panel);
    root.style.setProperty('--color-border', colors.border);

    localStorage.setItem('xuni_theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};