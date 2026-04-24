import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

const getInitial = () =>
  typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false;

/**
 * Shared mobile-breakpoint hook backed by `matchMedia` so every component
 * subscribes to a single browser event instead of attaching its own
 * `resize` listener and re-rendering on every resize frame.
 */
export const useIsMobile = (breakpoint: number = MOBILE_BREAKPOINT): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(getInitial);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handleChange(mql);

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    }

    // Safari < 14 fallback
    mql.addListener(handleChange);
    return () => mql.removeListener(handleChange);
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
