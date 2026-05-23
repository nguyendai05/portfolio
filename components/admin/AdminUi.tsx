import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Shared form primitives + status helpers used across the admin pages.
// Keeping them in one file avoids a maze of micro-components while still
// matching the rest of the brutalist / cyber identity.
// ---------------------------------------------------------------------------

export const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, error, children }) => (
  <label className="block">
    <span className="block text-[11px] font-mono uppercase tracking-[0.25em] text-theme-text/60 mb-1.5">
      {label}
      {required ? <span className="text-theme-accent ml-1">*</span> : null}
    </span>
    {children}
    {hint && !error ? (
      <span className="block mt-1.5 text-[11px] text-theme-text/50">{hint}</span>
    ) : null}
    {error ? (
      <span className="block mt-1.5 text-[11px] text-red-400">{error}</span>
    ) : null}
  </label>
);

const baseControl =
  'w-full bg-theme-bg/40 border border-theme-border/40 px-3 py-2.5 text-sm text-theme-text rounded-md font-mono placeholder:text-theme-text/40 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props,
) => (
  <input
    {...props}
    className={[baseControl, props.className || ''].join(' ')}
  />
);

export const Textarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = (props) => (
  <textarea
    {...props}
    className={[baseControl, 'min-h-[120px] resize-y leading-relaxed', props.className || ''].join(
      ' ',
    )}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (
  props,
) => (
  <select
    {...props}
    className={[baseControl, 'pr-8 appearance-none', props.className || ''].join(' ')}
  />
);

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-theme-accent text-theme-bg hover:bg-theme-accent/90 border-theme-accent',
  secondary:
    'bg-transparent text-theme-text hover:bg-theme-panel border-theme-border/50 hover:border-theme-accent',
  danger:
    'bg-transparent text-red-300 hover:bg-red-500/10 border-red-500/40 hover:border-red-500',
  ghost:
    'bg-transparent text-theme-text/70 hover:text-theme-text border-transparent hover:bg-theme-panel/50',
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    loading?: boolean;
  }
> = ({ variant = 'primary', loading, className, children, disabled, ...rest }) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={[
      'inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
      buttonStyles[variant],
      className || '',
    ].join(' ')}
  >
    {loading ? <Loader2 size={14} className="animate-spin" /> : null}
    {children}
  </button>
);

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <div
    className={[
      'bg-theme-panel/40 border border-theme-border/30 rounded-md p-5',
      className || '',
    ].join(' ')}
  >
    {children}
  </div>
);

type ToneStatus = 'success' | 'error' | 'info';
const statusTone: Record<ToneStatus, { bg: string; text: string; Icon: typeof Info }> = {
  success: {
    bg: 'bg-emerald-500/10 border-emerald-500/40',
    text: 'text-emerald-300',
    Icon: CheckCircle2,
  },
  error: {
    bg: 'bg-red-500/10 border-red-500/40',
    text: 'text-red-300',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-sky-500/10 border-sky-500/40',
    text: 'text-sky-300',
    Icon: Info,
  },
};

export const StatusBanner: React.FC<{
  tone: ToneStatus;
  message: string;
  onClose?: () => void;
}> = ({ tone, message, onClose }) => {
  const { bg, text, Icon } = statusTone[tone];
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border rounded-md text-sm ${bg} ${text}`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1">{message}</div>
      {onClose ? (
        <button
          aria-label="Dismiss"
          onClick={onClose}
          className="opacity-60 hover:opacity-100"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => (
  <div className="border border-dashed border-theme-border/30 rounded-md p-10 text-center bg-theme-panel/20">
    {icon ? (
      <div className="mx-auto mb-3 w-10 h-10 flex items-center justify-center text-theme-text/40">
        {icon}
      </div>
    ) : null}
    <div className="text-base font-semibold text-theme-text">{title}</div>
    {description ? (
      <div className="mt-1 text-sm text-theme-text/60 max-w-md mx-auto">
        {description}
      </div>
    ) : null}
    {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
  </div>
);

export const TagChip: React.FC<{
  label: string;
  onRemove?: () => void;
  tone?: 'default' | 'accent';
}> = ({ label, onRemove, tone = 'default' }) => {
  const styles =
    tone === 'accent'
      ? 'bg-theme-accent/15 border-theme-accent/40 text-theme-text'
      : 'bg-theme-panel/60 border-theme-border/40 text-theme-text/80';
  return (
    <span
      className={`inline-flex items-center gap-1.5 border ${styles} px-2 py-1 rounded-md text-[11px] font-mono`}
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          className="opacity-60 hover:opacity-100"
        >
          <X size={11} />
        </button>
      ) : null}
    </span>
  );
};

export const ConfirmModal: React.FC<{
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}> = ({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-theme-bg border border-theme-border/40 rounded-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-3 text-red-400">
          <AlertTriangle size={18} />
          <span className="text-[11px] font-mono uppercase tracking-[0.3em]">
            confirm action
          </span>
        </div>
        <h3 className="text-lg font-bold text-theme-text">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm text-theme-text/70">{description}</p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const PageLoader: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center gap-3 text-sm text-theme-text/60 font-mono">
    <Loader2 size={14} className="animate-spin" />
    <span>{label || 'Loading…'}</span>
  </div>
);
