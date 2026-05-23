import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  hasAdminToken,
  verifyAdminToken,
} from '../../services/portfolioService';

/**
 * Wraps an admin page. On mount we verify the stored bearer token against
 * the server. Until verification completes we render a lightweight
 * splash so we never flash protected content for an unauthenticated user.
 */
export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<'pending' | 'ok' | 'denied'>(
    hasAdminToken() ? 'pending' : 'denied',
  );

  useEffect(() => {
    let active = true;
    if (!hasAdminToken()) {
      setState('denied');
      return;
    }
    verifyAdminToken().then((ok) => {
      if (!active) return;
      setState(ok ? 'ok' : 'denied');
    });
    return () => {
      active = false;
    };
  }, []);

  if (state === 'denied') {
    return <Navigate to="/admin/login" replace />;
  }

  if (state === 'pending') {
    return (
      <div className="min-h-screen bg-theme-bg text-theme-text flex items-center justify-center">
        <div className="font-mono text-xs uppercase tracking-[0.4em] text-theme-text/60 animate-pulse">
          verifying credentials…
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
