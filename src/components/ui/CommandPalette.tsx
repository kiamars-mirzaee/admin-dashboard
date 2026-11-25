import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Blocks,
  CornerDownLeft,
  ReceiptText,
  Search,
  Users,
  X,
} from 'lucide-react';
import type { CustomerProfile, OrderRecord } from '../../types/admin';
import type { NavNode } from '../../utils/navTree';
import { useI18n } from '../../i18n/I18nContext';
import {
  buildCommandPaletteItems,
  searchCommandPalette,
  splitHighlightSegments,
  type CommandCategoryFilter,
  type CommandItemType,
  type CommandPaletteItem,
} from '../../utils/commandPalette';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  customers: CustomerProfile[];
  navTree: NavNode[];
  onSelectItem: (item: CommandPaletteItem) => void;
}

function HighlightedText({
  text,
  indices,
}: {
  text: string;
  indices: number[];
}) {
  const segments = splitHighlightSegments(text, indices);
  return (
    <>
      {segments.map((seg, idx) =>
        seg.highlighted ? (
          <mark
            key={idx}
            className="bg-blue-100 dark:bg-blue-500/25 text-blue-900 dark:text-blue-200 rounded-[2px] font-semibold"
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={idx}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
}

const GROUP_ICONS: Record<CommandItemType, typeof ReceiptText> = {
  order: ReceiptText,
  customer: Users,
  section: Blocks,
};

export function CommandPalette({
  open,
  onClose,
  orders,
  customers,
  navTree,
  onSelectItem,
}: CommandPaletteProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CommandCategoryFilter>('all');
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const allItems = useMemo(
    () =>
      buildCommandPaletteItems({
        orders,
        customers,
        navTree,
        t,
      }),
    [orders, customers, navTree, t]
  );

  const searchResult = useMemo(
    () => searchCommandPalette(allItems, query, category, 6),
    [allItems, query, category]
  );

  const flatItems = searchResult.flatItems;

  useEffect(() => {
    if (open) {
      setQuery('');
      setCategory('all');
      setActiveIndex(0);
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 20);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.clearTimeout(timer);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, category]);

  useEffect(() => {
    const activeRanked = flatItems[activeIndex];
    if (!activeRanked) return;
    const el = itemRefs.current[activeRanked.item.id];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, flatItems]);

  if (!open) return null;

  const groupLabels: Record<CommandItemType, string> = {
    order: t('cmdCategoryOrders'),
    customer: t('cmdCategoryCustomers'),
    section: t('cmdCategorySections'),
  };

  const categoryTabs: Array<{ id: CommandCategoryFilter; label: string }> = [
    { id: 'all', label: t('cmdCategoryAll') },
    { id: 'order', label: t('cmdCategoryOrders') },
    { id: 'customer', label: t('cmdCategoryCustomers') },
    { id: 'section', label: t('cmdCategorySections') },
  ];

  const handleSelect = (item: CommandPaletteItem) => {
    onSelectItem(item);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }

    if (flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      const target = flatItems[activeIndex];
      if (target) {
        e.preventDefault();
        handleSelect(target.item);
      }
    }
  };

  const activeRanked = flatItems[activeIndex];
  const activeOptionDomId = activeRanked
    ? `cmd-option-${activeRanked.item.id}`
    : undefined;

  let runningFlatIdx = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-10 sm:pt-20 bg-slate-950/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={t('cmdOpenAria')}
      onKeyDown={handleKeyDown}
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        data-testid="command-palette-dialog"
        className="relative z-10 w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-2.5 px-3.5 sm:px-4 border-b border-slate-200 dark:border-slate-800">
          <Search
            className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500 shrink-0"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-listbox"
            aria-activedescendant={activeOptionDomId}
            aria-label={t('cmdSearchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('cmdSearchPlaceholder')}
            className="flex-1 min-h-[52px] bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label={t('clearAll')}
              className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="min-h-[36px] px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Category Tabs */}
        <div
          role="tablist"
          aria-label={t('cmdOpenAria')}
          className="flex items-center gap-1 px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50 overflow-x-auto"
        >
          {categoryTabs.map((tab) => {
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(tab.id)}
                className={`min-h-[34px] px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Results Listbox */}
        <div
          id="command-palette-listbox"
          role="listbox"
          className="flex-1 overflow-y-auto p-2 space-y-3"
        >
          {searchResult.groups.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {t('cmdNoResults')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('cmdNoResultsHint')}
              </p>
            </div>
          ) : (
            searchResult.groups.map((group) => {
              const GroupIcon = GROUP_ICONS[group.type];
              return (
                <div key={group.type} className="space-y-1">
                  <div className="px-2.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {groupLabels[group.type]}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((ranked) => {
                      runningFlatIdx += 1;
                      const currentIdx = runningFlatIdx;
                      const isActive = currentIdx === activeIndex;
                      const { item } = ranked;

                      return (
                        <button
                          key={item.id}
                          id={`cmd-option-${item.id}`}
                          ref={(el) => {
                            itemRefs.current[item.id] = el;
                          }}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIndex(currentIdx)}
                          onClick={() => handleSelect(item)}
                          className={`w-full min-h-[48px] px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-start transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-slate-900 dark:text-white ring-1 ring-blue-200 dark:ring-blue-800'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              <GroupIcon className="w-4 h-4" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                <HighlightedText
                                  text={item.title}
                                  indices={ranked.titleIndices}
                                />
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                <HighlightedText
                                  text={item.subtitle}
                                  indices={ranked.subtitleIndices}
                                />
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.meta && (
                              <span
                                dir="ltr"
                                className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200"
                              >
                                {item.meta}
                              </span>
                            )}
                            <ArrowUpRight
                              className={`w-4 h-4 transition-opacity rtl:-scale-x-100 ${
                                isActive
                                  ? 'text-blue-600 dark:text-blue-400 opacity-100'
                                  : 'text-slate-400 opacity-50'
                              }`}
                              aria-hidden="true"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="hidden sm:flex items-center justify-between gap-4 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <kbd
                dir="ltr"
                className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-200"
              >
                ↑↓
              </kbd>
              <span>{t('cmdFooterNav')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd
                dir="ltr"
                className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-200 inline-flex items-center"
              >
                <CornerDownLeft className="w-3 h-3" aria-hidden="true" />
              </kbd>
              <span>{t('cmdFooterSelect')}</span>
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5">
            <kbd
              dir="ltr"
              className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-200"
            >
              ESC
            </kbd>
            <span>{t('cmdFooterClose')}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
