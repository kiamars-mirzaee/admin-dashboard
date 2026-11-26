import { useState } from 'react';
import type { OrderRecord } from '../../types/admin';
import { buildActivityHeatmap, type HeatmapCell } from '../../utils/adminSuite';
import { formatCurrency } from '../../utils/tableLogic';
import { useI18n } from '../../i18n/I18nContext';

export interface HeatmapChartProps {
  orders: OrderRecord[];
  title?: string;
  subtitle?: string;
}

const LEVEL_CLASSES: Record<HeatmapCell['level'], string> = {
  0: 'bg-slate-100 dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/60',
  1: 'bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900',
  2: 'bg-blue-300 dark:bg-blue-800/80 border-blue-400/60 dark:border-blue-700',
  3: 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500',
  4: 'bg-blue-700 dark:bg-blue-400 border-blue-800 dark:border-blue-300',
};

export function HeatmapChart({
  orders,
  title,
  subtitle,
}: HeatmapChartProps) {
  const { t } = useI18n();
  const matrix = buildActivityHeatmap(orders);
  const [hovered, setHovered] = useState<HeatmapCell | null>(null);

  return (
    <section
      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
      data-testid="activity-heatmap"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {title ?? t('reportsHeatmapTitle')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle ?? t('reportsHeatmapDesc')}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span>{t('reportsLess')}</span>
          {([0, 1, 2, 3, 4] as const).map((lvl) => (
            <span
              key={lvl}
              className={`w-3.5 h-3.5 rounded-[4px] border ${LEVEL_CLASSES[lvl]}`}
            />
          ))}
          <span>{t('reportsMore')}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[460px] space-y-1.5">
          {/* Column Header */}
          <div className="grid grid-cols-[44px_repeat(8,minmax(0,1fr))] gap-1.5 items-center">
            <span />
            {matrix.weeks.map((wk) => (
              <span
                key={wk}
                dir="ltr"
                className="text-center font-mono text-[11px] text-slate-400 dark:text-slate-500"
              >
                {wk}
              </span>
            ))}
          </div>

          {/* 7 Weekday Rows */}
          {matrix.days.map((day, rIdx) => (
            <div
              key={day}
              className="grid grid-cols-[44px_repeat(8,minmax(0,1fr))] gap-1.5 items-center"
            >
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {day}
              </span>
              {matrix.weeks.map((wk, cIdx) => {
                const cell = matrix.cells.find(
                  (item) => item.row === rIdx && item.col === cIdx
                )!;
                const isActive =
                  hovered?.row === cell.row && hovered?.col === cell.col;
                return (
                  <button
                    key={`${day}-${wk}`}
                    type="button"
                    onMouseEnter={() => setHovered(cell)}
                    onFocus={() => setHovered(cell)}
                    onClick={() => setHovered(cell)}
                    aria-label={`${day} ${wk}: ${cell.count} orders (${formatCurrency(cell.volume)})`}
                    className={`h-7 rounded-lg border transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      LEVEL_CLASSES[cell.level]
                    } ${isActive ? 'ring-2 ring-slate-900 dark:ring-white scale-[1.04]' : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
        <span>
          {hovered ? (
            <>
              <strong className="text-slate-900 dark:text-white">
                {hovered.dayLabel} · {hovered.weekLabel}
              </strong>
              {' — '}
              <span className="tabular-nums">
                {hovered.count} {t('navOrders')} ({formatCurrency(hovered.volume)})
              </span>
            </>
          ) : (
            t('reportsHeatmapDesc')
          )}
        </span>
        <span dir="ltr" className="font-mono text-[11px] text-slate-500 tabular-nums">
          {matrix.totalEvents} total events
        </span>
      </div>
    </section>
  );
}
