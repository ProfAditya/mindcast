'use client';
import React, { forwardRef, useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import { AlertTriangle, Inbox, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { errorMessage } from '@/lib/api/client';

// ─── Button ──────────────────────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-gold text-obsidian hover:bg-gold-pale font-semibold',
  secondary:
    'bg-graphite border border-gold-line text-ivory hover:border-gold/70 hover:bg-graphite-raised',
  ghost: 'text-stone hover:text-ivory hover:bg-white/5',
  danger: 'bg-graphite border border-rose/50 text-rose hover:bg-rose/10',
};
const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-[15px]' };

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: keyof typeof sizes;
  loading?: boolean;
  icon?: React.ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  icon,
}: {
  href: string;
  variant?: Variant;
  size?: keyof typeof sizes;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

// ─── Surfaces ────────────────────────────────────────────────────────────────
export function Card({
  className,
  children,
  as: As = 'section',
  ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'article' }) {
  return (
    <As className={cn('surface p-5 sm:p-6', className)} {...rest}>
      {children}
    </As>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-bronze bg-graphite-deep text-gold">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-[15px] font-semibold text-ivory">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-stone">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="label-eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold text-ivory sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-stone">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: 'neutral' | 'gold' | 'sage' | 'blue' | 'rose';
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: 'border-divider text-stone',
    gold: 'border-gold/40 text-gold-pale bg-gold/10',
    sage: 'border-sage/40 text-sage bg-sage/10',
    blue: 'border-softblue/40 text-softblue bg-softblue/10',
    rose: 'border-rose/40 text-rose bg-rose/10',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'gold' | 'sage' | 'blue' | 'rose';
}) {
  const color = { gold: 'text-gold', sage: 'text-sage', blue: 'text-softblue', rose: 'text-rose' }[
    tone ?? 'gold'
  ];
  return (
    <div className="rounded-xl border border-bronze bg-graphite-deep p-4">
      <p className="label-eyebrow">{label}</p>
      <p className={cn('mt-2 text-2xl font-semibold', tone ? color : 'text-ivory')}>{value}</p>
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </div>
  );
}

// ─── States ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-white/5', className)} aria-hidden />;
}
export function LoadingBlock({ rows = 3, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-divider px-6 py-10 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-bronze bg-graphite-deep text-gold">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className="font-medium text-ivory">{title}</p>
      {body && <p className="mt-1 max-w-md text-sm text-stone">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = 'Could not load this',
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-rose/30 bg-rose/5 p-5 sm:flex-row sm:items-center"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-rose" aria-hidden />
      <div className="flex-1">
        <p className="font-medium text-ivory">{title}</p>
        <p className="text-sm text-stone">{errorMessage(error)}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Notice({
  tone = 'gold',
  title,
  children,
  icon,
}: {
  tone?: 'gold' | 'blue' | 'rose' | 'sage';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const t = {
    gold: 'border-gold/30 bg-gold/5',
    blue: 'border-softblue/30 bg-softblue/5',
    rose: 'border-rose/30 bg-rose/5',
    sage: 'border-sage/30 bg-sage/5',
  }[tone];
  return (
    <div className={cn('flex gap-3 rounded-xl border p-4 text-sm', t)}>
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="text-stone">
        {title && <p className="mb-0.5 font-medium text-ivory">{title}</p>}
        {children}
      </div>
    </div>
  );
}

/** Generic wrapper for react-query results. */
export function Query<T>({
  q,
  children,
  empty,
  loading,
}: {
  q: { isLoading: boolean; error: unknown; data: T | undefined; refetch: () => unknown };
  children: (data: T) => React.ReactNode;
  empty?: (data: T) => React.ReactNode | null;
  loading?: React.ReactNode;
}) {
  if (q.isLoading) return <>{loading ?? <LoadingBlock />}</>;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (q.data === undefined) return null;
  const e = empty?.(q.data);
  return <>{e ?? children(q.data)}</>;
}

// ─── Form fields ─────────────────────────────────────────────────────────────
export function Field({
  label,
  hint,
  error,
  children,
  required,
  id,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string) => React.ReactNode;
  required?: boolean;
  id?: string;
}) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div>
      <label htmlFor={fid} className="mb-1.5 block text-sm font-medium text-ivory">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      {children(fid)}
      {hint && !error && <p className="mt-1 text-xs text-stone">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-rose" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...p }, ref) {
    return <input ref={ref} className={cn('input-base', className)} {...p} />;
  }
);
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...p }, ref) {
  return (
    <textarea ref={ref} className={cn('input-base min-h-[96px] resize-y', className)} {...p} />
  );
});
export function Select({
  options,
  className,
  placeholder,
  ...p
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select className={cn('input-base appearance-none pr-8', className)} {...p}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SegmentedScale({
  value,
  onChange,
  min = 0,
  max = 10,
  label,
  lowLabel,
  highLabel,
}: {
  value: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  lowLabel?: string;
  highLabel?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ivory">{label}</legend>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {Array.from({ length: max - min + 1 }).map((_, i) => {
          const v = min + i;
          const on = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(v)}
              className={cn(
                'h-9 w-9 rounded-lg border text-sm transition-colors',
                on
                  ? 'border-gold bg-gold text-obsidian font-semibold'
                  : 'border-divider bg-graphite-deep text-stone hover:border-gold-line hover:text-ivory'
              )}
            >
              {v}
            </button>
          );
        })}
      </div>
      {(lowLabel || highLabel) && (
        <div className="mt-1 flex justify-between text-[11px] text-stone">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </fieldset>
  );
}

// ─── Dialogs ─────────────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'surface max-h-[92vh] w-full overflow-y-auto rounded-b-none p-6 animate-fade-up sm:rounded-2xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone hover:bg-white/5 hover:text-ivory"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        {footer && (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Delete',
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-stone">{body}</p>
    </Modal>
  );
}

export function Tabs<K extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-bronze bg-graphite-deep p-1"
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'whitespace-nowrap rounded-lg px-3.5 py-2 text-sm transition-colors',
            value === t.key
              ? 'bg-graphite text-gold-pale shadow-card'
              : 'text-stone hover:text-ivory'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function DemoTag() {
  return <Badge tone="blue">Fictional demo data</Badge>;
}
