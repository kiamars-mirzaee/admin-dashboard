import { useState } from 'react';
import type { GridColumnSchema, GridOrderRow } from '../../types/dataGrid';
import { useI18n } from '../../i18n/I18nContext';
import { formatCurrency } from '../../utils/tableLogic';
import {
  buildPrintableFilterSummary,
  computePrintableGridSummary,
  formatPrintableCellValue,
  formatPrintTimestamp,
} from '../../utils/printExport';
import { StatusIndicator } from '../ui/StatusIndicator';

export interface DataGridPrintSheetProps {
  rows: GridOrderRow[];
  columns: GridColumnSchema[];
  filterChips: Array<{ key: string; label: string }>;
  scopeLabel: string;
}

export function DataGridPrintSheet({
  rows,
  columns,
  filterChips,
  scopeLabel,
}: DataGridPrintSheetProps) {
  const { t, tStatus, tChannel, dir } = useI18n();
  const [generatedAt] = useState(() => formatPrintTimestamp(new Date()));

  const summary = computePrintableGridSummary(rows);
  const filterSummaryText = buildPrintableFilterSummary(
    filterChips,
    t('printNoFilters')
  );
  const hasAmountColumn = columns.some((c) => c.key === 'amount');

  return (
    <article
      dir={dir}
      data-testid="grid-print-sheet"
      className="print-sheet bg-white text-slate-900 border border-slate-200 rounded-xl p-5 sm:p-7 shadow-sm space-y-5"
    >
      {/* Document Header */}
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-300">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-display font-bold text-xs shrink-0">
              K
            </div>
            <span className="font-display font-bold text-sm tracking-tight text-slate-900">
              {t('brandName')}
            </span>
          </div>
          <h1 className="font-display text-lg font-bold tracking-tight text-slate-900">
            {t('printGridDocTitle')}
          </h1>
          <p className="text-xs text-slate-600">
            <span className="font-medium text-slate-700">
              {t('printActiveFilters')}:
            </span>{' '}
            <span>{filterSummaryText}</span>
          </p>
        </div>

        <div className="text-start sm:text-end space-y-1 text-xs text-slate-600 shrink-0">
          <p className="font-semibold text-slate-900">{scopeLabel}</p>
          <p className="tabular-nums">
            {t('printGeneratedAt')}:{' '}
            <span dir="ltr" className="font-mono text-slate-800">
              {generatedAt}
            </span>
          </p>
        </div>
      </header>

      {/* Executive Summary Metrics Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-b border-slate-200 print-avoid-break">
        <div>
          <p className="text-[11px] font-medium text-slate-500">
            {t('printSummaryCount')}
          </p>
          <p className="font-mono text-base font-bold tabular-nums text-slate-900 mt-0.5">
            <span dir="ltr" className="inline-block">{summary.count}</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500">
            {t('kpiGrossVolume')}
          </p>
          <p className="font-mono text-base font-bold tabular-nums text-slate-900 mt-0.5">
            <span dir="ltr" className="inline-block">{formatCurrency(summary.grossVolume)}</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500">
            {t('kpiSettledRevenue')}
          </p>
          <p className="font-mono text-base font-bold tabular-nums text-slate-900 mt-0.5">
            <span dir="ltr" className="inline-block">{formatCurrency(summary.settledRevenue)}</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500">
            {t('kpiAverageOrder')}
          </p>
          <p className="font-mono text-base font-bold tabular-nums text-slate-900 mt-0.5">
            <span dir="ltr" className="inline-block">{formatCurrency(summary.averageOrder)}</span>
          </p>
        </div>
      </section>

      {/* Full Unclipped Ledger Table */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse text-start text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-900 bg-slate-50 text-[11px] font-semibold text-slate-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-2 px-2 whitespace-nowrap ${
                    col.align === 'right' ? 'text-end' : 'text-start'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                {columns.map((col) => {
                  const textVal = formatPrintableCellValue(row, col, {
                    statusLabel: tStatus,
                    channelLabel: tChannel,
                  });

                  if (col.type === 'id') {
                    return (
                      <td
                        key={col.key}
                        className="py-2 px-2 font-mono font-semibold text-slate-900 whitespace-nowrap text-start"
                      >
                        <span dir="ltr" className="inline-block">{row.id}</span>
                      </td>
                    );
                  }

                  if (col.type === 'status') {
                    return (
                      <td key={col.key} className="py-2 px-2 whitespace-nowrap text-slate-900">
                        <StatusIndicator status={row.status} forceLight />
                      </td>
                    );
                  }

                  if (col.type === 'currency' || col.type === 'number') {
                    return (
                      <td
                        key={col.key}
                        className={`py-2 px-2 font-mono tabular-nums whitespace-nowrap text-slate-900 ${
                          col.align === 'right' ? 'text-end font-semibold' : 'text-start'
                        }`}
                      >
                        <span dir="ltr" className="inline-block">{textVal}</span>
                      </td>
                    );
                  }

                  if (col.type === 'date' || col.type === 'datetime') {
                    return (
                      <td
                        key={col.key}
                        className="py-2 px-2 font-mono tabular-nums whitespace-nowrap text-slate-700 text-start"
                      >
                        <span dir="ltr" className="inline-block">{textVal}</span>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={col.key}
                      className={`py-2 px-2 text-slate-800 whitespace-normal break-words ${
                        col.align === 'right' ? 'text-end' : 'text-start'
                      }`}
                    >
                      {textVal}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

          {hasAmountColumn && rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-900 font-semibold text-slate-900 bg-slate-50/70">
                <td colSpan={Math.max(1, columns.length - 1)} className="py-2.5 px-2.5 text-end text-xs">
                  {t('printSummaryTotal')} ({summary.count})
                </td>
                <td className="py-2.5 px-2.5 text-end font-mono font-bold tabular-nums">
                  <span dir="ltr" className="inline-block">{formatCurrency(summary.grossVolume)}</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </article>
  );
}
