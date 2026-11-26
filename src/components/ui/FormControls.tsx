import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  Search,
  X,
} from 'lucide-react';
import {
  addNormalizedTag,
  evaluatePasswordStrength,
  filterComboboxOptions,
} from '../../utils/adminSuite';

interface FieldWrapperProps {
  id: string;
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldWrapper({
  id,
  label,
  helperText,
  error,
  required,
  children,
}: FieldWrapperProps) {
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
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

/* 1. PasswordInput with show/hide + strength meter */
export interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  showStrength?: boolean;
  disabled?: boolean;
  required?: boolean;
  testId?: string;
}

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder = '••••••••••••',
  helperText,
  error,
  showStrength = false,
  disabled = false,
  required = false,
  testId,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const strength = useMemo(() => evaluatePasswordStrength(value), [value]);

  const barColor =
    strength.score <= 1
      ? 'bg-red-500'
      : strength.score === 2
        ? 'bg-amber-500'
        : strength.score === 3
          ? 'bg-blue-500'
          : 'bg-emerald-500';

  return (
    <FieldWrapper
      id={id}
      label={label}
      helperText={helperText}
      error={error}
      required={required}
    >
      <div className="relative">
        <input
          id={id}
          data-testid={testId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={`w-full min-h-[44px] ps-3.5 pe-11 rounded-xl bg-white dark:bg-slate-950 border text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 ${
            error
              ? 'border-red-500 dark:border-red-500'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          disabled={disabled}
          className="absolute end-1 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          {visible ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex-1 grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((seg) => (
              <div
                key={seg}
                className={`h-1 rounded-full transition-colors ${
                  strength.score >= seg
                    ? barColor
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {strength.label}
          </span>
        </div>
      )}
    </FieldWrapper>
  );
}

/* 2. SearchableCombobox */
export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

export interface SearchableComboboxProps {
  label: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  testId?: string;
}

export function SearchableCombobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  helperText,
  error,
  testId,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selected = options.find((opt) => opt.value === value);
  const filtered = useMemo(
    () => filterComboboxOptions(options, query),
    [options, query]
  );

  return (
    <div ref={rootRef} className="relative">
      <FieldWrapper id={id} label={label} helperText={helperText} error={error}>
        <button
          id={id}
          type="button"
          data-testid={testId}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={`w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border text-sm flex items-center justify-between gap-2 text-start cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            error
              ? 'border-red-500'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <span
            className={
              selected
                ? 'text-slate-900 dark:text-white truncate'
                : 'text-slate-400 truncate'
            }
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
      </FieldWrapper>

      {open && (
        <div className="absolute start-0 end-0 top-full mt-1.5 z-40 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 relative">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute start-4.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter options..."
              aria-label={`Search ${label}`}
              autoFocus
              className="w-full min-h-[36px] ps-8 pe-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <ul role="listbox" className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-500">
                No matching options
              </li>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                        setQuery('');
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-start flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{opt.label}</span>
                        {opt.description && (
                          <span className="block text-[11px] text-slate-400 truncate">
                            {opt.description}
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* 3. CheckboxField */
export interface CheckboxFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
}

export function CheckboxField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  error,
}: CheckboxFieldProps) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className={`flex items-start gap-2.5 cursor-pointer select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 cursor-pointer shrink-0"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-slate-900 dark:text-white">
            {label}
          </span>
          {description && (
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              {description}
            </span>
          )}
        </span>
      </label>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400 ps-6">
          {error}
        </p>
      )}
    </div>
  );
}

/* 4. RadioGroupField */
export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupFieldProps {
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3;
  helperText?: string;
}

