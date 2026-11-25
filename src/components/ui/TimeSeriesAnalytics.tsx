import { useMemo, useState } from 'react';
import {
  Activity,
  AreaChart as AreaChartIcon,
  BarChart3,
  BarChart4,
  Filter,
  Layers,
  PieChart,
  RotateCcw,
} from 'lucide-react';
import type {
  DatePreset,
  OrderChannel,
  OrderRecord,
  OrderStatus,
} from '../../types/admin';
import { useI18n } from '../../i18n/I18nContext';
import { formatCurrency } from '../../utils/tableLogic';
import {
  CHART_CHANNEL_COLORS,
  type ChartMetric,
  type ChartVisualType,
  DEFAULT_TIME_SERIES_FILTERS,
  type TimeGranularity,
  type TimeSeriesFilterState,
  aggregateTimeSeries,
  buildDonutBreakdown,
  countActiveTimeSeriesFilters,
} from '../../utils/timeSeriesCharts';
import { EmptyState } from './EmptyState';
import { SegmentedControl } from './SegmentedControl';

const ALL_CHANNELS: OrderChannel[] = [
  'Enterprise',
  'Direct',
  'Partner',
  'Marketplace',
];

const ALL_STATUSES: OrderStatus[] = [
  'Completed',
  'Processing',
  'Pending',
  'Flagged',
  'Refunded',
];

export interface TimeSeriesAnalyticsProps {
  orders: OrderRecord[];
  defaultChartType?: ChartVisualType;
  height?: number;
  title?: string;
  subtitle?: string;
}

function formatMetricVal(val: number, metric: ChartMetric): string {
  if (metric === 'orders') return String(val);
  return formatCurrency(val);
}

function formatAxisTick(val: number, metric: ChartMetric): string {
  if (metric === 'orders') return String(Math.round(val));
  if (val >= 1000) {
    return val % 1000 === 0 ? `$${val / 1000}k` : `$${(val / 1000).toFixed(1)}k`;
  }
  return `$${Math.round(val)}`;
}

