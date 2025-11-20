import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface GamificationContextType {
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  neoMode: boolean;
  debugMode: boolean;
  isTrophyCaseOpen: boolean;
  toggleTrophyCase: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

const ACHIEVEMENTS_DATA: Achievement[] = [
  { id: 'konami', title: 'Cheat Code', description: 'Entered the Konami Code.', icon: '🎮', unlocked: false },
  { id: 'hacker', title: 'Hack The Planet', description: 'Accessed the mainframe.', icon: '💻', unlocked: false },
  { id: 'debug', title: 'Bug Hunter', description: 'Activated debug mode.', icon: '🐛', unlocked: false },
  { id: 'secret_lab', title: 'Secret Lab', description: 'Found the hidden entrance.', icon: '🧪', unlocked: false },
  { id: 'night_owl', title: 'Night Owl', description: 'Visited during the witching hour.', icon: '🦉', unlocked: false },
  { id: 'connoisseur', title: 'Art Connoisseur', description: 'Viewed all generative art pieces.', icon: '🎨', unlocked: false },
  { id: 'talkative', title: 'Conversationalist', description: 'Had a long chat with AI.', icon: '💬', unlocked: false },
];

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_DATA);
  const [neoMode, setNeoMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [isTrophyCaseOpen, setIsTrophyCaseOpen] = useState(false);
  const [inputBuffer, setInputBuffer] = useState('');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('xuni_achievements');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAchievements(prev => prev.map(a => {
        const savedAch = parsed.find((p: any) => p.id === a.id);
        return savedAch ? { ...a, unlocked: savedAch.unlocked } : a;
      }));
    }

    // Check time for Night Owl achievement
    const now = new Date();
    if (now.getHours() >= 23 || now.getHours() < 4) {
      // Logic to unlock would go here, simplified for now to avoid infinite loops
    }
  }, []);

  // Persist achievements
  useEffect(() => {
    localStorage.setItem('xuni_achievements', JSON.stringify(achievements));
  }, [achievements]);

  const unlockAchievement = (id: string) => {
    setAchievements(prev => {
      const exists = prev.find(a => a.id === id);
      if (exists && !exists.unlocked) {
        // In a real app, we would trigger a toast here
        return prev.map(a => a.id === id ? { ...a, unlocked: true } : a);
      }
      return prev;
    });
  };

  // Global Key Listener for Easter Eggs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setInputBuffer(prev => (prev + e.key).slice(-30));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Code detection logic
  useEffect(() => {
    const buffer = inputBuffer.toLowerCase();
    
    // Konami Code: ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba
    if (buffer.includes('arrowuparrowuparrowdownarrowdownarrowleftarrowrightarrowleftarrowrightarrowba')) {
      unlockAchievement('konami');
      setNeoMode(prev => !prev);
      setInputBuffer('');
    }
    if (buffer.includes('hacktheplanet')) {
      unlockAchievement('hacker');
      setNeoMode(true);
      setInputBuffer('');
    }
    if (buffer.includes('debugmode')) {
      unlockAchievement('debug');
      setDebugMode(prev => !prev);
      setInputBuffer('');
    }
  }, [inputBuffer]);

  const toggleTrophyCase = () => setIsTrophyCaseOpen(prev => !prev);

  return (
    <GamificationContext.Provider value={{ 
      achievements, 
      unlockAchievement, 
      neoMode, 
      debugMode, 
      isTrophyCaseOpen, 
      toggleTrophyCase 
    }}>
      {children}
    </GamificationContext.Provider>
  );
};