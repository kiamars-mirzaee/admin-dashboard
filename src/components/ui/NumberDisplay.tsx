import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import {
  formatNumberValue,
  type NumberFormatStyle,
  type NumeralScript,
  toArabicDigits,
  toPersianDigits,
} from '../../utils/numberFormat';

export interface PersianNumberProps {
  value: number | string;
  script?: 'persian' | 'arabic';
  localizeSeparators?: boolean;
  group?: boolean;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function PersianNumber({
  value,
  script = 'persian',
  localizeSeparators = true,
  group = true,
  decimals,
  prefix = '',
  suffix = '',
  className = '',
}: PersianNumberProps) {
  let raw = String(value);
  if (typeof value === 'number' && Number.isFinite(value)) {
    raw = new Intl.NumberFormat('en-US', {
      useGrouping: group,
      maximumFractionDigits: decimals ?? 4,
    }).format(value);
  }

  const converted =
    script === 'arabic'
      ? toArabicDigits(raw, localizeSeparators)
      : toPersianDigits(raw, localizeSeparators);

  return (
    <span dir="ltr" className={`tabular-nums inline-block ${className}`}>
      {prefix}
      {converted}
      {suffix}
    </span>
  );
}

export interface NumberFormatterProps {
  value: number;
  format?: NumberFormatStyle;
  currency?: string;
  decimals?: number;
  useGrouping?: boolean;
  script?: NumeralScript;
  copyable?: boolean;
  className?: string;
}

export function NumberFormatter({
  value,
  format = 'decimal',
  currency = 'USD',
  decimals = 2,
  useGrouping = true,
  script = 'latin',
  copyable = false,
  className = '',
}: NumberFormatterProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const formatted = formatNumberValue(value, {
    style: format,
    currency,
    decimals,
    useGrouping,
    script,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard unavailable in restricted context
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span dir="ltr" className="tabular-nums">
        {formatted}
      </span>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? t('numCopied') : t('numCopy')}
          title={copied ? t('numCopied') : t('numCopy')}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          ) : (
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      )}
    </span>
  );
}
