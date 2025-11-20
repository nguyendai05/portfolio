
import React, { useState, useEffect } from 'react';
import { Cloud, Trophy } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useGamification } from '../context/GamificationContext';
import { TrophyCase } from './TrophyCase';
import { ThemeSwitcher } from './ThemeSwitcher';

export const Navigation: React.FC = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const location = useLocation();
  const { achievements, unlockAchievement, toggleTrophyCase } = useGamification();
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home', index: '01' },
    { path: '/work', label: 'Work', index: '02' },
    { path: '/about', label: 'About', index: '03' },
    { path: '/contact', label: 'Contact', index: '04' },
    { path: '/gallery', label: 'Gallery', index: '05' },
    { path: '/mentorship', label: 'Mentorship', index: '06' },
    { path: '/collaboration', label: 'Collab', index: '07' },
  ];

  // Triple click logo logic
  const [logoClicks, setLogoClicks] = useState(0);
  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);
    if (logoClicks + 1 === 3) {
      unlockAchievement('secret_lab');
      // Visual feedback handled via context or simple animation here
      document.body.classList.add('animate-pulse-fast');
      setTimeout(() => document.body.classList.remove('animate-pulse-fast'), 1000);
      setLogoClicks(0);
    }
    // Reset clicks if too slow
    setTimeout(() => setLogoClicks(0), 1000);
  };

  return (
    <>
      <TrophyCase />
      {/* Top Right Header */}
      <header className="fixed top-0 right-0 p-8 md:p-10 z-50 flex items-start gap-8 md:gap-12 text-xs font-mono tracking-wide text-theme-text pointer-events-none">
        <div className="hidden md:flex flex-col items-end gap-1 opacity-60 mix-blend-difference">
          <div className="flex items-center gap-2">
            <Cloud size={12} />
            <span>HO CHI MINH CITY</span>
          </div>
          <div>32° HUMID</div>
        </div>

        <div className="flex flex-col items-end gap-6 pointer-events-auto">
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <button
              onClick={toggleTrophyCase}
              className="relative group hover:text-theme-accent transition-all duration-300 p-2 rounded-lg hover:bg-theme-accent/10"
              title="View Achievements"
            >
              <Trophy size={20} className="group-hover:scale-110 transition-transform duration-300" strokeWidth={1.8} />

              {/* Achievement count badge */}
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-theme-accent text-theme-bg rounded-full text-[10px] font-bold font-mono flex items-center justify-center shadow-lg">
                {unlockedCount}
              </span>

              {/* Pulse indicator */}
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-theme-accent rounded-full animate-pulse opacity-75"></span>
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-theme-accent rounded-full opacity-50 animate-ping"></span>
            </button>
          </div>

          <nav className="flex flex-col items-end gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`group flex items-center justify-end gap-3 transition-all duration-300 ${isActive(link.path) ? 'text-theme-accent' : 'hover:text-theme-accent text-theme-text'}`}
              >
                <span className={`font-mono text-[10px] font-bold transition-all duration-300 ${isActive(link.path) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                  {link.index}
                </span>
                <span className={`text-sm md:text-base font-bold uppercase tracking-wider decoration-2 underline-offset-4 transition-all ${isActive(link.path) ? 'line-through decoration-theme-accent' : 'hover:line-through hover:decoration-theme-accent'}`}>
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Left Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-16 md:w-24 z-50 border-r border-theme-border/10 flex flex-col justify-between py-10 items-center pointer-events-none bg-transparent text-theme-text">
        <div className="flex-none pointer-events-auto">
          {/* Logo Area */}
          <Link to="/" onClick={handleLogoClick} className="relative group block">
            <div className="w-12 h-12 bg-theme-text text-theme-bg flex items-center justify-center font-mono text-sm font-bold relative z-10 transition-all duration-300 group-hover:bg-theme-accent group-hover:text-theme-text">XD</div>
            <div className="absolute top-1 left-1 w-12 h-12 border border-theme-text bg-transparent z-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1"></div>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center pointer-events-auto">
          <div className="writing-mode-vertical text-[10px] md:text-xs font-mono tracking-[0.25em] opacity-60 flex gap-12 hover:text-theme-accent transition-colors duration-500 select-none cursor-default">
            <span>STUDENT</span>
            <span>DEVELOPER</span>
            <span>XUNI-DIZAN</span>
          </div>
        </div>

        <div className="flex-none flex items-end">
          <div className="writing-mode-vertical text-[10px] font-mono opacity-40 hover:opacity-100 transition-opacity">
            MADE WITH CODE <span className="text-xs text-theme-accent animate-pulse">♥</span>
          </div>
        </div>
      </aside>

      {/* Bottom Right Coordinates */}
      <div className="fixed bottom-8 right-8 z-40 hidden md:flex flex-col items-end text-[10px] font-mono opacity-40 pointer-events-none text-theme-text mix-blend-difference">
        <span className="mb-6">{time}</span>
        <div className="writing-mode-vertical tracking-widest h-24 flex items-center gap-2">
          <span>10.8231° N, 106.6297° E</span>
          <div className="w-[1px] h-full bg-theme-text/30"></div>
        </div>
      </div>

      <style>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
        }
      `}</style>
    </>
  );
};
