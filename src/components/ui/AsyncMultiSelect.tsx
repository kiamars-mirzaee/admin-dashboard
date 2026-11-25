import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { GridFilterOption } from '../../types/dataGrid';

export interface AsyncMultiSelectProps {
  ajaxEndpoint: string;
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function AsyncMultiSelect({
  ajaxEndpoint,
  value,
  onChange,
  label,
  placeholder,
  className = '',
}: AsyncMultiSelectProps) {
  const { t } = useI18n();
  const id = useId();
  const labelId = `${id}-label`;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<GridFilterOption[]>([]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const sep = ajaxEndpoint.includes('?') ? '&' : '?';
        const res = await fetch(`${ajaxEndpoint}${sep}q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as { options?: GridFilterOption[] };
          setOptions(Array.isArray(data.options) ? data.options : []);
        }
      } catch {
        // Ignore abort errors
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query, ajaxEndpoint]);

  useEffect(() => {
    if (open) {
      const tmr = window.setTimeout(() => searchRef.current?.focus(), 20);
      return () => window.clearTimeout(tmr);
    }
    setQuery('');
  }, [open]);

  const toggleValue = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

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
          {value.length === 0 ? (
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {placeholder ?? t('msPlaceholder')}
            </span>
          ) : (
            <>
              {value.slice(0, 2).map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100"
                >
                  <span className="truncate max-w-[130px]">{item}</span>
                  <button
                    type="button"
                    aria-label={t('msRemoveItem', { item })}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleValue(item);
                    }}
                    className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {value.length > 2 && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums px-1">
                  +{value.length - 2}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value.length > 0 && (
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
                placeholder={placeholder ?? t('msSearchPlaceholder')}
                className="w-full min-h-[38px] ps-8 pe-8 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {loading && (
                <Loader2
                  className="w-3.5 h-3.5 text-blue-600 animate-spin absolute end-2.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {loading && options.length === 0 ? (
              <p className="py-5 text-center text-xs text-slate-400 dark:text-slate-500">
                {t('gridAjaxLoading')}
              </p>
            ) : options.length === 0 ? (
              <p className="py-5 text-center text-xs text-slate-400 dark:text-slate-500">
                {t('gridAjaxNoResults')}
              </p>
            ) : (
              options.map((opt) => {
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
