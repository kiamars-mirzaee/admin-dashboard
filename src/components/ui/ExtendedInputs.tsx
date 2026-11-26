import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Check,
  Code2,
  Crop,
  Link2,
  Minus,
  Phone,
  Plus,
  Search,
  Star,
  Upload,
  Wand2,
} from 'lucide-react';
import {
  formatCurrencyInputString,
  formatPhoneNumber,
  slugifyText,
  validateJsonText,
} from '../../utils/formatters';
import { Button } from './Button';
import { Modal } from './Modal';

export interface FormFieldShellProps {
  id: string;
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormFieldShell({
  id,
  label,
  helperText,
  error,
  required,
  children,
}: FormFieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
      >
        {label}
        {required && (
          <span className="text-red-500 ms-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}

/* Input (Text, Email, URL, Search) */
export interface InputProps {
  label: string;
  type?: 'text' | 'email' | 'url' | 'search';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  helperText,
  error,
  required,
  disabled,
  prefix,
  suffix,
}: InputProps) {
  const id = useId();
  const resolvedPrefix =
    prefix ??
    (type === 'search' ? (
      <Search className="w-4 h-4 text-slate-400" aria-hidden="true" />
    ) : undefined);

  return (
    <FormFieldShell
      id={id}
      label={label}
      helperText={helperText}
      error={error}
      required={required}
    >
      <div
        className={`flex items-center min-h-[44px] rounded-xl bg-white dark:bg-slate-950 border px-3 gap-2 focus-within:ring-2 focus-within:ring-blue-600 ${
          error ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        {resolvedPrefix && <span className="shrink-0">{resolvedPrefix}</span>}
        <input
          id={id}
          type={type}
          dir={type === 'email' || type === 'url' ? 'ltr' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
        />
        {suffix && <span className="shrink-0 text-xs text-slate-400">{suffix}</span>}
      </div>
    </FormFieldShell>
  );
}

/* NumberInput (+/- Steppers) */
export function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 999999,
  step = 1,
  helperText,
  error,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  error?: string;
}) {
  const id = useId();
  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  return (
    <FormFieldShell id={id} label={label} helperText={helperText} error={error}>
      <div className="inline-flex w-full items-center min-h-[44px] rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="w-11 h-11 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
        >
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>
        <input
          id={id}
          type="number"
          dir="ltr"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          className="flex-1 min-w-0 bg-transparent text-center font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="w-11 h-11 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </FormFieldShell>
  );
}

/* CurrencyInput */
export function CurrencyInput({
  label,
  value,
  onChange,
  currencySymbol = '$',
  currencyCode = 'USD',
  helperText,
  error,
}: {
  label: string;
  value: string;
  onChange: (formatted: string) => void;
  currencySymbol?: string;
  currencyCode?: string;
  helperText?: string;
  error?: string;
}) {
  const id = useId();
  return (
    <FormFieldShell id={id} label={label} helperText={helperText} error={error}>
      <div
        dir="ltr"
        className={`flex items-center min-h-[44px] rounded-xl bg-white dark:bg-slate-950 border px-3 gap-2 focus-within:ring-2 focus-within:ring-blue-600 ${
          error ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <span className="font-mono text-sm font-semibold text-slate-500 dark:text-slate-400">
          {currencySymbol}
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(formatCurrencyInputString(e.target.value))}
          placeholder="0.00"
          className="flex-1 min-w-0 bg-transparent font-mono text-sm tabular-nums text-slate-900 dark:text-white focus:outline-none"
        />
        <span className="font-mono text-[11px] font-semibold text-slate-400">
          {currencyCode}
        </span>
      </div>
    </FormFieldShell>
  );
}

/* PhoneInput */
export function PhoneInput({
  label,
  countryCode,
  onCountryCodeChange,
  value,
  onChange,
  helperText,
}: {
  label: string;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  value: string;
  onChange: (formatted: string) => void;
  helperText?: string;
}) {
  const id = useId();
  return (
    <FormFieldShell id={id} label={label} helperText={helperText}>
      <div
        dir="ltr"
        className="flex items-center min-h-[44px] rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600"
      >
        <select
          aria-label="Country dial code"
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          className="h-11 px-2.5 bg-slate-50 dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="+1">US +1</option>
          <option value="+98">IR +98</option>
          <option value="+971">AE +971</option>
          <option value="+44">UK +44</option>
          <option value="+49">DE +49</option>
        </select>
        <Phone className="w-3.5 h-3.5 text-slate-400 ms-3 shrink-0" aria-hidden="true" />
        <input
          id={id}
          type="tel"
          value={value}
          onChange={(e) => onChange(formatPhoneNumber(e.target.value))}
          placeholder="(415) 555-0198"
          className="flex-1 min-w-0 px-2.5 bg-transparent font-mono text-sm text-slate-900 dark:text-white focus:outline-none"
        />
      </div>
    </FormFieldShell>
  );
}

/* OTPInput */
export function OTPInput({
  label,
  length = 6,
  value,
  onChange,
  helperText,
}: {
  label: string;
  length?: number;
  value: string;
  onChange: (next: string) => void;
  helperText?: string;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, idx) => value[idx] ?? '');

  const setDigit = (idx: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (clean.length > 1) {
      const merged = clean.slice(0, length);
      onChange(merged);
      inputsRef.current[Math.min(length - 1, merged.length - 1)]?.focus();
      return;
    }
    const arr = [...digits];
    arr[idx] = clean;
    onChange(arr.join(''));
    if (clean && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <div dir="ltr" className="grid grid-cols-6 gap-2 max-w-xs">
        {digits.map((d, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={length}
            aria-label={`${label} digit ${idx + 1}`}
            value={d}
            onChange={(e) => setDigit(idx, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !d && idx > 0) {
                inputsRef.current[idx - 1]?.focus();
              }
            }}
            className="h-11 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-mono text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        ))}
      </div>
      {helperText && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
}

/* Textarea (Auto-resize + Character Counter) */
export function Textarea({
  label,
  value,
  onChange,
  maxLength = 500,
  placeholder,
  helperText,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  helperText?: string;
  error?: string;
}) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${Math.min(240, Math.max(84, ref.current.scrollHeight))}px`;
  }, [value]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </label>
        <span dir="ltr" className="font-mono text-[11px] tabular-nums text-slate-400">
          {value.length}/{maxLength}
        </span>
      </div>
      <textarea
        ref={ref}
        id={id}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full p-3 rounded-xl bg-white dark:bg-slate-950 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none ${
          error ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
        }`}
      />
      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}

/* NativeSelect */
export function NativeSelect({
  label,
  value,
  onChange,
  options,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  helperText?: string;
}) {
  const id = useId();
  return (
    <FormFieldShell id={id} label={label} helperText={helperText}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormFieldShell>
  );
}

/* CheckboxGroup */
export function CheckboxGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (item: string) => {
    onChange(
      value.includes(item) ? value.filter((v) => v !== item) : [...value, item]
    );
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const checked = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggle(opt.value)}
              className={`min-h-[40px] px-3 rounded-xl border flex items-center gap-2.5 text-start text-xs font-medium cursor-pointer transition-colors ${
                checked
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  checked
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {checked && <Check className="w-3 h-3" aria-hidden="true" />}
              </span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/* RangeSlider (Min / Max) */
export function RangeSlider({
  label,
  min = 0,
  max = 10000,
  step = 100,
  value,
  onChange,
  unit = '$',
}: {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  unit?: string;
}) {
  const [low, high] = value;
  const pctLow = ((low - min) / Math.max(1, max - min)) * 100;
  const pctHigh = ((high - min) / Math.max(1, max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        <span dir="ltr" className="font-mono font-semibold tabular-nums text-blue-600 dark:text-blue-400">
          {unit}{low.toLocaleString()} – {unit}{high.toLocaleString()}
        </span>
      </div>
      <div className="relative h-6 flex items-center" dir="ltr">
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 relative">
          <div
            className="absolute h-full rounded-full bg-blue-600"
            style={{ left: `${pctLow}%`, width: `${Math.max(0, pctHigh - pctLow)}%` }}
          />
        </div>
        <input
          type="range"
          aria-label={`${label} minimum`}
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => onChange([Math.min(Number(e.target.value), high - step), high])}
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-auto opacity-80 accent-blue-600 cursor-pointer"
        />
        <input
          type="range"
          aria-label={`${label} maximum`}
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => onChange([low, Math.max(Number(e.target.value), low + step)])}
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-auto opacity-80 accent-blue-600 cursor-pointer"
        />
      </div>
    </div>
  );
}

/* Rating */
export function Rating({
  label,
  value,
  onChange,
  max = 5,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <div className="inline-flex items-center gap-1" role="radiogroup" aria-label={label}>
        {Array.from({ length: max }, (_, idx) => {
          const score = idx + 1;
          const active = score <= value;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={value === score}
              aria-label={`${score} of ${max} stars`}
              onClick={() => onChange(score)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-transform active:scale-95"
            >
              <Star
                className={`w-5 h-5 ${
                  active
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
                aria-hidden="true"
              />
            </button>
          );
        })}
        <span dir="ltr" className="ms-2 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {value}/{max}
        </span>
      </div>
    </div>
  );
}

/* ImageUpload / AvatarUpload with Crop Preview Modal */
export function ImageUpload({
  label,
  valueUrl,
  onChange,
  circular = false,
}: {
  label: string;
  valueUrl: string | null;
  onChange: (dataUrl: string | null) => void;
  circular?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawPreview, setRawPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setZoom(1);
        setRawPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const applyCrop = () => {
    if (!rawPreview) return;
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const minDim = Math.min(img.width, img.height) / zoom;
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        onChange(canvas.toDataURL('image/png'));
      }
      setRawPreview(null);
    };
    img.src = rawPreview;
  };

  return (
    <div className="space-y-2">
      <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 ${
            circular ? 'rounded-full' : 'rounded-2xl'
          } bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0`}
        >
          {valueUrl ? (
            <img src={valueUrl} alt={label} className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-5 h-5 text-slate-400" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Crop className="w-3.5 h-3.5" />}
            onClick={() => inputRef.current?.click()}
          >
            {valueUrl ? 'Change & Crop' : 'Upload Image'}
          </Button>
          {valueUrl && (
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(rawPreview)}
        onClose={() => setRawPreview(null)}
        title="Crop uploaded image"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRawPreview(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={applyCrop}>
              Apply Crop
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="w-56 h-56 mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex items-center justify-center">
            {rawPreview && (
              <img
                src={rawPreview}
                alt="Crop preview"
                style={{ transform: `scale(${zoom})` }}
                className="w-full h-full object-cover transition-transform"
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Zoom</span>
            <input
              type="range"
              min={1}
              max={2.4}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-blue-600"
            />
            <span dir="ltr" className="font-mono text-xs tabular-nums text-slate-500">
              {zoom.toFixed(1)}x
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* JSONEditor / CodeEditor */
export function JSONEditor({
  label,
  value,
  onChange,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  helperText?: string;
}) {
  const id = useId();
  const validation = validateJsonText(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span>{label}</span>
        </label>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-medium ${
              validation.valid
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {validation.valid ? 'Valid JSON' : 'Syntax error'}
          </span>
          <button
            type="button"
            disabled={!validation.valid}
            onClick={() => {
              if (validation.formatted) onChange(validation.formatted);
            }}
            className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40 cursor-pointer"
          >
            Format
          </button>
        </div>
      </div>
      <textarea
        id={id}
        dir="ltr"
        rows={6}
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-3 rounded-xl bg-slate-950 text-slate-100 border font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600 ${
          validation.valid ? 'border-slate-800' : 'border-red-500'
        }`}
      />
      {!validation.valid && validation.error ? (
        <p role="alert" dir="ltr" className="font-mono text-[11px] text-red-600 dark:text-red-400">
          {validation.error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}

/* SlugInput */
export function SlugInput({
  label,
  value,
  onChange,
  sourceTitle,
  prefix = 'https://kestrelops.io/',
}: {
  label: string;
  value: string;
  onChange: (slug: string) => void;
  sourceTitle?: string;
  prefix?: string;
}) {
  const id = useId();
  return (
    <FormFieldShell id={id} label={label}>
      <div
        dir="ltr"
        className="flex items-center min-h-[44px] rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600"
      >
        <span className="px-3 h-11 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-500 shrink-0">
          <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{prefix}</span>
        </span>
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(slugifyText(e.target.value))}
          className="flex-1 min-w-0 px-3 bg-transparent font-mono text-xs text-slate-900 dark:text-white focus:outline-none"
        />
        {sourceTitle && (
          <button
            type="button"
            onClick={() => onChange(slugifyText(sourceTitle))}
            title="Regenerate slug from title"
            className="px-2.5 h-11 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sync</span>
          </button>
        )}
      </div>
    </FormFieldShell>
  );
}
