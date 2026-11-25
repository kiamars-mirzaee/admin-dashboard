import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import {
  formatDateTimeDisplay,
  formatDateTimeIso,
  parseDateTimeIso,
  to12HourParts,
  to24Hour,
} from '../../utils/dateTime';
import {
  formatIsoDate,
  getGregorianMonthDays,
  getGregorianMonthStartWeekday,
  getJalaliMonthDays,
  getJalaliMonthStartWeekday,
  GREGORIAN_MONTHS_EN,
  GREGORIAN_WEEKDAYS_EN,
  gregorianToJalali,
  JALALI_MONTHS_EN,
  JALALI_MONTHS_FA,
  JALALI_WEEKDAYS_EN,
  JALALI_WEEKDAYS_FA,
  jalaliToGregorian,
  parseIsoDate,
} from '../../utils/jalali';
import { toPersianDigits } from '../../utils/numberFormat';
import { Button } from './Button';

export interface DateTimePickerProps {
  value: string; // 'YYYY-MM-DDTHH:mm' or ''
  onChange: (isoDateTime: string) => void;
  label?: string;
  placeholder?: string;
  minuteStep?: number;
  referenceNow?: string;
  className?: string;
}

const QUICK_TIMES = [
  { hour24: 9, minute: 0, label: '09:00' },
  { hour24: 12, minute: 0, label: '12:00' },
  { hour24: 14, minute: 30, label: '14:30' },
  { hour24: 18, minute: 0, label: '18:00' },
];

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder,
  minuteStep = 5,
  referenceNow = '2026-11-22T14:30',
  className = '',
}: DateTimePickerProps) {
  const { t, locale, isRtl } = useI18n();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const parsedValue = parseDateTimeIso(value);
  const fallbackNow = parseDateTimeIso(referenceNow) ?? {
    date: '2026-11-22',
    hour24: 14,
    minute: 30,
  };
  const active = parsedValue ?? fallbackNow;
  const activeG = parseIsoDate(active.date) ?? { gy: 2026, gm: 11, gd: 22 };
  const activeJ = gregorianToJalali(activeG.gy, activeG.gm, activeG.gd);

  const [open, setOpen] = useState(false);
  const [calendar, setCalendar] = useState<'gregorian' | 'persian'>(
    locale === 'fa' ? 'persian' : 'gregorian'
  );
  const [use24Hour, setUse24Hour] = useState(true);
  const [viewG, setViewG] = useState({ y: activeG.gy, m: activeG.gm });
  const [viewJ, setViewJ] = useState({ y: activeJ.jy, m: activeJ.jm });

  useEffect(() => {
    setCalendar(locale === 'fa' ? 'persian' : 'gregorian');
  }, [locale]);

  useEffect(() => {
    const p = parseDateTimeIso(value);
    if (!p) return;
    const g = parseIsoDate(p.date);
    if (!g) return;
    const j = gregorianToJalali(g.gy, g.gm, g.gd);
    setViewG({ y: g.gy, m: g.gm });
    setViewJ({ y: j.jy, m: j.jm });
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

  const minuteOptions = useMemo(() => {
    const step = Math.max(1, Math.min(30, minuteStep));
    const list: number[] = [];
    for (let m = 0; m < 60; m += step) {
      list.push(m);
    }
    if (!list.includes(active.minute)) {
      list.push(active.minute);
      list.sort((a, b) => a - b);
    }
    return list;
  }, [minuteStep, active.minute]);

  const updateDateTime = (nextDate: string, nextHour24: number, nextMinute: number) => {
    onChange(formatDateTimeIso(nextDate, nextHour24, nextMinute));
  };

  const parts12 = to12HourParts(active.hour24);
  const displayValue = value
    ? formatDateTimeDisplay(value, { use24Hour, calendar })
    : '';

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
          <CalendarClock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
          {displayValue ? (
            <span dir="ltr" className="text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums truncate">
              {displayValue}
            </span>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500 truncate">
              {placeholder ?? t('dtpPlaceholder')}
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
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label ?? t('dtpLabel')}
          className="absolute start-0 z-30 mt-1.5 w-full sm:w-[470px] p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-3"
        >
          {/* Mode switches: Gregorian/Persian & 24h/12h */}
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

            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setUse24Hour(true)}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  use24Hour
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('dtpMode24h')}
              </button>
              <button
                type="button"
                onClick={() => setUse24Hour(false)}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  !use24Hour
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('dtpMode12h')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_0.9fr] gap-3 items-start">
            {/* Calendar Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  aria-label={t('dpPrevMonth')}
                  onClick={() => stepMonth(-1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <PrevIcon className="w-4 h-4" aria-hidden="true" />
                </button>
                <span className="text-xs font-semibold text-slate-900 dark:text-white text-center">
                  {headerLabel}
                </span>
                <button
                  type="button"
                  aria-label={t('dpNextMonth')}
                  onClick={() => stepMonth(1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <NextIcon className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div
                dir={calendar === 'persian' ? 'rtl' : 'ltr'}
                className="grid grid-cols-7 gap-1 text-center"
              >
                {weekdayLabels.map((w, idx) => (
                  <span
                    key={`${w}-${idx}`}
                    className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-0.5"
                  >
                    {w}
                  </span>
                ))}

                {daysList.map((cell, idx) => {
                  if (!cell) return <span key={`dt-empty-${idx}`} />;
                  const selected = parsedValue?.date === cell.iso;
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() =>
                        updateDateTime(cell.iso, active.hour24, active.minute)
                      }
                      className={`h-8 rounded-lg text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                        selected
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cell.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Panel */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span>{t('dtpHour')} / {t('dtpMinute')}</span>
                </span>
                <span dir="ltr" className="font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                  {use24Hour
                    ? `${String(active.hour24).padStart(2, '0')}:${String(active.minute).padStart(2, '0')}`
                    : `${String(parts12.hour12).padStart(2, '0')}:${String(active.minute).padStart(2, '0')} ${parts12.period}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor={`${id}-hour`}
                    className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {t('dtpHour')}
                  </label>
                  <select
                    id={`${id}-hour`}
                    dir="ltr"
                    value={use24Hour ? active.hour24 : parts12.hour12}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const nextHour24 = use24Hour
                        ? val
                        : to24Hour(val, parts12.period);
                      updateDateTime(active.date, nextHour24, active.minute);
                    }}
                    className="min-h-[38px] w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {(use24Hour
                      ? Array.from({ length: 24 }, (_, i) => i)
                      : Array.from({ length: 12 }, (_, i) => i + 1)
                    ).map((h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`${id}-minute`}
                    className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {t('dtpMinute')}
                  </label>
                  <select
                    id={`${id}-minute`}
                    dir="ltr"
                    value={active.minute}
                    onChange={(e) =>
                      updateDateTime(
                        active.date,
                        active.hour24,
                        Number(e.target.value)
                      )
                    }
                    className="min-h-[38px] w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {minuteOptions.map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!use24Hour && (
                <div className="grid grid-cols-2 gap-1.5">
                  {(['AM', 'PM'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        updateDateTime(
                          active.date,
                          to24Hour(parts12.hour12, p),
                          active.minute
                        )
                      }
                      className={`h-8 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        parts12.period === p
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {p === 'AM' ? t('dtpAm') : t('dtpPm')}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-1.5">
                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {t('dtpQuickTimes')}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_TIMES.map((qt) => {
                    const isActive =
                      active.hour24 === qt.hour24 && active.minute === qt.minute;
                    return (
                      <button
                        key={qt.label}
                        type="button"
                        onClick={() =>
                          updateDateTime(active.date, qt.hour24, qt.minute)
                        }
                        className={`h-8 rounded-lg text-xs font-mono tabular-nums border cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {qt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onChange(referenceNow)}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {t('dtpNow')}
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
            <Button size="sm" variant="primary" onClick={() => setOpen(false)}>
              {t('dtpDone')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
