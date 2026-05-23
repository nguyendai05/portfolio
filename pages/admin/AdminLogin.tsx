import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, LogIn, ShieldCheck } from 'lucide-react';
import {
  adminLogin,
  hasAdminToken,
} from '../../services/portfolioService';
import { Button, Field, Input, StatusBanner } from '../../components/admin/AdminUi';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (hasAdminToken()) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password.trim()) {
      setError('Enter your admin password to continue.');
      return;
    }
    setSubmitting(true);
    try {
      await adminLogin(password);
      navigate('/admin', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-theme-border/40 rounded-full text-[10px] font-mono uppercase tracking-[0.35em] text-theme-text/60">
            <ShieldCheck size={12} />
            secure access
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">
            Xuni-Dizan Admin
          </h1>
          <p className="mt-2 text-sm text-theme-text/60">
            Sign in to manage projects, tools, skills, milestones, experiments,
            and incoming messages.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-theme-panel/40 border border-theme-border/30 rounded-lg p-6 space-y-5"
        >
          {error ? (
            <StatusBanner tone="error" message={error} onClose={() => setError(null)} />
          ) : null}

          <Field label="Admin password" required>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            className="w-full"
          >
            <LogIn size={14} />
            <span>Enter Content System</span>
          </Button>

          <div className="text-[11px] font-mono text-theme-text/45 leading-relaxed border-t border-theme-border/20 pt-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Lock size={12} />
              <span className="uppercase tracking-[0.3em]">how this works</span>
            </div>
            <p>
              Configure <code className="text-theme-accent">ADMIN_PASSWORD</code>{' '}
              and <code className="text-theme-accent">ADMIN_TOKEN</code> on the
              server (Vercel → Environment Variables, or your local{' '}
              <code>.env.local</code>). The password unlocks the token, which is
              stored in your browser and attached as a Bearer header to every
              admin API call.
            </p>
          </div>
        </form>

        <div className="mt-6 text-center text-[11px] font-mono uppercase tracking-[0.3em] text-theme-text/40">
          <a href="#/" className="hover:text-theme-text transition-colors">
            ← back to portfolio
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
