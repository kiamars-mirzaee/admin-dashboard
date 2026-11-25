import { useState } from 'react';
import type { OrderChannel, RevenueSeriesPoint } from '../../types/admin';
import { useI18n } from '../../i18n/I18nContext';
import { formatCurrency } from '../../utils/tableLogic';

export interface RevenueAreaChartProps {
  data: RevenueSeriesPoint[];
  height?: number;
}

export function RevenueAreaChart({ data, height = 220 }: RevenueAreaChartProps) {
  const { t } = useI18n();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) return null;

  const vbWidth = 640;
  const vbHeight = height;
  const padLeft = 52;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 30;
  const plotW = vbWidth - padLeft - padRight;
  const plotH = vbHeight - padTop - padBottom;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.revenue, d.previousRevenue)),
    100
  );
  const niceMax = Math.ceil(maxVal / 1000) * 1000;

  const getX = (idx: number) =>
    data.length === 1
      ? padLeft + plotW / 2
      : padLeft + (idx / (data.length - 1)) * plotW;

  const getY = (val: number) =>
    padTop + plotH - (val / niceMax) * plotH;

  const currentLinePoints = data
    .map((d, idx) => `${getX(idx).toFixed(1)},${getY(d.revenue).toFixed(1)}`)
    .join(' ');

  const prevLinePoints = data
    .map(
      (d, idx) =>
        `${getX(idx).toFixed(1)},${getY(d.previousRevenue).toFixed(1)}`
    )
    .join(' ');

  const areaPath = `M ${getX(0).toFixed(1)},${(padTop + plotH).toFixed(1)} ${data
    .map((d, idx) => `L ${getX(idx).toFixed(1)},${getY(d.revenue).toFixed(1)}`)
    .join(' ')} L ${getX(data.length - 1).toFixed(1)},${(padTop + plotH).toFixed(1)} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const activePoint = hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];
  const activeIndex = hoveredIdx !== null ? hoveredIdx : data.length - 1;

  return (
    <div className="space-y-3">
      {/* Live interactive readout bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
            <span>{t('chartCurrent')}:</span>
            <span dir="ltr" className="font-mono tabular-nums font-semibold">
              {formatCurrency(activePoint.revenue)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-0.5 bg-slate-400 dark:bg-slate-500 inline-block" />
            <span>{t('chartPrior')}:</span>
            <span dir="ltr" className="font-mono tabular-nums">
              {formatCurrency(activePoint.previousRevenue)}
            </span>
          </span>
        </div>
        <div className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          {activePoint.label} · {t('chartOrdersCount', { count: activePoint.orders })}
        </div>
      </div>

      <div className="relative w-full overflow-hidden" dir="ltr">
        <svg
          viewBox={`0 0 ${vbWidth} ${vbHeight}`}
          className="w-full h-auto select-none overflow-visible"
          role="img"
          aria-label={t('revenueVelocity')}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="kestrelRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines & Y-axis labels */}
          {yTicks.map((tTick) => {
            const val = Math.round(niceMax * tTick);
            const y = getY(val);
            return (
              <g key={tTick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={vbWidth - padRight}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeDasharray={tTick === 0 ? undefined : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
                >
                  {val >= 1000
                    ? val % 1000 === 0
                      ? `$${val / 1000}k`
                      : `$${(val / 1000).toFixed(1)}k`
                    : `$${val}`}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#kestrelRevGrad)" />

          {/* Prior period dashed line */}
          <polyline
            fill="none"
            points={prevLinePoints}
            className="stroke-slate-400 dark:stroke-slate-600"
            strokeWidth="1.75"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current period primary line */}
          <polyline
            fill="none"
            points={currentLinePoints}
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active vertical crosshair */}
          <line
            x1={getX(activeIndex)}
            y1={padTop}
            x2={getX(activeIndex)}
            y2={padTop + plotH}
            className="stroke-blue-500/40"
            strokeWidth="1"
          />

          {/* Data points & wide hit targets */}
          {data.map((d, idx) => {
            const cx = getX(idx);
            const cy = getY(d.revenue);
            const isActive = idx === activeIndex;
            const hitW = plotW / Math.max(data.length, 1);
            return (
              <g key={d.label}>
                <text
                  x={cx}
                  y={vbHeight - 8}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${
                    isActive
                      ? 'fill-slate-900 dark:fill-white font-semibold'
                      : 'fill-slate-400 dark:fill-slate-500'
                  }`}
                >
                  {d.label}
                </text>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isActive ? 5 : 3}
                  className={
                    isActive
                      ? 'fill-blue-600 stroke-white dark:stroke-slate-900'
                      : 'fill-blue-600'
                  }
                  strokeWidth={isActive ? 2 : 0}
                />
                <rect
                  x={cx - hitW / 2}
                  y={padTop}
                  width={hitW}
                  height={plotH + padBottom}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onClick={() => setHoveredIdx(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export interface ChannelMetric {
  channel: OrderChannel;
  amount: number;
  count: number;
}

const CHANNEL_COLORS: Record<OrderChannel, string> = {
  Enterprise: '#2563EB',
  Direct: '#0F766E',
  Partner: '#D97706',
  Marketplace: '#64748B',
};

export function ChannelBreakdownChart({ items }: { items: ChannelMetric[] }) {
  const { t, tChannel } = useI18n();
  const [activeChannel, setActiveChannel] = useState<OrderChannel | null>(null);
  const total = items.reduce((sum, i) => sum + i.amount, 0) || 1;

  return (
    <div className="space-y-4">
      {/* Stacked horizontal proportion bar */}
      <div
        className="h-3.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex"
        role="img"
        aria-label={t('channelDistribution')}
      >
        {items.map((item) => {
          const pct = (item.amount / total) * 100;
          const dimmed = activeChannel && activeChannel !== item.channel;
          return (
            <div
              key={item.channel}
              style={{
                width: `${pct}%`,
                backgroundColor: CHANNEL_COLORS[item.channel],
                opacity: dimmed ? 0.35 : 1,
              }}
              className="h-full transition-opacity duration-150"
              title={`${tChannel(item.channel)}: ${formatCurrency(item.amount)}`}
            />
          );
        })}
      </div>

      {/* Interactive Breakdown List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => {
          const pct = Math.round((item.amount / total) * 100);
          const isHighlighted = activeChannel === item.channel;
          return (
            <button
              key={item.channel}
              type="button"
              onMouseEnter={() => setActiveChannel(item.channel)}
              onMouseLeave={() => setActiveChannel(null)}
              onClick={() =>
                setActiveChannel((prev) =>
                  prev === item.channel ? null : item.channel
                )
              }
              className={`w-full min-h-[44px] py-2.5 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 text-start transition-colors cursor-pointer ${
                isHighlighted
                  ? 'bg-slate-50 dark:bg-slate-800/70'
                  : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: CHANNEL_COLORS[item.channel] }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {tChannel(item.channel)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                  ({item.count})
                </span>
              </div>
              <div dir="ltr" className="flex items-center gap-3 shrink-0 font-mono tabular-nums text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {pct}%
                </span>
                <span className="font-semibold text-slate-900 dark:text-white w-18 text-right">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
