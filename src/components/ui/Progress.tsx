import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label, className = '' }: SpinnerProps) {
  const sizeClass =
    size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  return (
    <span
      role="status"
      aria-label={label ?? 'Loading'}
      className={`inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 ${className}`}
    >
      <Loader2 className={`${sizeClass} animate-spin text-blue-600 dark:text-blue-400`} aria-hidden="true" />
      {label && <span className="text-xs font-medium">{label}</span>}
    </span>
  );
}

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  className?: string;
}

const TONE_FILL: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  default: 'bg-blue-600 dark:bg-blue-500',
  success: 'bg-emerald-600 dark:bg-emerald-500',
  warning: 'bg-amber-500 dark:bg-amber-400',
  error: 'bg-red-600 dark:bg-red-500',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  tone = 'default',
  showValue = true,
  className = '',
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label && (
            <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
              {label}
            </span>
          )}
          {showValue && (
            <span dir="ltr" className="font-mono font-semibold tabular-nums text-slate-600 dark:text-slate-300">
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${TONE_FILL[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
}

const CIRCULAR_STROKE: Record<NonNullable<CircularProgressProps['tone']>, string> = {
  default: 'stroke-blue-600 dark:stroke-blue-400',
  success: 'stroke-emerald-600 dark:stroke-emerald-400',
  warning: 'stroke-amber-500 dark:stroke-amber-400',
  error: 'stroke-red-600 dark:stroke-red-400',
};

export function CircularProgress({
  value,
  size = 56,
  strokeWidth = 5,
  label,
  tone = 'default',
}: CircularProgressProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Circular progress'}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-slate-200 dark:stroke-slate-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-300 ${CIRCULAR_STROKE[tone]}`}
          />
        </svg>
        <span
          dir="ltr"
          className="absolute font-mono text-[11px] font-bold tabular-nums text-slate-800 dark:text-slate-100"
        >
          {pct}%
        </span>
      </div>
      {label && (
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
      )}
    </div>
  );
}

