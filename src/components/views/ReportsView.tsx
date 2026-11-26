import { useMemo, useState } from 'react';
import { Download, FileDown, Loader2 } from 'lucide-react';
import type { OrderChannel, OrderRecord } from '../../types/admin';
import { exportDataGridToPdf } from '../../services/pdfExportService';
import { buildPrintableColumns } from '../../utils/printExport';
import { ORDERS_COLUMNS_SCHEMA } from '../../utils/dataGridEngine';
import { formatCurrency } from '../../utils/tableLogic';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../ui/Button';
import { HeatmapChart } from '../ui/HeatmapChart';
import { useNotifications } from '../ui/NotificationSystem';
import { SegmentedControl } from '../ui/SegmentedControl';
import { StatCard } from '../ui/StatCard';
import { TimeSeriesAnalytics } from '../ui/TimeSeriesAnalytics';

export interface ReportsViewProps {
  orders: OrderRecord[];
}

export function ReportsView({ orders }: ReportsViewProps) {
  const { t, tStatus, tChannel, dir } = useI18n();
  const { addToast } = useNotifications();
  const [channelFilter, setChannelFilter] = useState<'all' | OrderChannel>('all');
  const [exportingPdf, setExportingPdf] = useState(false);

  const scopedOrders = useMemo(() => {
    if (channelFilter === 'all') return orders;
    return orders.filter((o) => o.channel === channelFilter);
  }, [orders, channelFilter]);

  const metrics = useMemo(() => {
    const gross = scopedOrders.reduce((s, o) => s + o.amount, 0);
    const settled = scopedOrders
      .filter((o) => o.status === 'Completed')
      .reduce((s, o) => s + o.amount, 0);
    const avg = scopedOrders.length > 0 ? Math.round(gross / scopedOrders.length) : 0;
    const completionRate =
      scopedOrders.length > 0
        ? Math.round(
            (scopedOrders.filter((o) => o.status === 'Completed').length /
              scopedOrders.length) *
              100
          )
        : 0;
    return { gross, settled, avg, completionRate };
  }, [scopedOrders]);

  const channelSummary = useMemo(() => {
    const map = new Map<OrderChannel, { count: number; total: number; settled: number }>();
    for (const o of orders) {
      const prev = map.get(o.channel) ?? { count: 0, total: 0, settled: 0 };
      prev.count += 1;
      prev.total += o.amount;
      if (o.status === 'Completed') prev.settled += o.amount;
      map.set(o.channel, prev);
    }
    return Array.from(map.entries()).map(([channel, stats]) => ({
      channel,
      ...stats,
      share: orders.length > 0 ? Math.round((stats.count / orders.length) * 100) : 0,
    }));
  }, [orders]);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const cols = buildPrintableColumns(ORDERS_COLUMNS_SCHEMA, [
        'id',
        'customerName',
        'planOrItem',
        'channel',
        'status',
        'date',
        'amount',
      ]);
      const res = await exportDataGridToPdf(
        {
          rows: scopedOrders.map((o) => ({
            ...o,
            numericCode: Number(o.id.replace(/\D+/g, '')) || 0,
            seatsCount: 1,
            cutoverAt: `${o.date}T12:00`,
            updatedBy: 'Elena Rostova',
          })),
          columns: cols,
          filterChips:
            channelFilter === 'all'
              ? []
              : [{ label: `${t('channelLabel')}: ${tChannel(channelFilter)}` }],
          scopeLabel: `${t('reportsTitle')} (${scopedOrders.length})`,
        },
        {
          brandName: t('brandName'),
          title: t('reportsTitle'),
          noFiltersLabel: t('printNoFilters'),
          activeFiltersLabel: t('printActiveFilters'),
          generatedLabel: t('printGeneratedAt'),
          recordsLabel: t('printSummaryCount'),
          grossVolumeLabel: t('kpiGrossVolume'),
          settledLabel: t('kpiSettledRevenue'),
          averageOrderLabel: t('kpiAverageOrder'),
          totalLabel: t('printSummaryTotal'),
          rtl: dir === 'rtl',
          statusLabel: tStatus,
          channelLabel: tChannel,
        }
      );
      addToast({
        title: t('pdfExportSuccessToast', { filename: res.filename }),
        variant: 'success',
      });
    } catch {
      addToast({ title: t('pdfExportErrorToast'), variant: 'error' });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="reports-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('reportsTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('reportsSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            ariaLabel={t('channelLabel')}
            value={channelFilter}
            onChange={setChannelFilter}
            options={[
              { value: 'all', label: t('all') },
              { value: 'Enterprise', label: tChannel('Enterprise') },
              { value: 'Direct', label: tChannel('Direct') },
              { value: 'Partner', label: tChannel('Partner') },
              { value: 'Marketplace', label: tChannel('Marketplace') },
            ]}
          />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={
              exportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )
            }
            disabled={scopedOrders.length === 0 || exportingPdf}
            onClick={() => void handleExportPdf()}
          >
            {exportingPdf ? t('pdfExporting') : t('pdfExportBtn')}
          </Button>
          <a
            href="/api/orders/export?scope=all-rows"
            download="kestrel-reports-ledger.csv"
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('exportCsv')}</span>
          </a>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label={t('kpiGrossVolume')}
          value={formatCurrency(metrics.gross)}
          delta="+14.2%"
          trend="up"
          context={`${scopedOrders.length} orders`}
          sparkline={[42, 48, 45, 58, 63, 74]}
        />
        <StatCard
          label={t('kpiSettledRevenue')}
          value={formatCurrency(metrics.settled)}
          delta="+9.8%"
          trend="up"
          context={`${metrics.completionRate}% cleared`}
          sparkline={[30, 34, 38, 41, 49, 55]}
        />
        <StatCard
          label={t('kpiAverageOrder')}
          value={formatCurrency(metrics.avg)}
          delta="+3.1%"
          trend="up"
          context={t('date30d')}
          sparkline={[18, 21, 19, 24, 22, 26]}
        />
        <StatCard
          label={t('kpiFlaggedReview')}
          value={String(scopedOrders.filter((o) => o.status === 'Flagged').length)}
          delta="-18%"
          trend="down"
          positiveIsGood
          context={t('kpiFlaggedContext')}
          sparkline={[5, 4, 4, 3, 2, 2]}
        />
      </div>

      {/* Time Series + Activity Heatmap */}
      <TimeSeriesAnalytics orders={scopedOrders} defaultChartType="bar" />
      <HeatmapChart orders={scopedOrders} />

      {/* Channel Performance Breakdown */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {t('channelDistribution')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3 text-start">{t('channelLabel')}</th>
                <th className="px-5 py-3 text-end">{t('navOrders')}</th>
                <th className="px-5 py-3 text-end">Share</th>
                <th className="px-5 py-3 text-end">{t('kpiSettledRevenue')}</th>
                <th className="px-5 py-3 text-end">{t('kpiGrossVolume')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {channelSummary.map((row) => (
                <tr key={row.channel} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {tChannel(row.channel)}
                  </td>
                  <td dir="ltr" className="px-5 py-3 text-end font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {row.count}
                  </td>
                  <td dir="ltr" className="px-5 py-3 text-end font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {row.share}%
                  </td>
                  <td dir="ltr" className="px-5 py-3 text-end font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(row.settled)}
                  </td>
                  <td dir="ltr" className="px-5 py-3 text-end font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
