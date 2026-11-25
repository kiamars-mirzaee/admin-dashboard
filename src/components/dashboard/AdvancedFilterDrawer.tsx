import type {
  DatePreset,
  OrderChannel,
  OrderFilters,
  OrderStatus,
} from '../../types/admin';
import { DEFAULT_ORDER_FILTERS } from '../../data/seedData';
import { useI18n } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';
import { AdaptiveDrawer } from '../ui/AdaptiveDrawer';
import { Button } from '../ui/Button';

const ALL_STATUSES: OrderStatus[] = [
  'Completed',
  'Processing',
  'Pending',
  'Flagged',
  'Refunded',
];

const ALL_CHANNELS: Array<OrderChannel | 'all'> = [
  'all',
  'Enterprise',
  'Direct',
  'Partner',
  'Marketplace',
];

const DATE_PRESETS: Array<{ value: DatePreset; labelKey: TranslationKey }> = [
  { value: 'all', labelKey: 'dateAll' },
  { value: '7d', labelKey: 'date7d' },
  { value: '30d', labelKey: 'date30d' },
  { value: '90d', labelKey: 'date90d' },
  { value: 'custom', labelKey: 'dateCustom' },
];

export interface AdvancedFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: OrderFilters;
  onChangeFilters: (next: OrderFilters) => void;
  resultCount: number;
}

export function AdvancedFilterDrawer({
  open,
  onClose,
  filters,
  onChangeFilters,
  resultCount,
}: AdvancedFilterDrawerProps) {
  const { t, tStatus, tChannel } = useI18n();
  const toggleStatus = (status: OrderStatus) => {
    const exists = filters.statuses.includes(status);
    const nextStatuses = exists
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChangeFilters({ ...filters, statuses: nextStatuses });
  };

  return (
    <AdaptiveDrawer
      open={open}
      onClose={onClose}
      title={t('filterDrawerTitle')}
      subtitle={t('filterDrawerSubtitle', { count: resultCount })}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={() => onChangeFilters(DEFAULT_ORDER_FILTERS)}
          >
            {t('resetAll')}
          </Button>
          <Button variant="primary" size="md" onClick={onClose}>
            {t('showOrdersCount', { count: resultCount })}
          </Button>
        </div>
      }
    >
      {/* Order Status Multi-Select */}
      <fieldset className="space-y-2.5">
        <legend className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {t('filterStatusLegend')}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {ALL_STATUSES.map((status) => {
            const active = filters.statuses.includes(status);
            return (
              <label
                key={status}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-sm flex items-center gap-2.5 cursor-pointer transition-colors ${
                  active
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-100'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleStatus(status)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
                <span className="truncate">{tStatus(status)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Channel Select */}
      <div className="space-y-2">
        <label
          htmlFor="filter-channel"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {t('filterChannelLabel')}
        </label>
        <select
          id="filter-channel"
          value={filters.channel}
          onChange={(e) =>
            onChangeFilters({
              ...filters,
              channel: e.target.value as OrderChannel | 'all',
            })
          }
          className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {ALL_CHANNELS.map((ch) => (
            <option key={ch} value={ch}>
              {ch === 'all' ? t('filterAllChannels') : tChannel(ch)}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range */}
      <div className="space-y-2.5">
        <label
          htmlFor="filter-date-preset"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {t('filterDateLabel')}
        </label>
        <select
          id="filter-date-preset"
          value={filters.datePreset}
          onChange={(e) =>
            onChangeFilters({
              ...filters,
              datePreset: e.target.value as DatePreset,
            })
          }
          className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {t(p.labelKey)}
            </option>
          ))}
        </select>

        {filters.datePreset === 'custom' && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label
                htmlFor="filter-date-from"
                className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
              >
                {t('dateFrom')}
              </label>
              <input
                id="filter-date-from"
                type="date"
                dir="ltr"
                value={filters.dateFrom}
                onChange={(e) =>
                  onChangeFilters({ ...filters, dateFrom: e.target.value })
                }
                className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label
                htmlFor="filter-date-to"
                className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
              >
                {t('dateTo')}
              </label>
              <input
                id="filter-date-to"
                type="date"
                dir="ltr"
                value={filters.dateTo}
                onChange={(e) =>
                  onChangeFilters({ ...filters, dateTo: e.target.value })
                }
                className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Amount Range */}
      <div className="space-y-2">
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {t('orderValueLabel')}
        </span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="filter-min-amount"
              className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
            >
              {t('minAmount')}
            </label>
            <input
              id="filter-min-amount"
              type="number"
              dir="ltr"
              min="0"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) =>
                onChangeFilters({ ...filters, minAmount: e.target.value })
              }
              className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label
              htmlFor="filter-max-amount"
              className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
            >
              {t('maxAmount')}
            </label>
            <input
              id="filter-max-amount"
              type="number"
              dir="ltr"
              min="0"
              placeholder="∞"
              value={filters.maxAmount}
              onChange={(e) =>
                onChangeFilters({ ...filters, maxAmount: e.target.value })
              }
              className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>
    </AdaptiveDrawer>
  );
}
