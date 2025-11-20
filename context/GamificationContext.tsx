import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  hint?: string; // Hint for locked achievements
}

interface GamificationContextType {
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  neoMode: boolean;
  debugMode: boolean;
  isTrophyCaseOpen: boolean;
  toggleTrophyCase: () => void;
  showToast: (achievement: Achievement) => void;
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
  {
    id: 'konami',
    title: 'Cheat Code',
    description: 'Entered the Konami Code.',
    icon: '🎮',
    unlocked: false,
    hint: 'Try a classic game cheat sequence...'
  },
  {
    id: 'hacker',
    title: 'Hack The Planet',
    description: 'Accessed the mainframe.',
    icon: '💻',
    unlocked: false,
    hint: 'Type a certain hacker phrase...'
  },
  {
    id: 'debug',
    title: 'Bug Hunter',
    description: 'Activated debug mode.',
    icon: '🐛',
    unlocked: false,
    hint: 'Developers need a special mode...'
  },
  {
    id: 'secret_lab',
    title: 'Secret Lab',
    description: 'Found the hidden entrance.',
    icon: '🧪',
    unlocked: false,
    hint: 'Click the logo multiple times quickly...'
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Visited during the witching hour.',
    icon: '🦉',
    unlocked: false,
    hint: 'Visit late at night (11 PM - 4 AM)...'
  },
  {
    id: 'connoisseur',
    title: 'Art Connoisseur',
    description: 'Viewed all generative art pieces.',
    icon: '🎨',
    unlocked: false,
    hint: 'Explore the Gallery section thoroughly...'
  },
  {
    id: 'talkative',
    title: 'Conversationalist',
    description: 'Had a long chat with AI.',
    icon: '💬',
    unlocked: false,
    hint: 'Have a conversation with the chatbot...'
  },
];

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_DATA);
  const [neoMode, setNeoMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [isTrophyCaseOpen, setIsTrophyCaseOpen] = useState(false);
  const [inputBuffer, setInputBuffer] = useState('');
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

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

  const showToast = (achievement: Achievement) => {
    setToastQueue(prev => [...prev, achievement]);
    setTimeout(() => {
      setToastQueue(prev => prev.filter(a => a.id !== achievement.id));
    }, 3500); // Toast displays for 3.5 seconds
  };

  const unlockAchievement = (id: string) => {
    setAchievements(prev => {
      const exists = prev.find(a => a.id === id);
      if (exists && !exists.unlocked) {
        // Trigger toast notification
        showToast(exists);
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
      toggleTrophyCase,
      showToast
    }}>
      {children}

      {/* Achievement Toast Notifications */}
      <div className="fixed top-20 right-8 z-[200] flex flex-col gap-3">
        {toastQueue.map((achievement) => (
          <div
            key={achievement.id}
            className="bg-gradient-to-br from-mantis-green/95 to-mantis-green/80 backdrop-blur-xl text-black p-4 rounded-lg shadow-[0_0_30px_rgba(57,255,20,0.4)] border border-mantis-green flex items-center gap-4 min-w-[300px] animate-[slideInRight_0.3s_ease-out]"
          >
            <div className="text-3xl">{achievement.icon}</div>
            <div className="flex-1">
              <div className="font-bold text-sm uppercase tracking-wider">Achievement Unlocked!</div>
              <div className="text-xs opacity-90 mt-0.5">{achievement.title}</div>
            </div>
          </div>
        ))}
      </div>
    </GamificationContext.Provider>
  );
};