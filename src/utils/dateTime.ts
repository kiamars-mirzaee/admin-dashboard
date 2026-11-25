import { isoToJalaliString, parseIsoDate } from './jalali';
import { toPersianDigits } from './numberFormat';

export interface ParsedDateTime {
  date: string; // YYYY-MM-DD
  hour24: number; // 0..23
  minute: number; // 0..59
}

export function clampHour24(hour: number): number {
  if (!Number.isFinite(hour)) return 0;
  return Math.min(23, Math.max(0, Math.floor(hour)));
}

export function clampMinute(minute: number): number {
  if (!Number.isFinite(minute)) return 0;
  return Math.min(59, Math.max(0, Math.floor(minute)));
}

export function parseDateTimeIso(value: string): ParsedDateTime | null {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const datePart = match[1];
  if (!parseIsoDate(datePart)) return null;
  const hour24 = Number(match[2]);
  const minute = Number(match[3]);
  if (hour24 < 0 || hour24 > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { date: datePart, hour24, minute };
}

export function formatDateTimeIso(
  date: string,
  hour24: number,
  minute: number
): string {
  const h = String(clampHour24(hour24)).padStart(2, '0');
  const m = String(clampMinute(minute)).padStart(2, '0');
  return `${date}T${h}:${m}`;
}

export function to12HourParts(hour24: number): {
  hour12: number;
  period: 'AM' | 'PM';
} {
  const safe = clampHour24(hour24);
  const period: 'AM' | 'PM' = safe >= 12 ? 'PM' : 'AM';
  const mod = safe % 12;
  return {
    hour12: mod === 0 ? 12 : mod,
    period,
  };
}

export function to24Hour(hour12: number, period: 'AM' | 'PM'): number {
  const clamped = Math.min(12, Math.max(1, Math.floor(hour12)));
  if (period === 'AM') {
    return clamped === 12 ? 0 : clamped;
  }
  return clamped === 12 ? 12 : clamped + 12;
}

export function formatDateTimeDisplay(
  value: string,
  options: {
    use24Hour?: boolean;
    calendar?: 'gregorian' | 'persian';
  } = {}
): string {
  const parsed = parseDateTimeIso(value);
  if (!parsed) return '';
  const { use24Hour = true, calendar = 'gregorian' } = options;

  const dateLabel =
    calendar === 'persian'
      ? toPersianDigits(isoToJalaliString(parsed.date))
      : parsed.date;

  const minStr = String(parsed.minute).padStart(2, '0');
  let timeLabel = '';
  if (use24Hour) {
    const hrStr = String(parsed.hour24).padStart(2, '0');
    timeLabel = `${hrStr}:${minStr}`;
  } else {
    const { hour12, period } = to12HourParts(parsed.hour24);
    timeLabel = `${String(hour12).padStart(2, '0')}:${minStr} ${period}`;
  }

  return calendar === 'persian'
    ? `${dateLabel} · ${toPersianDigits(timeLabel)}`
    : `${dateLabel} · ${timeLabel}`;
}
