import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react';
import type { SortConfig, SortField } from '../../types/admin';
import { useI18n } from '../../i18n/I18nContext';
import { TableSkeleton } from './Skeleton';

export interface TableColumn<T> {
  key: string;
  label: string;
  sortField?: SortField;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
}

export interface AdaptiveDataTableProps<T extends { id: string }> {
  data: T[];
  columns: TableColumn<T>[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRowClick: (row: T) => void;
  sortConfig?: SortConfig;
  onSort?: (field: SortField) => void;
  renderMobileCard: (row: T, isSelected: boolean) => React.ReactNode;
  loading?: boolean;
  emptyState?: React.ReactNode;
  itemLabel?: string;
}

export function AdaptiveDataTable<T extends { id: string }>({
  data,
  columns,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
  sortConfig,
  onSort,
  renderMobileCard,
  loading = false,
  emptyState,
  itemLabel = 'record',
}: AdaptiveDataTableProps<T>) {
  const { t } = useI18n();

  if (loading) {
    return <TableSkeleton rows={6} />;
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const allSelected =
    data.length > 0 && data.every((row) => selectedIds.includes(row.id));

  return (
    <div>
      {/* Mobile View (< md): 2026 Tactile Card Rows */}
      <div className="md:hidden space-y-3" data-testid="mobile-card-list">
        <div className="flex items-center justify-between px-1">
          <label className="inline-flex items-center gap-2.5 min-h-[44px] text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleSelectAll}
              aria-label={t('selectAllOnPage', { count: data.length })}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 cursor-pointer"
            />
            <span>{t('selectAllOnPage', { count: data.length })}</span>
          </label>
        </div>

        {data.map((row) => {
          const isSelected = selectedIds.includes(row.id);
          return (
            <article
              key={row.id}
              data-testid="mobile-row-card"
              className={`rounded-2xl bg-white dark:bg-slate-900 border transition-colors p-4 ${
                isSelected
                  ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(row.id)}
                    aria-label={`Select ${itemLabel} ${row.id}`}
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {renderMobileCard(row, isSelected)}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onRowClick(row)}
                      aria-label={`Inspect ${itemLabel} ${row.id}`}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{t('inspectDetails')}</span>
                      <ChevronRight
                        className="w-3.5 h-3.5 rtl:rotate-180"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Desktop View (md+): High-Density Interactive Table */}
      <div
        className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
        data-testid="desktop-data-table"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
                <th className="w-11 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    aria-label={t('selectAllOnPage', { count: data.length })}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                </th>
                {columns.map((col) => {
                  const isSorted =
                    col.sortField && sortConfig?.field === col.sortField;
                  const alignClass =
                    col.align === 'right' ? 'text-end' : 'text-start';

                  return (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap ${alignClass}`}
                    >
                      {col.sortField && onSort ? (
                        <button
                          type="button"
                          onClick={() => onSort(col.sortField!)}
                          className={`inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded ${
                            col.align === 'right' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <span>{col.label}</span>
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  );
                })}
                <th className="w-12 px-4 py-3 text-end">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {data.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-950/20'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(row.id)}
                        aria-label={`Select ${itemLabel} ${row.id}`}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 cursor-pointer"
                      />
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-200 ${
                          col.align === 'right' ? 'text-end' : 'text-start'
                        }`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-end">
                      <button
                        type="button"
                        onClick={() => onRowClick(row)}
                        aria-label={`Inspect ${itemLabel} ${row.id}`}
                        className="min-h-[34px] min-w-[34px] rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ChevronRight
                          className="w-4 h-4 rtl:rotate-180"
                          aria-hidden="true"
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
