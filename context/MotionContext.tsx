import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface MotionContextValue {
  motionEnabled: boolean;
  pausedByUser: boolean;
  reducedBySystem: boolean;
  setPausedByUser: (paused: boolean) => void;
  toggleMotion: () => void;
}

const MotionContext = createContext<MotionContextValue | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const [reducedBySystem, setReducedBySystem] = useState(false);
  const [pausedByUser, setPausedByUserState] = useState(() => {
    try { return localStorage.getItem('xuni_motion_paused') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedBySystem(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const setPausedByUser = (paused: boolean) => {
    setPausedByUserState(paused);
    try { localStorage.setItem('xuni_motion_paused', String(paused)); } catch {}
  };
  const value = useMemo(() => ({
    motionEnabled: !reducedBySystem && !pausedByUser,
    pausedByUser,
    reducedBySystem,
    setPausedByUser,
    toggleMotion: () => setPausedByUser(!pausedByUser),
  }), [pausedByUser, reducedBySystem]);

  useEffect(() => {
    document.documentElement.dataset.motion = value.motionEnabled ? 'full' : 'reduced';
  }, [value.motionEnabled]);

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotionPolicy(): MotionContextValue {
  const value = useContext(MotionContext);
  if (!value) throw new Error('useMotionPolicy must be used inside MotionProvider');
  return value;
}
