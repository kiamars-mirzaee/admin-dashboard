import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  searchable?: boolean;
  maxChips?: number;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  label,
  placeholder,
  searchable = true,
  maxChips = 3,
  className = '',
}: MultiSelectProps) {
  const { t } = useI18n();
  const id = useId();
  const labelId = `${id}-label`;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      const timer = window.setTimeout(() => searchRef.current?.focus(), 20);
      return () => window.clearTimeout(timer);
    }
    if (!open) setQuery('');
  }, [open, searchable]);

  const selectedOptions = useMemo(
    () => options.filter((opt) => value.includes(opt.value)),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description?.toLowerCase().includes(q) ?? false)
    );
  }, [options, query]);

  const toggleValue = (itemValue: string) => {
    if (value.includes(itemValue)) {
      onChange(value.filter((v) => v !== itemValue));
    } else {
      onChange([...value, itemValue]);
    }
  };

  const visibleChips = selectedOptions.slice(0, maxChips);
  const overflowCount = Math.max(0, selectedOptions.length - maxChips);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label
          id={labelId}
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
        >
          {label}
        </label>
      )}

      <div
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label ? placeholder ?? t('msPlaceholder') : undefined}
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className="min-h-[44px] w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 flex items-center justify-between gap-2 cursor-pointer transition-colors"
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
          {selectedOptions.length === 0 ? (
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {placeholder ?? t('msPlaceholder')}
            </span>
          ) : (
            <>
              {visibleChips.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100"
                >
                  <span className="truncate max-w-[140px]">{opt.label}</span>
                  <button
                    type="button"
                    aria-label={t('msRemoveItem', { item: opt.label })}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleValue(opt.value);
                    }}
                    className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {overflowCount > 0 && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums px-1">
                  +{overflowCount}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedOptions.length > 0 && (
            <button
              type="button"
              aria-label={t('msClear')}
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
              open ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </div>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute start-0 z-30 mt-1.5 w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden"
        >
          {searchable && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('msSearchPlaceholder')}
                  className="w-full min-h-[36px] ps-8 pe-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}

          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/70 dark:bg-slate-950/50">
            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
              {t('msSelectedItems', { count: selectedOptions.length })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange(options.map((o) => o.value))}
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {t('msSelectAll')}
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="font-medium text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
              >
                {t('msClear')}
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <p className="py-5 text-center text-xs text-slate-400 dark:text-slate-500">
                {t('msNoOptions')}
              </p>
            ) : (
              filteredOptions.map((opt) => {
                const checked = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggleValue(opt.value)}
                    className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg text-start flex items-center gap-2.5 transition-colors cursor-pointer ${
                      checked
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        checked
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{opt.label}</p>
                      {opt.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
