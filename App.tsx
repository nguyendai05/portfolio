
import React, { useState, useEffect, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigation } from './components/Navigation';
import { NeuralInterface } from './components/NeuralInterface';
import { Preloader } from './components/Preloader';
import { Home } from './pages/Home';
import { Work } from './pages/Work';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Gallery } from './pages/Gallery';
import { Mentorship } from './pages/Mentorship';
import { Collaboration } from './pages/Collaboration';
import { GamificationProvider, useGamification } from './context/GamificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const GlobalEffects = () => {
  const { neoMode, debugMode } = useGamification();
  const { theme, setTheme } = useTheme();

  // Sync Neo Mode with Cyberpunk theme
  useEffect(() => {
    if (neoMode && theme !== 'cyberpunk') {
      setTheme('cyberpunk');
    }
  }, [neoMode]);

  return (
    <>
      {debugMode && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999] border-4 border-red-500/50">
          <div className="absolute top-4 left-24 bg-red-500 text-black px-2 font-mono text-xs font-bold">DEBUG MODE ACTIVE</div>
          <div className="absolute bottom-4 right-24 bg-black text-red-500 px-2 font-mono text-xs">FPS: 60 | MEM: 42MB</div>
        </div>
      )}
    </>
  );
};

const ThemeEffects = () => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Rain / Confetti Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: any[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    if (theme === 'rainy_day') {
      for (let i = 0; i < 100; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: Math.random() * 5 + 2,
          len: Math.random() * 20 + 10
        });
      }
    } else if (theme === 'celebration') {
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          color: `hsl(${Math.random() * 360}, 100%, 50%)`,
          size: Math.random() * 5 + 2,
          speedY: Math.random() * 2 + 1,
          speedX: Math.random() * 2 - 1
        });
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (theme === 'rainy_day') {
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        particles.forEach(p => {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.len);
          p.y += p.speed;
          if (p.y > canvas.height) {
            p.y = -p.len;
            p.x = Math.random() * canvas.width;
          }
        });
        ctx.stroke();
      } else if (theme === 'celebration') {
        particles.forEach(p => {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.speedY;
          p.x += p.speedX;
          if (p.y > canvas.height) p.y = -10;
          if (p.x > canvas.width) p.x = 0;
          if (p.x < 0) p.x = canvas.width;
        });
      } else if (theme === 'cyberpunk') {
        // Simple Matrix-lite effect for background
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.font = '12px monospace';
        if (Math.random() > 0.9) {
          const x = Math.floor(Math.random() * canvas.width / 12) * 12;
          const y = Math.floor(Math.random() * canvas.height / 12) * 12;
          ctx.fillText(Math.random() > 0.5 ? '1' : '0', x, y);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  if (!['rainy_day', 'celebration', 'cyberpunk', 'retro'].includes(theme)) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[0]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {theme === 'retro' && (
        <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
      )}
    </div>
  );
};

// Inner App component to use Router hooks
const AppContent = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative min-h-screen bg-theme-bg text-theme-text transition-colors duration-500">
      <ThemeEffects />
      <GlobalEffects />
      <AnimatePresence mode="wait">
        {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      {!isLoading && (
        <>
          <ScrollToTop />
          <Navigation />
          <NeuralInterface />

          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/work" element={<Work />} />
              <Route path="/about" element={<About />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/mentorship" element={<Mentorship />} />
              <Route path="/collaboration" element={<Collaboration />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

function getCurrentSpeedInsightsRoute(): string | null {
  if (typeof window === 'undefined') return null;

  if (window.location.hash && window.location.hash.startsWith('#/')) {
    const hashPath = window.location.hash.slice(1); // '/about', '/work', etc.
    return hashPath || '/';
  }

  // Fallback for non-hash URLs (should be just '/')
  return window.location.pathname || '/';
}

function App() {
  return (
    <ThemeProvider>
      <GamificationProvider>
        <Router>
          <AppContent />
        </Router>
        <Analytics
          mode={import.meta.env.DEV ? 'development' : 'production'}
          debug={import.meta.env.DEV}
          beforeSend={(event) => {
            try {
              const url = new URL(event.url);
              // If we are on a hash route like #/about, include that in the path
              if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
                const hashPath = window.location.hash.slice(1); // e.g. '/about'
                url.pathname = hashPath || '/';
              }
              return {
                ...event,
                url: url.toString(),
              };
            } catch {
              return event;
            }
          }}
        />
        {/* Vercel Speed Insights – tracks Core Web Vitals for this SPA. */}
        {/* Requires Speed Insights to be enabled in the Vercel dashboard (Project → Speed Insights). */}
        <SpeedInsights route={getCurrentSpeedInsightsRoute()} />
      </GamificationProvider>
    </ThemeProvider>
  );
}

export default App;