export function TimeSeriesAnalytics({
  orders,
  defaultChartType = 'area',
  height = 250,
  title,
  subtitle,
}: TimeSeriesAnalyticsProps) {
  const { t, tChannel, tStatus } = useI18n();
  const [chartType, setChartType] = useState<ChartVisualType>(defaultChartType);
  const [filters, setFilters] = useState<TimeSeriesFilterState>(
    DEFAULT_TIME_SERIES_FILTERS
  );
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [donutGroupBy, setDonutGroupBy] = useState<'channel' | 'status'>('channel');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoveredSliceKey, setHoveredSliceKey] = useState<string | null>(null);

  const { filteredOrders, buckets, summary } = useMemo(
    () => aggregateTimeSeries(orders, filters),
    [orders, filters]
  );

  const donutSlices = useMemo(
    () => buildDonutBreakdown(filteredOrders, donutGroupBy, filters.metric),
    [filteredOrders, donutGroupBy, filters.metric]
  );

  const activeFilterCount = countActiveTimeSeriesFilters(filters);

  const toggleChannel = (channel: OrderChannel) => {
    setHoveredIdx(null);
    setFilters((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const toggleStatus = (status: OrderStatus) => {
    setHoveredIdx(null);
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const chartTypeOptions: Array<{
    id: ChartVisualType;
    label: string;
    Icon: typeof AreaChartIcon;
  }> = [
    { id: 'area', label: t('tsTypeArea'), Icon: AreaChartIcon },
    { id: 'line', label: t('tsTypeLine'), Icon: Activity },
    { id: 'bar', label: t('tsTypeBar'), Icon: BarChart3 },
    { id: 'stacked-bar', label: t('tsTypeStacked'), Icon: Layers },
    { id: 'composed', label: t('tsTypeComposed'), Icon: BarChart4 },
    { id: 'donut', label: t('tsTypeDonut'), Icon: PieChart },
  ];

  // SVG Geometry Constants
  const vbWidth = 680;
  const vbHeight = height;
  const padLeft = 56;
  const padRight = chartType === 'composed' ? 44 : 20;
  const padTop = 20;
  const padBottom = 32;
  const plotW = vbWidth - padLeft - padRight;
  const plotH = vbHeight - padTop - padBottom;

  const maxPrimary = Math.max(
    ...buckets.map((b) =>
      filters.comparePrevious ? Math.max(b.value, b.previousValue) : b.value
    ),
    filters.metric === 'orders' ? 4 : 500
  );
  const niceMax =
    filters.metric === 'orders'
      ? Math.max(4, Math.ceil(maxPrimary / 2) * 2)
      : Math.ceil(maxPrimary / 1000) * 1000;

  const maxOrders = Math.max(...buckets.map((b) => b.orderCount), 2);
  const niceMaxOrders = Math.max(2, Math.ceil(maxOrders / 2) * 2);

  const getPointX = (idx: number) =>
    buckets.length <= 1
      ? padLeft + plotW / 2
      : padLeft + (idx / (buckets.length - 1)) * plotW;

  const getBandCenterX = (idx: number) => {
    const slotW = plotW / Math.max(1, buckets.length);
    return padLeft + slotW * idx + slotW / 2;
  };

  const getX = (idx: number) =>
    chartType === 'bar' || chartType === 'stacked-bar' || chartType === 'composed'
      ? getBandCenterX(idx)
      : getPointX(idx);

  const getY = (val: number) => padTop + plotH - (val / niceMax) * plotH;
  const getOrderY = (cnt: number) =>
    padTop + plotH - (cnt / niceMaxOrders) * plotH;

  const activeIdx =
    hoveredIdx !== null && hoveredIdx < buckets.length
      ? hoveredIdx
      : Math.max(0, buckets.length - 1);
  const activeBucket = buckets[activeIdx];

  return (
    <section
      data-testid="time-series-analytics"
      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
    >
      {/* Header Row: Title + Chart Visual Switcher */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {title ?? t('tsAnalyticsTitle')}
              </h3>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                · {t('tsMatchingOrders', { count: summary.matchingOrdersCount })}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle ?? t('tsAnalyticsSubtitle')}
            </p>
          </div>
        </div>

        {/* 6 Chart Types Selector */}
        <div
          role="tablist"
          aria-label={t('tsChartTypeLabel')}
          className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 self-start max-w-full"
        >
          {chartTypeOptions.map(({ id, label, Icon }) => {
            const selected = chartType === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                data-testid={`chart-type-${id}`}
                onClick={() => {
                  setChartType(id);
                  setHoveredIdx(null);
                }}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selected
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Time-Series Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Preset Selector */}
          <SegmentedControl
            ariaLabel={t('filterDateLabel')}
            value={filters.datePreset}
            onChange={(datePreset: DatePreset) => {
              setHoveredIdx(null);
              setFilters((prev) => ({ ...prev, datePreset }));
            }}
            options={[
              { value: 'all', label: t('all') },
              { value: '7d', label: '7D' },
              { value: '30d', label: '30D' },
              { value: '90d', label: '90D' },
              { value: 'custom', label: t('dateCustom') },
            ]}
          />

          {/* Time Granularity Selector */}
          {chartType !== 'donut' && (
            <SegmentedControl
              ariaLabel={t('tsGranularityLabel')}
              value={filters.granularity}
              onChange={(granularity: TimeGranularity) => {
                setHoveredIdx(null);
                setFilters((prev) => ({ ...prev, granularity }));
              }}
              options={[
                { value: 'day', label: t('tsGranDay') },
                { value: 'week', label: t('tsGranWeek') },
                { value: 'month', label: t('tsGranMonth') },
              ]}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <label htmlFor="ts-metric-select" className="sr-only">
            {t('tsMetricLabel')}
          </label>
          <select
            id="ts-metric-select"
            aria-label={t('tsMetricLabel')}
            value={filters.metric}
            onChange={(e) => {
              setHoveredIdx(null);
              setFilters((prev) => ({
                ...prev,
                metric: e.target.value as ChartMetric,
              }));
            }}
            className="min-h-[36px] px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="revenue">{t('tsMetricRevenue')}</option>
            <option value="settled">{t('tsMetricSettled')}</option>
            <option value="orders">{t('tsMetricOrders')}</option>
            <option value="aov">{t('tsMetricAov')}</option>
          </select>

          {/* Expand Channel/Status Filters */}
          <button
            type="button"
            onClick={() => setFiltersExpanded((v) => !v)}
            aria-expanded={filtersExpanded}
            data-testid="ts-filters-toggle-btn"
            className={`min-h-[36px] px-2.5 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              filtersExpanded || activeFilterCount > 0
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('tsFilterToggle')}</span>
            {activeFilterCount > 0 && (
              <span className="font-mono font-semibold">({activeFilterCount})</span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setHoveredIdx(null);
                setFilters(DEFAULT_TIME_SERIES_FILTERS);
              }}
              data-testid="ts-reset-filters-btn"
              className="min-h-[36px] px-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span>{t('resetFilters')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Inputs & Collapsible Channel/Status Dimension Filters */}
      {(filters.datePreset === 'custom' || filtersExpanded) && (
        <div
          data-testid="ts-filter-panel"
          className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3"
        >
          {filters.datePreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="ts-date-from"
                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  {t('tsCustomFrom')}
                </label>
                <input
                  id="ts-date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, dateFrom: e.target.value }))
                  }
                  className="min-h-[34px] px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="ts-date-to"
                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  {t('tsCustomTo')}
                </label>
                <input
                  id="ts-date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, dateTo: e.target.value }))
                  }
                  className="min-h-[34px] px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {filtersExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Channels Filter */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('tsChannelsFilter')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_CHANNELS.map((ch) => {
                    const active = filters.channels.includes(ch);
                    return (
                      <button
                        key={ch}
                        type="button"
                        aria-pressed={active}
                        data-testid={`ts-channel-filter-${ch}`}
                        onClick={() => toggleChannel(ch)}
                        className={`min-h-[30px] px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                          active
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-blue-600 dark:border-blue-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-xs shrink-0"
                          style={{ backgroundColor: CHART_CHANNEL_COLORS[ch] }}
                          aria-hidden="true"
                        />
                        <span>{tChannel(ch)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Statuses Filter + Compare Prior Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('tsStatusFilter')}
                  </span>
                  {(chartType === 'area' ||
                    chartType === 'line' ||
                    chartType === 'bar') && (
                    <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.comparePrevious}
                        onChange={(e) =>
                          setFilters((p) => ({
                            ...p,
                            comparePrevious: e.target.checked,
                          }))
                        }
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                      />
                      <span>{t('tsComparePrior')}</span>
                    </label>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_STATUSES.map((st) => {
                    const active = filters.statuses.includes(st);
                    return (
                      <button
                        key={st}
                        type="button"
                        aria-pressed={active}
                        data-testid={`ts-status-filter-${st}`}
                        onClick={() => toggleStatus(st)}
                        className={`min-h-[30px] px-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                          active
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-blue-600 dark:border-blue-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {tStatus(st)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-3 gap-3 py-2 px-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">
            {t('tsTotalLabel')}
          </span>
          <span
            dir="ltr"
            data-testid="ts-summary-total"
            className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white inline-block mt-0.5"
          >
            {formatMetricVal(summary.totalValue, filters.metric)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">
            {t('tsAvgBucketLabel')}
          </span>
          <span
            dir="ltr"
            className="font-mono text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200 inline-block mt-0.5"
          >
            {formatMetricVal(summary.averagePerBucket, filters.metric)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">
            {t('tsPeakLabel')}
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
            {summary.peakBucketLabel} ·{' '}
            <span dir="ltr" className="inline-block">
              {formatMetricVal(summary.peakBucketValue, filters.metric)}
            </span>
          </span>
        </div>
      </div>

      {/* Empty Filter State */}
      {buckets.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-5 h-5" />}
          title={t('tsNoDataTitle')}
          description={t('tsNoDataDesc')}
          actionLabel={t('resetFilters')}
          onAction={() => setFilters(DEFAULT_TIME_SERIES_FILTERS)}
        />
      ) : chartType === 'donut' ? (
        /* DONUT CHART VIEW */
        <div className="space-y-4" data-testid="chart-canvas-donut">
          <div className="flex items-center justify-between gap-2">
            <SegmentedControl
              ariaLabel={t('tsTypeDonut')}
              value={donutGroupBy}
              onChange={setDonutGroupBy}
              options={[
                { value: 'channel', label: t('tsDonutByChannel') },
                { value: 'status', label: t('tsDonutByStatus') },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="flex items-center justify-center">
              <svg
                viewBox="0 0 220 220"
                className="w-52 h-52 select-none"
                role="img"
                aria-label={t('tsTypeDonut')}
              >
                {(() => {
                  const radius = 78;
                  const circumference = 2 * Math.PI * radius;
                  const total = donutSlices.reduce((s, x) => s + x.value, 0) || 1;
                  let offset = 0;

                  return donutSlices.map((slice) => {
                    const segLen = (slice.value / total) * circumference;
                    const dashArray = `${Math.max(0, segLen - 2)} ${circumference}`;
                    const dashOffset = -offset;
                    offset += segLen;
                    const isHovered = hoveredSliceKey === slice.key;
                    const dimmed =
                      hoveredSliceKey !== null && hoveredSliceKey !== slice.key;

                    return (
                      <circle
                        key={slice.key}
                        cx="110"
                        cy="110"
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isHovered ? 28 : 22}
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90 110 110)"
                        opacity={dimmed ? 0.35 : 1}
                        className="transition-all duration-150 cursor-pointer"
                        onMouseEnter={() => setHoveredSliceKey(slice.key)}
                        onMouseLeave={() => setHoveredSliceKey(null)}
                        onClick={() =>
                          setHoveredSliceKey((prev) =>
                            prev === slice.key ? null : slice.key
                          )
                        }
                      />
                    );
                  });
                })()}
                <text
                  x="110"
                  y="104"
                  textAnchor="middle"
                  className="fill-slate-400 dark:fill-slate-500 text-[11px] font-medium"
                >
                  {hoveredSliceKey
                    ? donutGroupBy === 'channel'
                      ? tChannel(hoveredSliceKey as OrderChannel)
                      : tStatus(hoveredSliceKey as OrderStatus)
                    : t('tsTotalLabel')}
                </text>
                <text
                  x="110"
                  y="126"
                  textAnchor="middle"
                  className="fill-slate-900 dark:fill-white text-base font-mono font-bold tabular-nums"
                >
                  {formatMetricVal(
                    hoveredSliceKey
                      ? donutSlices.find((s) => s.key === hoveredSliceKey)?.value ??
                          summary.totalValue
                      : summary.totalValue,
                    filters.metric
                  )}
                </text>
              </svg>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {donutSlices.map((slice) => {
                const label =
                  donutGroupBy === 'channel'
                    ? tChannel(slice.key as OrderChannel)
                    : tStatus(slice.key as OrderStatus);
                const active = hoveredSliceKey === slice.key;
                return (
                  <button
                    key={slice.key}
                    type="button"
                    onMouseEnter={() => setHoveredSliceKey(slice.key)}
                    onMouseLeave={() => setHoveredSliceKey(null)}
                    onClick={() =>
                      setHoveredSliceKey((p) =>
                        p === slice.key ? null : slice.key
                      )
                    }
                    className={`w-full min-h-[40px] py-2 px-2 rounded-lg flex items-center justify-between gap-2 text-start cursor-pointer transition-colors ${
                      active
                        ? 'bg-slate-50 dark:bg-slate-800'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: slice.color }}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {label}
                      </span>
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        ({slice.count})
                      </span>
                    </div>
                    <div
                      dir="ltr"
                      className="flex items-center gap-3 font-mono text-xs tabular-nums shrink-0"
                    >
                      <span className="text-slate-500 dark:text-slate-400">
                        {slice.percentage}%
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatMetricVal(slice.value, filters.metric)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* TIME-SERIES COORDINATE CHARTS (Area / Line / Bar / Stacked Bar / Composed) */
        <div className="space-y-3" data-testid={`chart-canvas-${chartType}`}>
          {/* Active Point / Bucket Readout Bar */}
          {activeBucket && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
                  <span>{t('chartCurrent')}:</span>
                  <span dir="ltr" className="font-mono tabular-nums font-semibold">
                    {formatMetricVal(activeBucket.value, filters.metric)}
                  </span>
                </span>
                {filters.comparePrevious &&
                  (chartType === 'area' ||
                    chartType === 'line' ||
                    chartType === 'bar') && (
                    <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span className="w-2.5 h-0.5 bg-slate-400 dark:bg-slate-500 inline-block" />
                      <span>{t('chartPrior')}:</span>
                      <span dir="ltr" className="font-mono tabular-nums">
                        {formatMetricVal(activeBucket.previousValue, filters.metric)}
                      </span>
                    </span>
                  )}
                {chartType === 'composed' && (
                  <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                    <span className="w-2.5 h-0.5 bg-amber-500 inline-block" />
                    <span>{t('tsMetricOrders')}:</span>
                    <span dir="ltr" className="font-mono tabular-nums font-semibold">
                      {activeBucket.orderCount}
                    </span>
                  </span>
                )}
              </div>

              <div className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {activeBucket.label} ·{' '}
                {t('chartOrdersCount', { count: activeBucket.orderCount })}
              </div>
            </div>
          )}

          {/* Stacked Bar Legend */}
          {chartType === 'stacked-bar' && (
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
              {ALL_CHANNELS.map((ch) => (
                <span key={ch} className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-xs"
                    style={{ backgroundColor: CHART_CHANNEL_COLORS[ch] }}
                    aria-hidden="true"
                  />
                  <span>{tChannel(ch)}</span>
                </span>
              ))}
            </div>
          )}

          <div className="relative w-full overflow-hidden" dir="ltr">
            <svg
              viewBox={`0 0 ${vbWidth} ${vbHeight}`}
              className="w-full h-auto select-none overflow-visible"
              role="img"
              aria-label={title ?? t('tsAnalyticsTitle')}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <defs>
                <linearGradient id="kestrelTsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Y Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((tTick) => {
                const val = niceMax * tTick;
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
                      {formatAxisTick(val, filters.metric)}
                    </text>
                    {chartType === 'composed' && (
                      <text
                        x={vbWidth - padRight + 8}
                        y={y + 4}
                        textAnchor="start"
                        className="fill-amber-600 dark:fill-amber-400 text-[10px] font-mono"
                      >
                        {Math.round(niceMaxOrders * tTick)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* AREA & LINE SERIES */}
              {(chartType === 'area' || chartType === 'line') && (
                <>
                  {chartType === 'area' && buckets.length > 0 && (
                    <path
                      d={`M ${getX(0).toFixed(1)},${(padTop + plotH).toFixed(1)} ${buckets
                        .map(
                          (b, idx) =>
                            `L ${getX(idx).toFixed(1)},${getY(b.value).toFixed(1)}`
                        )
                        .join(' ')} L ${getX(buckets.length - 1).toFixed(1)},${(
                        padTop + plotH
                      ).toFixed(1)} Z`}
                      fill="url(#kestrelTsAreaGrad)"
                    />
                  )}

                  {filters.comparePrevious && buckets.length > 1 && (
                    <polyline
                      fill="none"
                      points={buckets
                        .map(
                          (b, idx) =>
                            `${getX(idx).toFixed(1)},${getY(b.previousValue).toFixed(1)}`
                        )
                        .join(' ')}
                      className="stroke-slate-400 dark:stroke-slate-600"
                      strokeWidth="1.75"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {buckets.length > 1 && (
                    <polyline
                      fill="none"
                      points={buckets
                        .map(
                          (b, idx) =>
                            `${getX(idx).toFixed(1)},${getY(b.value).toFixed(1)}`
                        )
                        .join(' ')}
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </>
              )}

              {/* BAR & COMPOSED COLUMN BARS */}
              {(chartType === 'bar' || chartType === 'composed') &&
                buckets.map((b, idx) => {
                  const slotW = plotW / Math.max(1, buckets.length);
                  const barW = Math.min(34, Math.max(10, slotW * 0.46));
                  const cx = getX(idx);
                  const topY = getY(b.value);
                  const barH = Math.max(2, padTop + plotH - topY);
                  const isActive = idx === activeIdx;

                  const prevTopY = getY(b.previousValue);
                  const prevBarH = Math.max(2, padTop + plotH - prevTopY);
                  const hasPrev =
                    chartType === 'bar' && filters.comparePrevious;

                  return (
                    <g key={b.bucketKey}>
                      {hasPrev && (
                        <rect
                          x={cx + 2}
                          y={prevTopY}
                          width={barW * 0.68}
                          height={prevBarH}
                          rx={3}
                          className="fill-slate-300/80 dark:fill-slate-700"
                        />
                      )}
                      <rect
                        x={hasPrev ? cx - barW * 0.72 : cx - barW / 2}
                        y={topY}
                        width={hasPrev ? barW * 0.72 : barW}
                        height={barH}
                        rx={4}
                        fill={isActive ? '#1D4ED8' : '#2563EB'}
                        opacity={hoveredIdx === null || isActive ? 1 : 0.78}
                      />
                    </g>
                  );
                })}

              {/* STACKED CHANNEL BARS */}
              {chartType === 'stacked-bar' &&
                buckets.map((b, idx) => {
                  const slotW = plotW / Math.max(1, buckets.length);
                  const barW = Math.min(38, Math.max(12, slotW * 0.52));
                  const cx = getX(idx);
                  const isActive = idx === activeIdx;
                  let runningY = padTop + plotH;

                  return (
                    <g key={b.bucketKey} opacity={hoveredIdx === null || isActive ? 1 : 0.75}>
                      {ALL_CHANNELS.map((ch) => {
                        const segVal = b.byChannel[ch] ?? 0;
                        if (segVal <= 0) return null;
                        const segH = (segVal / niceMax) * plotH;
                        runningY -= segH;
                        return (
                          <rect
                            key={ch}
                            x={cx - barW / 2}
                            y={runningY}
                            width={barW}
                            height={Math.max(1.5, segH)}
                            fill={CHART_CHANNEL_COLORS[ch]}
                          />
                        );
                      })}
                    </g>
                  );
                })}

              {/* COMPOSED SECONDARY LINE (ORDER COUNT) */}
              {chartType === 'composed' && buckets.length > 0 && (
                <>
                  {buckets.length > 1 && (
                    <polyline
                      fill="none"
                      points={buckets
                        .map(
                          (b, idx) =>
                            `${getX(idx).toFixed(1)},${getOrderY(b.orderCount).toFixed(1)}`
                        )
                        .join(' ')}
                      stroke="#D97706"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {buckets.map((b, idx) => (
                    <circle
                      key={`ord-pt-${b.bucketKey}`}
                      cx={getX(idx)}
                      cy={getOrderY(b.orderCount)}
                      r={idx === activeIdx ? 4.5 : 3}
                      fill="#D97706"
                      className="stroke-white dark:stroke-slate-900"
                      strokeWidth={1.5}
                    />
                  ))}
                </>
              )}

              {/* Active Crosshair */}
              {activeBucket && (
                <line
                  x1={getX(activeIdx)}
                  y1={padTop}
                  x2={getX(activeIdx)}
                  y2={padTop + plotH}
                  className="stroke-blue-500/35"
                  strokeWidth="1"
                />
              )}

              {/* X-Axis Labels, Area/Line Nodes, & Wide Hit Targets */}
              {buckets.map((b, idx) => {
                const cx = getX(idx);
                const cy = getY(b.value);
                const isActive = idx === activeIdx;
                const hitW = plotW / Math.max(buckets.length, 1);

                // Skip dense X-axis labels cleanly if > 10 points
                const showLabel =
                  buckets.length <= 9 ||
                  idx === 0 ||
                  idx === buckets.length - 1 ||
                  idx % Math.ceil(buckets.length / 7) === 0 ||
                  isActive;

                return (
                  <g key={`hit-${b.bucketKey}`}>
                    {showLabel && (
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
                        {b.label}
                      </text>
                    )}

                    {(chartType === 'area' || chartType === 'line') && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isActive ? 5 : 3.2}
                        className={
                          isActive
                            ? 'fill-blue-600 stroke-white dark:stroke-slate-900'
                            : 'fill-blue-600'
                        }
                        strokeWidth={isActive ? 2 : 0}
                      />
                    )}

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
      )}
    </section>
  );
}
