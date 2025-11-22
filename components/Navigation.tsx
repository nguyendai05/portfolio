import React, { useState, useEffect } from 'react';
import { track } from '@vercel/analytics';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Trophy, Clock, MapPin, Menu, X, Home, Briefcase, User, Mail, Image as ImageIcon, GraduationCap, Users } from 'lucide-react';
import { useGamification } from '../context/GamificationContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { TrophyCase } from './TrophyCase';

export const Navigation: React.FC = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  const location = useLocation();
  const { achievements, unlockAchievement, toggleTrophyCase } = useGamification();
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home', index: '01', icon: <Home size={18} /> },
    { path: '/work', label: 'Work', index: '02', icon: <Briefcase size={18} /> },
    { path: '/about', label: 'About', index: '03', icon: <User size={18} /> },
    { path: '/contact', label: 'Contact', index: '04', icon: <Mail size={18} /> },
    { path: '/gallery', label: 'Gallery', index: '05', icon: <ImageIcon size={18} /> },
    { path: '/mentorship', label: 'Mentorship', index: '06', icon: <GraduationCap size={18} /> },
    { path: '/collaboration', label: 'Collab', index: '07', icon: <Users size={18} /> },
  ];

  // Triple click logo logic
  const [logoClicks, setLogoClicks] = useState(0);
  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);
    if (logoClicks + 1 === 3) {
      unlockAchievement('secret_lab');
      const body = document.body;
      body.classList.add('animate-pulse-fast');
      setTimeout(() => body.classList.remove('animate-pulse-fast'), 1000);
      setLogoClicks(0);
    }
    setTimeout(() => setLogoClicks(0), 1000);
  };

  return (
    <>
      <TrophyCase />

      {/* --- DESKTOP NAVIGATION --- */}
      {!isMobile && (
        <>
          {/* Top Right HUD (Weather, Time, Theme, Trophy) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-6 right-8 z-50 flex flex-col items-end gap-4 pointer-events-none"
          >
            {/* Status Row */}
            <div className="flex items-center gap-6 text-[10px] font-mono tracking-wider text-theme-text/60 mix-blend-difference">
              <div className="flex items-center gap-2">
                <Cloud size={12} />
                <span>HCM CITY / 32°C</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={12} />
                <span>{time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={12} />
                <span>10.82°N, 106.62°E</span>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-3 pointer-events-auto bg-theme-bg/80 backdrop-blur-md p-2 rounded-xl border border-theme-border/10 shadow-sm">
              <ThemeSwitcher />
              <div className="w-[1px] h-4 bg-theme-border/20"></div>
              <button
                onClick={toggleTrophyCase}
                className="relative group p-2 hover:bg-theme-accent/10 rounded-lg transition-colors"
                title="Achievements"
              >
                <Trophy size={18} className="text-theme-text group-hover:text-theme-accent transition-colors" />
                {unlockedCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-theme-accent text-theme-bg text-[9px] font-bold flex items-center justify-center rounded-full">
                    {unlockedCount}
                  </span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Right Side Floating Nav Cluster */}
          <nav className="fixed right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-3 pointer-events-auto">
            {navLinks.map((link, i) => {
              const isSelected = isActive(link.path);
              return (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.5 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => track('nav_click', { target: link.path })}
                    className="relative flex items-center justify-end"
                  >
                    <motion.div
                      className={`
                        flex items-center justify-start overflow-hidden h-10 rounded-full border backdrop-blur-md cursor-pointer transition-colors duration-300
                        ${isSelected
                          ? 'bg-theme-accent text-theme-bg border-theme-accent shadow-[0_0_15px_rgba(var(--color-accent),0.3)]'
                          : 'bg-theme-bg/50 text-theme-text/60 border-theme-border/10 hover:bg-theme-text hover:text-theme-bg hover:border-theme-text'
                        }
                      `}
                      initial={false}
                      animate={{ width: isSelected ? 'auto' : '2.5rem' }}
                      whileHover={{ width: 'auto' }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                      <div className="min-w-[2.5rem] h-full flex items-center justify-center font-mono text-[10px] font-bold">
                        {link.index}
                      </div>

                      <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wider pr-4">
                        {link.label}
                      </span>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Left Side Identity Strip */}
          <aside className="fixed top-0 left-0 h-screen w-16 z-40 flex flex-col justify-between py-8 items-center pointer-events-none">
            {/* Logo */}
            <div className="flex-none pointer-events-auto">
              {/* Logo Area */}
              <Link to="/" onClick={handleLogoClick} className="relative group block">
                <div className="w-12 h-12 bg-theme-text text-theme-bg flex items-center justify-center font-mono text-sm font-bold relative z-10 transition-all duration-300 group-hover:bg-theme-accent group-hover:text-theme-text">XD</div>
                <div className="absolute top-1 left-1 w-12 h-12 border border-theme-text bg-transparent z-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1"></div>
              </Link>
            </div>

            {/* Vertical Text */}
            <div className="flex-1 flex items-center justify-center">
              <div className="writing-mode-vertical text-[10px] font-mono tracking-[0.3em] text-theme-text/30 mix-blend-difference">
                STUDENT / DEVELOPER / XUNI-DIZAN
              </div>
            </div>

            {/* Bottom Decor */}
            <div className="text-[10px] font-mono text-theme-text/30 writing-mode-vertical">
              v2.0
            </div>
          </aside>
        </>
      )}

      {/* --- MOBILE NAVIGATION --- */}
      {isMobile && (
        <>
          {/* Mobile Top Bar */}
          <header className="fixed top-0 left-0 right-0 h-16 z-50 px-6 flex items-center justify-between bg-theme-bg/80 backdrop-blur-md border-b border-theme-border/5">
            <Link to="/" onClick={handleLogoClick} className="font-bold font-mono text-lg tracking-tighter">
              XD
            </Link>

            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <button onClick={toggleTrophyCase} className="relative">
                <Trophy size={20} />
                {unlockedCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-theme-accent text-theme-bg text-[9px] rounded-full flex items-center justify-center font-bold">
                    {unlockedCount}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Mobile Bottom Nav */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-theme-bg/90 backdrop-blur-lg border-t border-theme-border/10 pb-safe">
            <div className="flex items-center gap-2 p-4 overflow-x-auto no-scrollbar">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => track('nav_click', { target: link.path })}
                  className={`relative flex flex-col items-center gap-1 min-w-[64px] transition-colors ${isActive(link.path) ? 'text-theme-accent' : 'text-theme-text/50'}`}
                >
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="mobileNavIndicator"
                      className="absolute -top-4 w-8 h-1 bg-theme-accent rounded-b-full"
                    />
                  )}
                  {link.icon}
                  <span className="text-[9px] font-mono uppercase whitespace-nowrap">{link.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}

      <style>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
      `}</style>
    </>
  );
};
