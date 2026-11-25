import { useEffect, useId, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import {
  formatIsoDate,
  getJalaliMonthDays,
  getJalaliMonthStartWeekday,
  gregorianToJalali,
  isoToJalaliString,
  JALALI_MONTHS_EN,
  JALALI_MONTHS_FA,
  JALALI_WEEKDAYS_EN,
  JALALI_WEEKDAYS_FA,
  jalaliToGregorian,
  parseIsoDate,
} from '../../utils/jalali';
import { toPersianDigits } from '../../utils/numberFormat';

export interface PersianDatePickerProps {
  value: string; // Synced Gregorian ISO YYYY-MM-DD or ''
  onChange: (iso: string) => void;
  label?: string;
  placeholder?: string;
  referenceToday?: string;
  className?: string;
}

export function PersianDatePicker({
  value,
  onChange,
  label,
  placeholder,
  referenceToday = '2026-11-22',
  className = '',
}: PersianDatePickerProps) {
  const { t, locale, isRtl } = useI18n();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const fallbackGregorian = parseIsoDate(referenceToday) ?? { gy: 2026, gm: 11, gd: 22 };
  const activeGregorian = parseIsoDate(value) ?? fallbackGregorian;
  const activeJalali = gregorianToJalali(
    activeGregorian.gy,
    activeGregorian.gm,
    activeGregorian.gd
  );
  const todayJalali = gregorianToJalali(
    fallbackGregorian.gy,
    fallbackGregorian.gm,
    fallbackGregorian.gd
  );

  const [open, setOpen] = useState(false);
  const [viewJy, setViewJy] = useState(activeJalali.jy);
  const [viewJm, setViewJm] = useState(activeJalali.jm);

  useEffect(() => {
    const parsed = parseIsoDate(value);
    if (parsed) {
      const j = gregorianToJalali(parsed.gy, parsed.gm, parsed.gd);
      setViewJy(j.jy);
      setViewJm(j.jm);
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
    let m = viewJm + delta;
    let y = viewJy;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setViewJy(y);
    setViewJm(m);
  };

  const daysInMonth = getJalaliMonthDays(viewJy, viewJm);
  const startOffset = getJalaliMonthStartWeekday(viewJy, viewJm);
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedJalaliDisplay = value ? toPersianDigits(isoToJalaliString(value)) : '';
  const selectedMonthLabel =
    locale === 'fa' || locale === 'ar'
      ? `${JALALI_MONTHS_FA[viewJm - 1]} ${toPersianDigits(viewJy)}`
      : `${JALALI_MONTHS_EN[viewJm - 1]} (${JALALI_MONTHS_FA[viewJm - 1]}) ${toPersianDigits(viewJy)}`;

  const weekdayHeaders =
    locale === 'fa' || locale === 'ar' ? JALALI_WEEKDAYS_FA : JALALI_WEEKDAYS_EN;

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

      <button
        id={id}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className="min-h-[44px] w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 flex items-center justify-between gap-2 text-start cursor-pointer transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          {value ? (
            <span className="flex items-center gap-2 min-w-0">
              <span dir="ltr" className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {selectedJalaliDisplay}
              </span>
              <span dir="ltr" className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums truncate">
                ({value})
              </span>
            </span>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {placeholder ?? t('pdpPlaceholder')}
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

      {open && (
        <div
          role="dialog"
          aria-label={label ?? t('pdpLabel')}
          className="absolute start-0 z-30 mt-1.5 w-full min-w-[290px] max-w-[330px] p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-2.5"
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
            <span className="text-sm font-semibold text-slate-900 dark:text-white text-center">
              {selectedMonthLabel}
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

          <div dir="rtl" className="grid grid-cols-7 gap-1 text-center">
            {weekdayHeaders.map((day, idx) => (
              <span
                key={`${day}-${idx}`}
                className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-1"
              >
                {day}
              </span>
            ))}

            {cells.map((day, idx) => {
              if (!day) {
                return <span key={`j-empty-${idx}`} />;
              }
              const greg = jalaliToGregorian(viewJy, viewJm, day);
              const iso = formatIsoDate(greg.gy, greg.gm, greg.gd);
              const selected = value === iso;
              const isToday =
                todayJalali.jy === viewJy &&
                todayJalali.jm === viewJm &&
                todayJalali.jd === day;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`h-9 rounded-lg text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                    selected
                      ? 'bg-emerald-600 text-white font-semibold'
                      : isToday
                        ? 'border border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
            <button
              type="button"
              onClick={() => {
                onChange(referenceToday);
                setOpen(false);
              }}
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {t('pdpToday')} ({toPersianDigits(isoToJalaliString(referenceToday))})
            </button>
            {value && (
              <span dir="ltr" className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                {t('pdpGregorianSync')}: {value}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
