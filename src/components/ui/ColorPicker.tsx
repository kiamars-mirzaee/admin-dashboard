import { useEffect, useId, useState } from 'react';
import { Check } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import {
  getContrastRatio,
  hexToRgb,
  normalizeHexColor,
} from '../../utils/numberFormat';

const DEFAULT_PRESETS = [
  '#2563EB',
  '#0F172A',
  '#059669',
  '#D97706',
  '#DC2626',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
];

export interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  presets?: string[];
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  label,
  presets = DEFAULT_PRESETS,
  className = '',
}: ColorPickerProps) {
  const { t } = useI18n();
  const id = useId();
  const normalizedValue = normalizeHexColor(value) ?? '#2563EB';
  const [hexDraft, setHexDraft] = useState(normalizedValue);
  const [invalidHex, setInvalidHex] = useState(false);

  useEffect(() => {
    setHexDraft(normalizedValue);
    setInvalidHex(false);
  }, [normalizedValue]);

  const handleHexInput = (raw: string) => {
    const next = raw.startsWith('#') ? raw : `#${raw}`;
    setHexDraft(next.toUpperCase());
    const valid = normalizeHexColor(next);
    if (valid) {
      setInvalidHex(false);
      onChange(valid);
    } else {
      setInvalidHex(true);
    }
  };

  const rgb = hexToRgb(normalizedValue) ?? { r: 37, g: 99, b: 235 };
  const contrastWhite = getContrastRatio(normalizedValue, '#FFFFFF');
  const contrastDark = getContrastRatio(normalizedValue, '#0F172A');

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
      )}

      <div className="flex items-stretch gap-2.5">
        <div className="relative shrink-0">
          <input
            type="color"
            aria-label={label ?? t('cpLabel')}
            value={normalizedValue}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="w-11 h-11 p-0.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative">
            <input
              id={id}
              type="text"
              dir="ltr"
              maxLength={7}
              value={hexDraft}
              onChange={(e) => handleHexInput(e.target.value)}
              aria-invalid={invalidHex}
              aria-label={t('cpHexLabel')}
              className={`w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                invalidHex
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            />
          </div>
          {invalidHex && (
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">
              {t('cpInvalidHex')}
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
          {t('cpPresetsLabel')}
        </p>
        <div className="grid grid-cols-8 gap-2">
          {presets.map((swatch) => {
            const norm = normalizeHexColor(swatch) ?? swatch;
            const active = norm === normalizedValue;
            const lightText = getContrastRatio(norm, '#FFFFFF') >= 3;
            return (
              <button
                key={norm}
                type="button"
                aria-label={norm}
                aria-pressed={active}
                onClick={() => onChange(norm)}
                style={{ backgroundColor: norm }}
                className={`h-9 rounded-lg border transition-transform active:scale-95 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                  active
                    ? 'border-slate-900 dark:border-white ring-2 ring-blue-500/40'
                    : 'border-black/10 dark:border-white/10'
                }`}
              >
                {active && (
                  <Check
                    className={`w-3.5 h-3.5 ${lightText ? 'text-white' : 'text-slate-900'}`}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span dir="ltr" className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
          {t('cpRgbLabel')}: {rgb.r}, {rgb.g}, {rgb.b}
        </span>
        <div className="flex items-center gap-3 tabular-nums">
          <span className="text-slate-600 dark:text-slate-300">
            {t('cpContrastWhite')}:{' '}
            <strong dir="ltr" className="font-mono text-slate-900 dark:text-white">
              {contrastWhite}:1
            </strong>
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            {t('cpContrastSlate')}:{' '}
            <strong dir="ltr" className="font-mono text-slate-900 dark:text-white">
              {contrastDark}:1
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
