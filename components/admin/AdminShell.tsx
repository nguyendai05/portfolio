import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Wrench,
  Sparkles,
  Trophy,
  FlaskConical,
  Mail,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import { setAdminToken } from '../../services/portfolioService';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/tools', label: 'Tools', icon: Wrench },
  { to: '/admin/skills', label: 'Skills', icon: Sparkles },
  { to: '/admin/milestones', label: 'Milestones', icon: Trophy },
  { to: '/admin/experiments', label: 'Experiments', icon: FlaskConical },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
];

interface AdminShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  title,
  description,
  actions,
  children,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Auto-close mobile drawer when route changes
  useEffect(() => setOpen(false), [title]);

  const handleLogout = () => {
    setAdminToken(null);
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-theme-border/30 bg-theme-bg/95 backdrop-blur">
        <button
          aria-label="Open admin menu"
          onClick={() => setOpen(true)}
          className="p-2 border border-theme-border/40 rounded-md hover:border-theme-accent"
        >
          <Menu size={18} />
        </button>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-theme-text/70">
          xuni / admin
        </div>
        <button
          aria-label="Open public site"
          onClick={() => navigate('/')}
          className="p-2 border border-theme-border/40 rounded-md hover:border-theme-accent"
        >
          <Globe size={16} />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 min-h-screen border-r border-theme-border/30 bg-theme-panel/40 backdrop-blur sticky top-0 self-start max-h-screen">
          <SidebarBody onLogout={handleLogout} onCloseMobile={() => setOpen(false)} />
        </aside>

        {/* Sidebar (mobile drawer) */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setOpen(false)}
            />
            <aside className="relative w-72 bg-theme-bg border-r border-theme-border/40 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border/30">
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-theme-text/70">
                  navigate
                </span>
                <button
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="p-1.5 border border-theme-border/40 rounded-md"
                >
                  <X size={16} />
                </button>
              </div>
              <SidebarBody onLogout={handleLogout} onCloseMobile={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 px-4 lg:px-10 py-8 lg:py-12">
          {/* Header */}
          <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-theme-border/20 pb-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-theme-accent mb-2">
                Xuni / Content System
              </div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                {title}
              </h1>
              {description ? (
                <p className="mt-2 text-sm text-theme-text/70 max-w-2xl">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </header>

          {children}
        </main>
      </div>
    </div>
  );
};

const SidebarBody: React.FC<{
  onLogout: () => void;
  onCloseMobile: () => void;
}> = ({ onLogout, onCloseMobile }) => {
  return (
    <>
      <div className="px-5 py-6 border-b border-theme-border/20 hidden lg:block">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-theme-text/50">
          xuni-dizan
        </div>
        <div className="mt-1 text-lg font-black tracking-tight">CONTENT_OS</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-mono uppercase tracking-wider transition-colors border',
                  isActive
                    ? 'bg-theme-accent/15 text-theme-text border-theme-accent/40'
                    : 'border-transparent text-theme-text/60 hover:text-theme-text hover:bg-theme-panel/60',
                ].join(' ')
              }
            >
              <Icon size={16} />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight
                size={14}
                className="opacity-0 group-hover:opacity-60 transition-opacity"
              />
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-theme-border/20 space-y-2">
        <NavLink
          to="/"
          onClick={onCloseMobile}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-mono uppercase tracking-wider text-theme-text/60 hover:text-theme-text border border-theme-border/30 hover:border-theme-accent/40 transition"
        >
          <Globe size={16} />
          <span>View site</span>
        </NavLink>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-mono uppercase tracking-wider text-theme-text/60 hover:text-theme-text border border-theme-border/30 hover:border-red-500/60 transition"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );
};
