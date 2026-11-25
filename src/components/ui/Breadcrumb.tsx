import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import {
  type BreadcrumbItem,
  collapseBreadcrumbs,
} from '../../utils/breadcrumbs';

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: 'chevron' | 'slash';
  showHomeIcon?: boolean;
  maxVisible?: number;
  size?: 'sm' | 'md';
  ariaLabel?: string;
  className?: string;
}

export function Breadcrumb({
  items,
  separator = 'chevron',
  showHomeIcon = false,
  maxVisible = 5,
  size = 'md',
  ariaLabel,
  className = '',
}: BreadcrumbProps) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const ellipsisWrapRef = useRef<HTMLLIElement>(null);

  const tokens = useMemo(
    () => collapseBreadcrumbs(items, maxVisible),
    [items, maxVisible]
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [items]);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        ellipsisWrapRef.current &&
        !ellipsisWrapRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  if (items.length === 0) return null;

  const textSizeClass = size === 'sm' ? 'text-xs' : 'text-sm';
  const hitHeightClass = size === 'sm' ? 'min-h-[32px]' : 'min-h-[36px]';

  const renderSeparator = () => {
    if (separator === 'slash') {
      return (
        <span
          aria-hidden="true"
          className="text-slate-300 dark:text-slate-600 select-none shrink-0 px-0.5"
        >
          /
        </span>
      );
    }
    return (
      <ChevronRight
        aria-hidden="true"
        className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 rtl:rotate-180 shrink-0"
      />
    );
  };

  return (
    <nav
      aria-label={ariaLabel ?? t('breadcrumbLabel')}
      className={`min-w-0 ${className}`}
    >
      <ol
        className={`flex items-center flex-nowrap gap-1 sm:gap-1.5 min-w-0 ${textSizeClass}`}
      >
        {tokens.map((token, idx) => {
          const isFirst = idx === 0;

          if (token.kind === 'ellipsis') {
            return (
              <li
                key="breadcrumb-ellipsis"
                ref={ellipsisWrapRef}
                className="relative flex items-center gap-1 sm:gap-1.5 shrink-0"
              >
                {!isFirst && renderSeparator()}
                <button
                  type="button"
                  aria-label={t('breadcrumbShowHidden')}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((o) => !o)}
                  className={`${hitHeightClass} px-1.5 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`}
                >
                  <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    aria-label={t('breadcrumbShowHidden')}
                    className="absolute start-0 top-full mt-1.5 z-50 min-w-[190px] max-w-[260px] py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg"
                  >
                    {token.hiddenItems.map((hidden) => (
                      <button
                        key={hidden.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          hidden.onClick?.();
                        }}
                        className="w-full min-h-[38px] px-3 py-1.5 text-start text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer truncate block"
                      >
                        {hidden.label}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          }

          const { item } = token;
          const isCurrent = Boolean(item.isCurrent);
          const isClickable = !isCurrent && Boolean(item.onClick);
          const showIcon = showHomeIcon && item.isRoot;

          return (
            <li
              key={item.id}
              className={`flex items-center gap-1 sm:gap-1.5 min-w-0 ${
                isCurrent ? 'min-w-0 shrink' : 'shrink-0'
              }`}
            >
              {!isFirst && renderSeparator()}

              {isCurrent ? (
                <span
                  aria-current="page"
                  dir={item.preserveLtr ? 'ltr' : undefined}
                  className={`inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-[260px] ${
                    item.preserveLtr ? 'font-mono' : ''
                  }`}
                >
                  {showIcon && (
                    <Home
                      className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </span>
              ) : isClickable ? (
                <button
                  type="button"
                  dir={item.preserveLtr ? 'ltr' : undefined}
                  onClick={item.onClick}
                  className={`${hitHeightClass} px-1.5 -mx-0.5 rounded-lg inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-900 hover:underline underline-offset-4 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`}
                >
                  {showIcon && (
                    <Home
                      className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate max-w-[140px] sm:max-w-[190px]">
                    {item.label}
                  </span>
                </button>
              ) : (
                <span
                  dir={item.preserveLtr ? 'ltr' : undefined}
                  className="inline-flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
                >
                  {showIcon && (
                    <Home
                      className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate max-w-[140px] sm:max-w-[190px]">
                    {item.label}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
