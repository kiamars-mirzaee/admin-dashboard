import { useMemo } from 'react';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import type { OrderChannel, OrderRecord } from '../../types/admin';
import { computeOrderMetrics, formatCurrency } from '../../utils/tableLogic';
import { useI18n } from '../../i18n/I18nContext';
import { StatCard } from '../ui/StatCard';
import { ChannelBreakdownChart } from '../ui/Charts';
import { TimeSeriesAnalytics } from '../ui/TimeSeriesAnalytics';
import { Avatar } from '../ui/Avatar';
import { StatusIndicator } from '../ui/StatusIndicator';
import { Button } from '../ui/Button';

export interface OverviewViewProps {
  orders: OrderRecord[];
  onInspectOrder: (order: OrderRecord) => void;
  onViewAllOrders: () => void;
  onFilterFlagged: () => void;
}

export function OverviewView({
  orders,
  onInspectOrder,
  onViewAllOrders,
  onFilterFlagged,
}: OverviewViewProps) {
  const { t } = useI18n();

  const metrics = useMemo(() => computeOrderMetrics(orders), [orders]);

  const channelMetrics = useMemo(() => {
    const channels: OrderChannel[] = [
      'Enterprise',
      'Direct',
      'Partner',
      'Marketplace',
    ];
    return channels
      .map((channel) => {
        const matching = orders.filter(
          (o) => o.channel === channel && o.status !== 'Refunded'
        );
        return {
          channel,
          amount: matching.reduce((sum, o) => sum + o.amount, 0),
          count: matching.length,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [orders]);

  const priorityOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'Flagged' || o.status === 'Pending')
        .slice(0, 4),
    [orders]
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
            {t('overviewTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('overviewSubtitle')}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          rightIcon={<ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />}
          onClick={onViewAllOrders}
          className="self-start sm:self-auto"
        >
          {t('openLedger')}
        </Button>
      </div>

      {/* 4-Card KPI Grid */}
      <section aria-label={t('overviewTitle')} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label={t('kpiGrossVolume')}
          value={formatCurrency(metrics.totalRevenue)}
          delta="+14.2%"
          trend="up"
          context={t('kpiGrossContext')}
          sparkline={[24, 28, 26, 34, 32, 39, 44]}
          onClick={onViewAllOrders}
        />
        <StatCard
          label={t('kpiSettledRevenue')}
          value={formatCurrency(metrics.completedRevenue)}
          delta="+9.8%"
          trend="up"
          context={t('kpiSettledContext')}
          sparkline={[18, 19, 21, 20, 24, 26, 29]}
        />
        <StatCard
          label={t('kpiAverageOrder')}
          value={formatCurrency(metrics.averageOrderValue)}
          delta="+4.1%"
          trend="up"
          context={t('kpiTotalRecords', { count: orders.length })}
          sparkline={[19, 22, 20, 24, 23, 25, 26]}
        />
        <StatCard
          label={t('kpiFlaggedReview')}
          value={String(metrics.flaggedCount)}
          delta={
            metrics.flaggedCount > 0
              ? t('kpiActiveCount', { count: metrics.pendingOrProcessingCount })
              : t('kpiClear')
          }
          trend={metrics.flaggedCount > 0 ? 'up' : 'down'}
          positiveIsGood={false}
          context={t('kpiFlaggedContext')}
          onClick={onFilterFlagged}
        />
      </section>

      {/* Main Analytics Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        <div className="lg:col-span-2">
          <TimeSeriesAnalytics
            orders={orders}
            title={t('revenueVelocity')}
            subtitle={t('tsAnalyticsSubtitle')}
          />
        </div>

        <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('channelDistribution')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('channelSubtitle')}
            </p>
          </div>
          <ChannelBreakdownChart items={channelMetrics} />
        </section>
      </div>

      {/* Priority Attention Queue */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert
              className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0"
              aria-hidden="true"
            />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {t('attentionQueue')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onFilterFlagged}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t('filterFlagged')}
          </button>
        </div>

        {priorityOrders.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('attentionEmpty')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {priorityOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onInspectOrder(order)}
                className="w-full min-h-[64px] px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-start hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={order.customerAvatar}
                    name={order.customerName}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {order.customerName}
                      </span>
                      <span
                        dir="ltr"
                        className="font-mono text-xs text-slate-400 dark:text-slate-500 hidden sm:inline"
                      >
                        {order.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {order.company} · {order.planOrItem}
                    </p>
                  </div>
                </div>
                <div className="text-end shrink-0 space-y-1">
                  <div
                    dir="ltr"
                    className="text-sm font-mono font-semibold tabular-nums text-slate-900 dark:text-white"
                  >
                    {formatCurrency(order.amount)}
                  </div>
                  <div className="flex justify-end">
                    <StatusIndicator status={order.status} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
