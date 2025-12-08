import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navigation } from './components/Navigation';
import { Preloader } from './components/Preloader';
import { GamificationProvider, useGamification } from './context/GamificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Lazy‑load heavy components so chúng không nằm hết trong initial bundle
const NeuralInterface = lazy(() =>
  import('./components/NeuralInterface').then((module) => ({ default: module.NeuralInterface }))
);
const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const Work = lazy(() => import('./pages/Work').then((module) => ({ default: module.Work })));
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Contact = lazy(() => import('./pages/Contact').then((module) => ({ default: module.Contact })));
const Gallery = lazy(() => import('./pages/Gallery').then((module) => ({ default: module.Gallery })));
const Mentorship = lazy(() =>
  import('./pages/Mentorship').then((module) => ({ default: module.Mentorship }))
);
const Collaboration = lazy(() =>
  import('./pages/Collaboration').then((module) => ({ default: module.Collaboration }))
);

// Scroll to top when route changes
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const GlobalEffects: React.FC = () => {
  const { neoMode, debugMode } = useGamification();
  const { theme, setTheme } = useTheme();

  // Neo mode = ép theme cyberpunk
  useEffect(() => {
    if (neoMode && theme !== 'cyberpunk') {
      setTheme('cyberpunk');
    }
  }, [neoMode, theme, setTheme]);

  if (!debugMode) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999] border-4 border-red-500/50">
      <div className="absolute top-4 left-24 bg-red-500 text-black px-2 font-mono text-xs font-bold">
        DEBUG MODE ACTIVE
      </div>
      <div className="absolute bottom-4 right-24 bg-black text-red-500 px-2 font-mono text-xs">
        FPS: 60 | MEM: 42MB
      </div>
    </div>
  );
};

const ThemeEffects: React.FC = () => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Reduce particles on mobile for better performance
    const isMobile = window.innerWidth < 768;

    if (theme === 'rainy_day') {
      // Giảm nhẹ số hạt để bớt tốn CPU nhưng vẫn giống hiệu ứng cũ
      const count = isMobile ? 30 : 70;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: Math.random() * 4 + 2,
          len: Math.random() * 18 + 8,
        });
      }
    } else if (theme === 'celebration') {
      const count = isMobile ? 15 : 35;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          color: `hsl(${Math.random() * 360}, 100%, 50%)`,
          size: Math.random() * 4 + 2,
          speedY: Math.random() * 1.5 + 0.8,
          speedX: Math.random() * 1.5 - 0.75,
        });
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (theme === 'rainy_day') {
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        particles.forEach((p) => {
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
        particles.forEach((p) => {
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
        ctx.fillStyle = 'rgba(0, 255, 0, 0.08)';
        ctx.font = '12px monospace';
        if (Math.random() > 0.95) {
          const x = Math.floor((Math.random() * canvas.width) / 12) * 12;
          const y = Math.floor((Math.random() * canvas.height) / 12) * 12;
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
        <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const [showPreloader, setShowPreloader] = useState(true);

  // Failsafe: shorter duration to improve LCP on both mobile and desktop
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    // Desktop: further reduced to 400ms for better LCP
    // Mobile: keep 800ms unchanged
    const maxDuration = isMobile ? 800 : 400; // ms - faster on desktop
    const timeout = setTimeout(() => setShowPreloader(false), maxDuration);
    return () => clearTimeout(timeout);
  }, []);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
  };

  return (
    <div className="relative min-h-screen bg-theme-bg text-theme-text transition-colors duration-500">
      <ThemeEffects />
      <GlobalEffects />

      {/* App content luôn render ngay lập tức, không bị ẩn → LCP không bị chặn */}
      <ScrollToTop />
      <Navigation />

      <Suspense fallback={null}>
        <NeuralInterface />
      </Suspense>

      <Suspense fallback={<div className="min-h-screen" />}>
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
      </Suspense>

      {/* Preloader chỉ là overlay, không ẩn nội dung bên dưới */}
      <AnimatePresence>
        {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}
      </AnimatePresence>
    </div>
  );
};

function getCurrentSpeedInsightsRoute(): string | null {
  if (typeof window === 'undefined') return null;

  // Dùng HashRouter nên cần map từ hash sang path cho Speed Insights
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    const hashPath = window.location.hash.slice(1); // '/about', '/work', ...
    return hashPath || '/';
  }

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
              // Nếu đang ở hash route (#/about) thì ghi đúng path để analytics/insights hiểu
              if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
                const hashPath = window.location.hash.slice(1);
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
        <SpeedInsights route={getCurrentSpeedInsightsRoute()} />
      </GamificationProvider>
    </ThemeProvider>
  );
}

export default App;
