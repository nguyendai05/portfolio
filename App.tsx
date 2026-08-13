import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navigation } from './components/Navigation';
import { Preloader } from './components/Preloader';
import { GamificationProvider, useGamification } from './context/GamificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { MotionProvider, useMotionPolicy } from './context/MotionContext';

// Lazy-load heavy components out of the initial bundle.
const NeuralInterface = lazy(() =>
  import('./components/NeuralInterface').then((module) => ({ default: module.NeuralInterface }))
);
const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const Work = lazy(() => import('./pages/Work').then((module) => ({ default: module.Work })));
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Contact = lazy(() => import('./pages/Contact').then((module) => ({ default: module.Contact })));
const Gallery = lazy(() => import('./pages/Gallery').then((module) => ({ default: module.Gallery })));
const ProjectDetail = lazy(() =>
  import('./pages/ProjectDetail').then((module) => ({ default: module.ProjectDetail }))
);
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));

// Admin (lazy) - separated bundle so public visitors don't pay for it
const AdminLogin = lazy(() =>
  import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin }))
);
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AdminProjectsList = lazy(() =>
  import('./pages/admin/AdminProjectsList').then((m) => ({ default: m.AdminProjectsList }))
);
const AdminProjectForm = lazy(() =>
  import('./pages/admin/AdminProjectForm').then((m) => ({ default: m.AdminProjectForm }))
);
const AdminSkills = lazy(() =>
  import('./pages/admin/AdminSkills').then((m) => ({ default: m.AdminSkills }))
);
const AdminMilestones = lazy(() =>
  import('./pages/admin/AdminMilestones').then((m) => ({ default: m.AdminMilestones }))
);
const AdminExperiments = lazy(() =>
  import('./pages/admin/AdminExperiments').then((m) => ({ default: m.AdminExperiments }))
);
const AdminMessages = lazy(() =>
  import('./pages/admin/AdminMessages').then((m) => ({ default: m.AdminMessages }))
);
const AdminGuard = lazy(() =>
  import('./components/admin/AdminGuard').then((m) => ({ default: m.AdminGuard }))
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
  const { motionEnabled } = useMotionPolicy();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !motionEnabled || document.visibilityState !== 'visible') return;

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
  }, [theme, motionEnabled]);

  if (!motionEnabled || !['rainy_day', 'celebration', 'cyberpunk', 'retro'].includes(theme)) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[0]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {theme === 'retro' && (
        <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      )}
    </div>
  );
};

const NeuralInterfaceGate: React.FC<{ onActivate: () => void }> = ({ onActivate }) => {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onActivate}
      className="fixed bottom-20 right-4 z-50 flex items-center justify-center group md:bottom-8 md:right-8"
      aria-label={t('chat.trigger')}
    >
      <span className="absolute inset-0 rounded-full bg-theme-accent/20 animate-ping opacity-75" />
      <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-theme-border bg-theme-panel text-xs font-black text-theme-accent shadow-[4px_4px_0px_0px_var(--color-border)] transition-all group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-[2px_2px_0px_0px_var(--color-border)]">
        AI
      </span>
      <span className="absolute right-full mr-4 hidden rounded bg-theme-text px-2 py-1 font-mono text-[10px] whitespace-nowrap text-theme-bg opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 md:block">
        {t('chat.trigger')}
      </span>
    </button>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHomeRoute = location.pathname === '/';
  const [showPreloader, setShowPreloader] = useState(isHomeRoute);
  const [shouldLoadNeuralInterface, setShouldLoadNeuralInterface] = useState(false);

  // Failsafe: shorter duration to improve LCP on both mobile and desktop
  useEffect(() => {
    if (!showPreloader) return;
    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxDuration = prefersReducedMotion ? 0 : isMobile ? 500 : 250;
    const timeout = setTimeout(() => setShowPreloader(false), maxDuration);
    return () => clearTimeout(timeout);
  }, [showPreloader]);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
  };

  return (
    <div className="relative min-h-screen bg-theme-bg text-theme-text transition-colors duration-500">
      <ThemeEffects />
      <GlobalEffects />

      {/* App content luôn render ngay lập tức, không bị ẩn → LCP không bị chặn */}
      <ScrollToTop />
      {!isAdminRoute && <Navigation />}

      {!isAdminRoute && !shouldLoadNeuralInterface && (
        <NeuralInterfaceGate onActivate={() => setShouldLoadNeuralInterface(true)} />
      )}

      {!isAdminRoute && shouldLoadNeuralInterface && (
        <Suspense
          fallback={
            <div className="fixed bottom-20 right-4 z-50 h-11 w-11 rounded-full border-2 border-theme-border bg-theme-panel animate-pulse md:bottom-8 md:right-8" />
          }
        >
          <NeuralInterface initialOpen />
        </Suspense>
      )}

      <Suspense fallback={<div className="min-h-screen" />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/work" element={<Work />} />
            <Route path="/work/:slug" element={<ProjectDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/mentorship" element={<Navigate to="/contact" replace />} />
            <Route path="/collaboration" element={<Navigate to="/contact" replace />} />
            <Route path="/contact" element={<Contact />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <AdminGuard>
                  <AdminProjectsList mode="projects" />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/tools"
              element={
                <AdminGuard>
                  <AdminProjectsList mode="tools" />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/projects/new"
              element={
                <AdminGuard>
                  <AdminProjectForm mode="create" />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/projects/:id/edit"
              element={
                <AdminGuard>
                  <AdminProjectForm mode="edit" />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/skills"
              element={
                <AdminGuard>
                  <AdminSkills />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/milestones"
              element={
                <AdminGuard>
                  <AdminMilestones />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/experiments"
              element={
                <AdminGuard>
                  <AdminExperiments />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <AdminGuard>
                  <AdminMessages />
                </AdminGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      {/* Preloader chỉ là overlay, không ẩn nội dung bên dưới */}
      <AnimatePresence>
        {showPreloader && !isAdminRoute && isHomeRoute && (
          <Preloader onComplete={handlePreloaderComplete} />
        )}
      </AnimatePresence>
    </div>
  );
};

function getCurrentSpeedInsightsRoute(): string | null {
  if (typeof window === 'undefined') return null;

  // Preserve a legacy hash path only during the pre-router migration redirect.
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    const hashPath = window.location.hash.slice(1); // '/about', '/work', ...
    return hashPath || '/';
  }

  return window.location.pathname || '/';
}

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <MotionProvider>
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
        </MotionProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
