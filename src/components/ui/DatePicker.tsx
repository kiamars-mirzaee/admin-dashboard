import { useEffect, useId, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import {
  formatIsoDate,
  getGregorianMonthDays,
  getGregorianMonthStartWeekday,
  GREGORIAN_MONTHS_EN,
  GREGORIAN_WEEKDAYS_EN,
  parseIsoDate,
} from '../../utils/jalali';

export interface DatePickerProps {
  value: string; // ISO YYYY-MM-DD or ''
  onChange: (iso: string) => void;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  referenceToday?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder,
  min,
  max,
  referenceToday = '2026-11-22',
  className = '',
}: DatePickerProps) {
  const { t, isRtl } = useI18n();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const initialDate = parseIsoDate(value) ?? parseIsoDate(referenceToday) ?? { gy: 2026, gm: 11, gd: 22 };
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initialDate.gy);
  const [viewMonth, setViewMonth] = useState(initialDate.gm);

  useEffect(() => {
    const parsed = parseIsoDate(value);
    if (parsed) {
      setViewYear(parsed.gy);
      setViewMonth(parsed.gm);
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const stepMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  };

  const daysInMonth = getGregorianMonthDays(viewYear, viewMonth);
  const startOffset = getGregorianMonthStartWeekday(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isDisabled = (iso: string) => {
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  };

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <button
          id={id}
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((o) => !o)}
          className="min-h-[44px] w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 flex items-center justify-between gap-2 text-start cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            {value ? (
              <span dir="ltr" className="text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                {value}
              </span>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500">
                {placeholder ?? t('dpPlaceholder')}
              </span>
            )}
          </span>
          {value && (
            <span
              role="button"
              tabIndex={0}
              aria-label={t('dpClear')}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onChange('');
                }
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          )}
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label={label ?? t('dpLabel')}
          className="absolute start-0 z-30 mt-1.5 w-full min-w-[280px] max-w-[320px] p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label={t('dpPrevMonth')}
              onClick={() => stepMonth(-1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <PrevIcon className="w-4 h-4" aria-hidden="true" />
            </button>
            <span dir="ltr" className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
              {GREGORIAN_MONTHS_EN[viewMonth - 1]} {viewYear}
            </span>
            <button
              type="button"
              aria-label={t('dpNextMonth')}
              onClick={() => stepMonth(1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <NextIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div dir="ltr" className="grid grid-cols-7 gap-1 text-center">
            {GREGORIAN_WEEKDAYS_EN.map((day) => (
              <span
                key={day}
                className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-1"
              >
                {day}
              </span>
            ))}

            {cells.map((day, idx) => {
              if (!day) {
                return <span key={`empty-${idx}`} />;
              }
              const iso = formatIsoDate(viewYear, viewMonth, day);
              const selected = value === iso;
              const isToday = referenceToday === iso;
              const disabled = isDisabled(iso);
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`h-9 rounded-lg text-xs font-medium tabular-nums transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
                    selected
                      ? 'bg-blue-600 text-white font-semibold'
                      : isToday
                        ? 'border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onChange(referenceToday);
                setOpen(false);
              }}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {t('dpToday')} ({referenceToday})
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              {t('dpClear')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
