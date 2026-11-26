import type { Locale } from '../i18n/translations';
import { toArabicDigits, toPersianDigits } from './numberFormat';

function toLocalizedDigits(value: string, script: 'persian' | 'arabic'): string {
  return script === 'persian' ? toPersianDigits(value, true) : toArabicDigits(value, true);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exp = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / Math.pow(1024, exp);
  const rounded = exp === 0 ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, '');
  return `${rounded} ${units[exp]}`;
}

export function formatCurrencyValue(
  amount: number,
  currency: 'USD' | 'EUR' | 'IRR' = 'USD',
  locale: Locale = 'en'
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (currency === 'IRR') {
    const formatted = Math.round(safe).toLocaleString('en-US');
    return locale === 'fa'
      ? `${toLocalizedDigits(formatted, 'persian')} ریال`
      : `${formatted} IRR`;
  }
  const symbol = currency === 'EUR' ? '€' : '$';
  const formatted = Math.round(safe).toLocaleString('en-US');
  const display =
    locale === 'fa'
      ? toLocalizedDigits(formatted, 'persian')
      : locale === 'ar'
        ? toLocalizedDigits(formatted, 'arabic')
        : formatted;
  return `${symbol}${display}`;
}

export function formatRelativeTime(
  dateInput: Date | string | number,
  nowInput: Date | number = Date.now(),
  locale: Locale = 'en'
): string {
  const ts = dateInput instanceof Date ? dateInput.getTime() : new Date(dateInput).getTime();
  const nowTs = nowInput instanceof Date ? nowInput.getTime() : nowInput;
  if (!Number.isFinite(ts) || !Number.isFinite(nowTs)) return '';

  const diffSec = Math.round((nowTs - ts) / 1000);
  const absSec = Math.abs(diffSec);

  const isFuture = diffSec < 0;
  const localize = (n: number) =>
    locale === 'fa'
      ? toLocalizedDigits(String(n), 'persian')
      : locale === 'ar'
        ? toLocalizedDigits(String(n), 'arabic')
        : String(n);

  if (absSec < 45) {
    if (locale === 'fa') return 'هم‌اکنون';
    if (locale === 'ar') return 'الآن';
    if (locale === 'es') return 'ahora mismo';
    return 'just now';
  }

  let value = 0;
  let unitEn = 'minute';
  let unitFa = 'دقیقه';
  let unitAr = 'دقيقة';
  let unitEs = 'minuto';

  if (absSec < 3600) {
    value = Math.max(1, Math.round(absSec / 60));
  } else if (absSec < 86400) {
    value = Math.round(absSec / 3600);
    unitEn = 'hour';
    unitFa = 'ساعت';
    unitAr = 'ساعة';
    unitEs = 'hora';
  } else if (absSec < 86400 * 30) {
    value = Math.round(absSec / 86400);
    unitEn = 'day';
    unitFa = 'روز';
    unitAr = 'يوم';
    unitEs = 'día';
  } else {
    value = Math.round(absSec / (86400 * 30));
    unitEn = 'month';
    unitFa = 'ماه';
    unitAr = 'شهر';
    unitEs = 'mes';
  }

  const num = localize(value);
  if (locale === 'fa') {
    return isFuture ? `${num} ${unitFa} دیگر` : `${num} ${unitFa} پیش`;
  }
  if (locale === 'ar') {
    return isFuture ? `بعد ${num} ${unitAr}` : `منذ ${num} ${unitAr}`;
  }
  if (locale === 'es') {
    const plural = value === 1 ? unitEs : unitEs === 'mes' ? 'meses' : `${unitEs}s`;
    return isFuture ? `en ${num} ${plural}` : `hace ${num} ${plural}`;
  }
  const pluralEn = value === 1 ? unitEn : `${unitEn}s`;
  return isFuture ? `in ${num} ${pluralEn}` : `${num} ${pluralEn} ago`;
}

export function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatCurrencyInputString(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  if (!cleaned) return '';
  const [intPart, decPart] = cleaned.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${formattedInt}.${decPart.slice(0, 2)}` : formattedInt;
}

export function parseCurrencyInputString(formatted: string): number {
  const num = Number(formatted.replace(/,/g, ''));
  return Number.isFinite(num) ? num : 0;
}

export function formatPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

export function validateJsonText(raw: string): {
  valid: boolean;
  error?: string;
  formatted?: string;
} {
  try {
    const parsed = JSON.parse(raw);
    return { valid: true, formatted: JSON.stringify(parsed, null, 2) };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Invalid JSON syntax',
    };
  }
}

export interface ParsedCsvTable {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsvForImport(csvText: string): ParsedCsvTable {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const splitLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cols = splitLine(line);
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = cols[idx] ?? '';
    });
    return record;
  });

  return { headers, rows };
}

export interface ImportValidationResult {
  validRows: Array<{
    customerName: string;
    customerEmail: string;
    company: string;
    amount: number;
    planOrItem: string;
  }>;
  errors: Array<{ rowIndex: number; message: string }>;
}

export function validateImportedRows(
  rows: Record<string, string>[],
  mapping: {
    customerName: string;
    customerEmail: string;
    company: string;
    amount: string;
    planOrItem: string;
  }
): ImportValidationResult {
  const validRows: ImportValidationResult['validRows'] = [];
  const errors: ImportValidationResult['errors'] = [];

  rows.forEach((row, index) => {
    const name = (row[mapping.customerName] ?? '').trim();
    const email = (row[mapping.customerEmail] ?? '').trim();
    const company = (row[mapping.company] ?? '').trim() || 'Imported Account';
    const planOrItem = (row[mapping.planOrItem] ?? '').trim() || 'Standard Plan';
    const rawAmount = Number(String(row[mapping.amount] ?? '').replace(/[^0-9.-]/g, ''));

    if (!name) {
      errors.push({ rowIndex: index + 2, message: 'Missing customer name' });
      return;
    }
    if (!email.includes('@')) {
      errors.push({ rowIndex: index + 2, message: `Invalid email "${email || '(empty)'}"` });
      return;
    }
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      errors.push({ rowIndex: index + 2, message: 'Amount must be > 0' });
      return;
    }

    validRows.push({
      customerName: name,
      customerEmail: email,
      company,
      amount: rawAmount,
      planOrItem,
    });
  });

  return { validRows, errors };
}

export function computeRadarCoordinates(
  values: number[],
  maxVal: number,
  center: number,
  radius: number
): Array<{ x: number; y: number }> {
  if (values.length === 0) return [];
  const safeMax = Math.max(1, maxVal);
  return values.map((val, idx) => {
    const angle = (Math.PI * 2 * idx) / values.length - Math.PI / 2;
    const ratio = Math.max(0, Math.min(1, val / safeMax));
    return {
      x: center + Math.cos(angle) * radius * ratio,
      y: center + Math.sin(angle) * radius * ratio,
    };
  });
}

export function computeGaugeRatio(value: number, min = 0, max = 100): number {
  const span = Math.max(1, max - min);
  return Math.max(0, Math.min(1, (value - min) / span));
}
