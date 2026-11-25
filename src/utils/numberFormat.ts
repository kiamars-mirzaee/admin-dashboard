const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

export type NumeralScript = 'latin' | 'persian' | 'arabic';
export type NumberFormatStyle = 'decimal' | 'currency' | 'percent' | 'compact' | 'bytes';

export function toPersianDigits(input: string | number, replaceDecimalDot = false): string {
  const str = String(input);
  let out = '';
  for (let i = 0; i < str.length; i += 1) {
    const ch = str[i];
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      out += PERSIAN_DIGITS[code - 48];
    } else if (replaceDecimalDot && ch === '.') {
      out += '٫';
    } else if (replaceDecimalDot && ch === ',') {
      out += '٬';
    } else {
      out += ch;
    }
  }
  return out;
}

export function toArabicDigits(input: string | number, replaceDecimalDot = false): string {
  const str = String(input);
  let out = '';
  for (let i = 0; i < str.length; i += 1) {
    const ch = str[i];
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      out += ARABIC_DIGITS[code - 48];
    } else if (replaceDecimalDot && ch === '.') {
      out += '٫';
    } else if (replaceDecimalDot && ch === ',') {
      out += '٬';
    } else {
      out += ch;
    }
  }
  return out;
}

export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d as (typeof PERSIAN_DIGITS)[number])))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d as (typeof ARABIC_DIGITS)[number])))
    .replace(/٫/g, '.')
    .replace(/٬/g, '');
}

export interface NumberFormatOptions {
  style?: NumberFormatStyle;
  currency?: string;
  decimals?: number;
  useGrouping?: boolean;
  script?: NumeralScript;
}

export function formatBytesValue(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exp = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const scaled = bytes / 1024 ** exp;
  const fixed = exp === 0 ? String(Math.round(scaled)) : scaled.toFixed(decimals);
  return `${fixed} ${units[exp]}`;
}

export function formatNumberValue(
  value: number,
  options: NumberFormatOptions = {}
): string {
  const {
    style = 'decimal',
    currency = 'USD',
    decimals = 2,
    useGrouping = true,
    script = 'latin',
  } = options;

  if (!Number.isFinite(value)) return '—';

  const safeDecimals = Math.min(Math.max(0, Math.floor(decimals)), 6);
  let formatted = '';

  if (style === 'bytes') {
    formatted = formatBytesValue(value, safeDecimals);
  } else if (style === 'compact') {
    formatted = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: safeDecimals,
    }).format(value);
  } else if (style === 'currency') {
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      useGrouping,
      maximumFractionDigits: safeDecimals,
      minimumFractionDigits: safeDecimals > 0 && value % 1 !== 0 ? safeDecimals : 0,
    }).format(value);
  } else if (style === 'percent') {
    formatted = `${new Intl.NumberFormat('en-US', {
      useGrouping,
      maximumFractionDigits: safeDecimals,
      minimumFractionDigits: safeDecimals > 0 && value % 1 !== 0 ? safeDecimals : 0,
    }).format(value)}%`;
  } else {
    formatted = new Intl.NumberFormat('en-US', {
      useGrouping,
      maximumFractionDigits: safeDecimals,
    }).format(value);
  }

  if (script === 'persian') {
    return toPersianDigits(formatted, true);
  }
  if (script === 'arabic') {
    return toArabicDigits(formatted, true);
  }
  return formatted;
}

export function isValidHexColor(hex: string): boolean {
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(hex.trim());
}

export function normalizeHexColor(hex: string): string | null {
  const clean = hex.trim();
  if (!isValidHexColor(clean)) return null;
  if (clean.length === 4) {
    const [, r, g, b] = clean;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return clean.toUpperCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const norm = normalizeHexColor(hex);
  if (!norm) return null;
  const num = parseInt(norm.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return 1;
  const l1 = relativeLuminance(rgbA.r, rgbA.g, rgbA.b);
  const l2 = relativeLuminance(rgbB.r, rgbB.g, rgbB.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}
