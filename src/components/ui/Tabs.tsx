import React, { useEffect } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
  urlSyncParam?: string;
  ariaLabel?: string;
  className?: string;
}

export function Tabs({
  items,
  value,
  onChange,
  orientation = 'horizontal',
  urlSyncParam,
  ariaLabel = 'Tabs',
  className = '',
}: TabsProps) {
  useEffect(() => {
    if (!urlSyncParam || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paramVal = params.get(urlSyncParam);
    if (
      paramVal &&
      paramVal !== value &&
      items.some((item) => item.id === paramVal && !item.disabled)
    ) {
      onChange(paramVal);
    }
  }, [urlSyncParam]);

  const handleSelect = (id: string) => {
    onChange(id);
    if (urlSyncParam && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set(urlSyncParam, id);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const activeItem = items.find((i) => i.id === value) ?? items[0];

  return (
    <div
      className={`${
        orientation === 'vertical'
          ? 'grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start'
          : 'space-y-4'
      } ${className}`}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation={orientation}
        className={
          orientation === 'vertical'
            ? 'flex md:flex-col gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-1.5'
            : 'flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800'
        }
      >
        {items.map((item) => {
          const isActive = item.id === activeItem?.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={item.disabled}
              onClick={() => handleSelect(item.id)}
              className={
                orientation === 'vertical'
                  ? `min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`
                  : `min-h-[40px] px-3.5 py-2 text-xs font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                      isActive
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`
              }
            >
              <span className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </span>
              {item.badge !== undefined && (
                <span
                  dir="ltr"
                  className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeItem?.content !== undefined && (
        <div role="tabpanel" aria-label={activeItem.label}>
          {activeItem.content}
        </div>
      )}
    </div>
  );
}
