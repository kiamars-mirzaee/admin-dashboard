import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import {
  diffDaysInclusive,
  formatIsoDate,
  getGregorianMonthDays,
  getGregorianMonthStartWeekday,
  getJalaliMonthDays,
  getJalaliMonthStartWeekday,
  GREGORIAN_MONTHS_EN,
  GREGORIAN_WEEKDAYS_EN,
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

export interface DateRangeValue {
  startDate: string; // ISO YYYY-MM-DD or ''
  endDate: string; // ISO YYYY-MM-DD or ''
}

export type CalendarSystem = 'gregorian' | 'persian';

export interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  calendarSystem?: CalendarSystem;
  onCalendarSystemChange?: (sys: CalendarSystem) => void;
  label?: string;
  referenceToday?: string;
  className?: string;
}

function shiftIsoDays(iso: string, deltaDays: number): string {
  const g = parseIsoDate(iso) ?? { gy: 2026, gm: 11, gd: 22 };
  const dt = new Date(Date.UTC(g.gy, g.gm - 1, g.gd + deltaDays));
  return formatIsoDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function DateRangePicker({
  value,
  onChange,
  calendarSystem: controlledCalendar,
  onCalendarSystemChange,
  label,
  referenceToday = '2026-11-22',
  className = '',
}: DateRangePickerProps) {
  const { t, locale, isRtl } = useI18n();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const [internalCal, setInternalCal] = useState<CalendarSystem>(
    locale === 'fa' ? 'persian' : 'gregorian'
  );
  const calendar = controlledCalendar ?? internalCal;
  const setCalendar = onCalendarSystemChange ?? setInternalCal;

  const anchor = parseIsoDate(value.startDate || referenceToday) ?? {
    gy: 2026,
    gm: 11,
    gd: 22,
  };
  const anchorJ = gregorianToJalali(anchor.gy, anchor.gm, anchor.gd);

  const [open, setOpen] = useState(false);
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  const [viewG, setViewG] = useState({ y: anchor.gy, m: anchor.gm });
  const [viewJ, setViewJ] = useState({ y: anchorJ.jy, m: anchorJ.jm });

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
    if (calendar === 'gregorian') {
      let m = viewG.m + delta;
      let y = viewG.y;
      if (m < 1) {
        m = 12;
        y -= 1;
      } else if (m > 12) {
        m = 1;
        y += 1;
      }
      setViewG({ y, m });
    } else {
      let m = viewJ.m + delta;
      let y = viewJ.y;
      if (m < 1) {
        m = 12;
        y -= 1;
      } else if (m > 12) {
        m = 1;
        y += 1;
      }
      setViewJ({ y, m });
    }
  };

  const handleDaySelect = (iso: string) => {
    if (!value.startDate || (value.startDate && value.endDate)) {
      onChange({ startDate: iso, endDate: '' });
      return;
    }
    if (iso < value.startDate) {
      onChange({ startDate: iso, endDate: value.startDate });
    } else {
      onChange({ startDate: value.startDate, endDate: iso });
    }
    setHoverIso(null);
  };

  const applyPreset = (days: number) => {
    const startDate = shiftIsoDays(referenceToday, -(days - 1));
    onChange({ startDate, endDate: referenceToday });
    const parsed = parseIsoDate(referenceToday)!;
    const j = gregorianToJalali(parsed.gy, parsed.gm, parsed.gd);
    setViewG({ y: parsed.gy, m: parsed.gm });
    setViewJ({ y: j.jy, m: j.jm });
  };

  const daysList = useMemo(() => {
    if (calendar === 'gregorian') {
      const count = getGregorianMonthDays(viewG.y, viewG.m);
      const offset = getGregorianMonthStartWeekday(viewG.y, viewG.m);
      return [
        ...Array.from({ length: offset }, () => null),
        ...Array.from({ length: count }, (_, idx) => {
          const day = idx + 1;
          return {
            label: String(day),
            iso: formatIsoDate(viewG.y, viewG.m, day),
          };
        }),
      ];
    }
    const count = getJalaliMonthDays(viewJ.y, viewJ.m);
    const offset = getJalaliMonthStartWeekday(viewJ.y, viewJ.m);
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: count }, (_, idx) => {
        const day = idx + 1;
        const g = jalaliToGregorian(viewJ.y, viewJ.m, day);
        return {
          label: toPersianDigits(day),
          iso: formatIsoDate(g.gy, g.gm, g.gd),
        };
      }),
    ];
  }, [calendar, viewG.m, viewG.y, viewJ.m, viewJ.y]);

  const effectiveEnd =
    value.endDate ||
    (value.startDate && hoverIso && hoverIso >= value.startDate ? hoverIso : '');

  const dayCount =
    value.startDate && value.endDate
      ? diffDaysInclusive(value.startDate, value.endDate)
      : 0;

  const formatDisplay = (iso: string) => {
    if (!iso) return '—';
    return calendar === 'persian' ? toPersianDigits(isoToJalaliString(iso)) : iso;
  };

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  const headerLabel =
    calendar === 'gregorian'
      ? `${GREGORIAN_MONTHS_EN[viewG.m - 1]} ${viewG.y}`
      : locale === 'fa' || locale === 'ar'
        ? `${JALALI_MONTHS_FA[viewJ.m - 1]} ${toPersianDigits(viewJ.y)}`
        : `${JALALI_MONTHS_EN[viewJ.m - 1]} (${JALALI_MONTHS_FA[viewJ.m - 1]}) ${toPersianDigits(viewJ.y)}`;

  const weekdayLabels =
    calendar === 'gregorian'
      ? GREGORIAN_WEEKDAYS_EN
      : locale === 'fa' || locale === 'ar'
        ? JALALI_WEEKDAYS_FA
        : JALALI_WEEKDAYS_EN;

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
          <CalendarRange className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
          {value.startDate ? (
            <span className="flex items-center gap-2 min-w-0 flex-wrap">
              <span dir="ltr" className="text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                {formatDisplay(value.startDate)} →{' '}
                {value.endDate ? formatDisplay(value.endDate) : '...'}
              </span>
              {dayCount > 0 && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                  ({t('rpDaysCount', { count: dayCount })})
                </span>
              )}
            </span>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {t('rpPlaceholder')}
            </span>
          )}
        </span>

        {(value.startDate || value.endDate) && (
          <span
            role="button"
            tabIndex={0}
            aria-label={t('rpReset')}
            onClick={(e) => {
              e.stopPropagation();
              onChange({ startDate: '', endDate: '' });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onChange({ startDate: '', endDate: '' });
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
          aria-label={label ?? t('rpLabel')}
          className="absolute start-0 z-30 mt-1.5 w-full min-w-[300px] max-w-[360px] p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-3"
        >
          {/* Calendar System Switcher & Quick Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCalendar('gregorian')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  calendar === 'gregorian'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('rpCalendarGregorian')}
              </button>
              <button
                type="button"
                onClick={() => setCalendar('persian')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  calendar === 'persian'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('rpCalendarPersian')}
              </button>
            </div>

            <div className="flex items-center gap-1">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => applyPreset(d)}
                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer tabular-nums"
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>

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
              {headerLabel}
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

          <div
            dir={calendar === 'persian' ? 'rtl' : 'ltr'}
            className="grid grid-cols-7 gap-1 text-center"
            onMouseLeave={() => setHoverIso(null)}
          >
            {weekdayLabels.map((w, idx) => (
              <span
                key={`${w}-${idx}`}
                className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-1"
              >
                {w}
              </span>
            ))}

            {daysList.map((cell, idx) => {
              if (!cell) return <span key={`r-empty-${idx}`} />;
              const { iso, label: dayLabel } = cell;
              const isStart = value.startDate === iso;
              const isEnd = value.endDate === iso;
              const inRange =
                Boolean(value.startDate && effectiveEnd) &&
                iso > value.startDate &&
                iso < effectiveEnd;

              return (
                <button
                  key={iso}
                  type="button"
                  onMouseEnter={() => {
                    if (value.startDate && !value.endDate) setHoverIso(iso);
                  }}
                  onClick={() => handleDaySelect(iso)}
                  className={`h-9 rounded-lg text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                    isStart || isEnd
                      ? 'bg-blue-600 text-white font-semibold'
                      : inRange
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {dayLabel}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {!value.startDate
                ? t('rpSelectStart')
                : !value.endDate
                  ? t('rpSelectEnd')
                  : t('rpDaysCount', { count: dayCount })}
            </span>
            <button
              type="button"
              onClick={() => onChange({ startDate: '', endDate: '' })}
              className="font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              {t('rpReset')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
