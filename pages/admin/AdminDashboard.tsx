import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FlaskConical,
  FolderKanban,
  Mail,
  Sparkles,
  Trophy,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { AdminShell } from '../../components/admin/AdminShell';
import {
  AdminStats,
  fetchAdminStats,
} from '../../services/portfolioService';
import {
  Button,
  Card,
  StatusBanner,
} from '../../components/admin/AdminUi';

const STAT_CARDS: Array<{
  key: keyof AdminStats;
  label: string;
  icon: LucideIcon;
  link: string;
  hint?: (s: AdminStats) => string | undefined;
}> = [
  { key: 'projects', label: 'Projects', icon: FolderKanban, link: '/admin/projects' },
  { key: 'tools', label: 'Tools', icon: Wrench, link: '/admin/tools' },
  { key: 'skills', label: 'Skills', icon: Sparkles, link: '/admin/skills' },
  { key: 'milestones', label: 'Milestones', icon: Trophy, link: '/admin/milestones' },
  { key: 'experiments', label: 'Experiments', icon: FlaskConical, link: '/admin/experiments' },
  {
    key: 'messages',
    label: 'Messages',
    icon: Mail,
    link: '/admin/messages',
    hint: (s) => (s.newMessages > 0 ? `${s.newMessages} new` : undefined),
  },
];

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAdminStats()
      .then((data) => {
        if (!active) return;
        setStats(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminShell
      title="Control Center"
      description="A real-time snapshot of everything in your portfolio backend. Pick a section below to start editing."
      actions={
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      }
    >
      {error ? (
        <div className="mb-6">
          <StatusBanner tone="error" message={error} />
        </div>
      ) : null}

      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = stats ? stats[card.key] : null;
          const hint = stats && card.hint ? card.hint(stats) : undefined;
          return (
            <Link
              key={card.key}
              to={card.link}
              className="group"
            >
              <Card className="h-full transition-colors hover:border-theme-accent/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-theme-text/50">
                      {card.label}
                    </div>
                    <div className="mt-3 text-4xl font-black tracking-tight tabular-nums">
                      {loading || value === null ? '—' : value}
                    </div>
                    {hint ? (
                      <div className="mt-1 text-[11px] font-mono text-theme-accent uppercase tracking-[0.2em]">
                        {hint}
                      </div>
                    ) : null}
                  </div>
                  <div className="p-2 border border-theme-border/40 rounded-md text-theme-text/70 group-hover:text-theme-accent group-hover:border-theme-accent transition-colors">
                    <Icon size={16} />
                  </div>
                </div>
                <div className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.25em] text-theme-text/50 group-hover:text-theme-accent">
                  Manage
                  <ArrowRight
                    size={12}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-mono uppercase tracking-[0.3em] text-theme-text/60">
            Quick actions
          </h2>
          <div className="mt-4 space-y-2">
            <Link
              to="/admin/projects/new"
              className="flex items-center justify-between gap-3 px-4 py-3 border border-theme-border/30 rounded-md hover:border-theme-accent transition-colors"
            >
              <span className="text-sm font-semibold">
                + Add a new project
              </span>
              <ArrowRight size={14} className="text-theme-accent" />
            </Link>
            <Link
              to="/admin/projects/new?type=tool"
              className="flex items-center justify-between gap-3 px-4 py-3 border border-theme-border/30 rounded-md hover:border-theme-accent transition-colors"
            >
              <span className="text-sm font-semibold">+ Add a new tool</span>
              <ArrowRight size={14} className="text-theme-accent" />
            </Link>
            <Link
              to="/admin/skills"
              className="flex items-center justify-between gap-3 px-4 py-3 border border-theme-border/30 rounded-md hover:border-theme-accent transition-colors"
            >
              <span className="text-sm font-semibold">Manage skills marquee</span>
              <ArrowRight size={14} className="text-theme-accent" />
            </Link>
            <Link
              to="/admin/messages"
              className="flex items-center justify-between gap-3 px-4 py-3 border border-theme-border/30 rounded-md hover:border-theme-accent transition-colors"
            >
              <span className="text-sm font-semibold">
                Review contact messages
              </span>
              <ArrowRight size={14} className="text-theme-accent" />
            </Link>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-mono uppercase tracking-[0.3em] text-theme-text/60">
            How content flows
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-theme-text/80 leading-relaxed">
            <li>
              <span className="font-mono text-theme-accent mr-2">01.</span>
              Add/edit items here. Everything is persisted in the MySQL
              database used by Vercel API routes.
            </li>
            <li>
              <span className="font-mono text-theme-accent mr-2">02.</span>
              Public pages (Home, Work, About) fetch directly from the API and
              update instantly after you save.
            </li>
            <li>
              <span className="font-mono text-theme-accent mr-2">03.</span>
              The MySQL database is the only source of truth. Seed initial
              content with{' '}
              <code className="text-theme-accent">db/schema.sql</code> or add
              entries directly from this admin panel.
            </li>
          </ol>
        </Card>
      </section>
    </AdminShell>
  );
};

export default AdminDashboard;