export function RadioGroupField({
  label,
  options,
  value,
  onChange,
  columns = 1,
  helperText,
}: RadioGroupFieldProps) {
  const groupName = useId();
  const gridCls =
    columns === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : columns === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1';

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </legend>
      <div className={`grid gap-2 ${gridCls}`}>
        {options.map((opt) => {
          const checked = opt.value === value;
          return (
            <label
              key={opt.value}
              className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                checked
                  ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <input
                type="radio"
                name={groupName}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="mt-0.5 w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer shrink-0"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900 dark:text-white">
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {opt.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {helperText && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </fieldset>
  );
}

/* 5. SwitchToggle */
export interface SwitchToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  testId?: string;
}

export function SwitchToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  testId,
}: SwitchToggleProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-slate-900 dark:text-white">
          {label}
        </span>
        {description && (
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            {description}
          </span>
        )}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        data-testid={testId}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 ${
          checked
            ? 'bg-blue-600'
            : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked
              ? 'translate-x-5 rtl:-translate-x-5'
              : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

/* 6. TimePicker */
export interface TimePickerProps {
  label: string;
  value: string; // HH:MM
  onChange: (value: string) => void;
  helperText?: string;
  presets?: string[];
}

export function TimePicker({
  label,
  value,
  onChange,
  helperText,
  presets = ['09:00', '14:30', '18:00', '23:00'],
}: TimePickerProps) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} helperText={helperText}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <Clock
            className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id={id}
            type="time"
            dir="ltr"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[44px] ps-9 pe-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              dir="ltr"
              onClick={() => onChange(p)}
              className={`px-2 py-1.5 rounded-lg font-mono text-[11px] font-medium border cursor-pointer transition-colors ${
                value === p
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </FieldWrapper>
  );
}

/* 7. SliderField */
export interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  helperText?: string;
}

export function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  helperText,
}: SliderFieldProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
        <span
          dir="ltr"
          className="font-mono text-xs font-semibold tabular-nums text-blue-600 dark:text-blue-400"
        >
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg bg-slate-200 dark:bg-slate-800 accent-blue-600 cursor-pointer"
      />
      {helperText && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

/* 8. TagInput */
export interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  helperText?: string;
  testId?: string;
}

export function TagInput({
  label,
  tags,
  onChange,
  placeholder = 'Type tag and press Enter...',
  helperText,
  testId,
}: TagInputProps) {
  const [draft, setDraft] = useState('');
  const id = useId();

  const commit = (raw: string) => {
    const next = addNormalizedTag(tags, raw);
    if (next !== tags) onChange(next);
    setDraft('');
  };

  return (
    <FieldWrapper id={id} label={label} helperText={helperText}>
      <div className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-blue-600">
        {tags.map((tag, idx) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => onChange(tags.filter((_, i) => i !== idx))}
              aria-label={`Remove ${tag}`}
              className="text-slate-400 hover:text-red-600 cursor-pointer"
            >
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          data-testid={testId}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit(draft);
            } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (draft.trim()) commit(draft);
          }}
          placeholder={tags.length === 0 ? placeholder : 'Add...'}
          className="flex-1 min-w-[110px] py-1 px-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
    </FieldWrapper>
  );
}

/* 9. MarkdownEditor (Write / Preview / Split without unsafe HTML) */
export interface MarkdownEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}

function renderSimpleMarkdownLines(source: string): React.ReactNode {
  const lines = source.split('\n');
  return (
    <div className="space-y-1.5 text-sm text-slate-700 dark:text-slate-200">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        if (trimmed.startsWith('## ')) {
          return (
            <h4 key={i} className="text-sm font-bold text-slate-900 dark:text-white">
              {trimmed.slice(3)}
            </h4>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h3 key={i} className="text-base font-bold text-slate-900 dark:text-white">
              {trimmed.slice(2)}
            </h3>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-2 ps-1">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>{trimmed.slice(2)}</span>
            </div>
          );
        }
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={i}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs italic text-slate-600 dark:text-slate-300"
            >
              {trimmed.slice(2)}
            </blockquote>
          );
        }
        return (
          <p key={i} className="text-xs leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export function MarkdownEditor({
  label,
  value,
  onChange,
  helperText,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'write' | 'preview' | 'split'>('split');
  const id = useId();

  return (
    <FieldWrapper id={id} label={label} helperText={helperText}>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-slate-500">
            Markdown (.md)
          </span>
          <div className="inline-flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 text-[11px]">
            {(['write', 'split', 'preview'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-2 py-1 rounded-md capitalize font-medium cursor-pointer transition-colors ${
                  mode === m
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div
          className={
            mode === 'split'
              ? 'grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x rtl:md:divide-x-reverse divide-slate-200 dark:divide-slate-800'
              : ''
          }
        >
          {(mode === 'write' || mode === 'split') && (
            <textarea
              id={id}
              rows={5}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-3 bg-transparent font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none resize-y"
            />
          )}
          {(mode === 'preview' || mode === 'split') && (
            <div className="p-3 bg-slate-50/40 dark:bg-slate-900/30 min-h-[120px]">
              {value.trim() ? (
                renderSimpleMarkdownLines(value)
              ) : (
                <p className="text-xs text-slate-400">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </FieldWrapper>
  );
}
