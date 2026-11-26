import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  X,
} from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<
  AlertVariant,
  { container: string; iconWrap: string; title: string; desc: string }
> = {
  info: {
    container:
      'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/70',
    iconWrap: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-950 dark:text-blue-100',
    desc: 'text-blue-800/90 dark:text-blue-200/80',
  },
  success: {
    container:
      'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/70',
    iconWrap: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-950 dark:text-emerald-100',
    desc: 'text-emerald-800/90 dark:text-emerald-200/80',
  },
  warning: {
    container:
      'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/70',
    iconWrap: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-950 dark:text-amber-100',
    desc: 'text-amber-800/90 dark:text-amber-200/80',
  },
  error: {
    container:
      'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/70',
    iconWrap: 'text-red-600 dark:text-red-400',
    title: 'text-red-950 dark:text-red-100',
    desc: 'text-red-800/90 dark:text-red-200/80',
  },
};

function variantIcon(variant: AlertVariant): React.ReactNode {
  switch (variant) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4" aria-hidden="true" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4" aria-hidden="true" />;
    case 'error':
      return <ShieldAlert className="w-4 h-4" aria-hidden="true" />;
    case 'info':
    default:
      return <Info className="w-4 h-4" aria-hidden="true" />;
  }
}

export function Alert({
  variant = 'info',
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  className = '',
}: AlertProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-2xl border p-3.5 sm:p-4 flex items-start gap-3 ${styles.container} ${className}`}
    >
      <div className={`pt-0.5 shrink-0 ${styles.iconWrap}`}>
        {variantIcon(variant)}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
        {description && (
          <p className={`text-xs mt-0.5 leading-relaxed ${styles.desc}`}>
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className={`mt-2 inline-flex items-center text-xs font-semibold underline underline-offset-2 cursor-pointer ${styles.title}`}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss ${title}`}
          className={`min-h-[32px] min-w-[32px] -mt-1 -me-1 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer shrink-0 ${styles.iconWrap}`}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
