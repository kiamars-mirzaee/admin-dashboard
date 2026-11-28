import { useMemo, useState } from 'react';
import { Pin, PinOff, Printer, Search } from 'lucide-react';
import type { CustomerProfile, OrderRecord } from '../../types/admin';
import { INITIAL_CUSTOMERS } from '../../data/seedData';
import { formatCurrency } from '../../utils/tableLogic';
import { useI18n } from '../../i18n/I18nContext';
import { PrintViewBanner } from '../print/AutoPrintStyles';
import { AdaptiveDataTable, type TableColumn } from '../ui/AdaptiveDataTable';
import { AdaptiveDrawer } from '../ui/AdaptiveDrawer';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { SegmentedControl } from '../ui/SegmentedControl';
import { StatusIndicator } from '../ui/StatusIndicator';

export type CustomerFilterMode = 'all' | 'Enterprise' | 'Growth' | 'risk';

export interface CustomersViewProps {
  orders: OrderRecord[];
  onInspectOrder: (order: OrderRecord) => void;
  filterMode?: CustomerFilterMode;
  onChangeFilterMode?: (mode: CustomerFilterMode) => void;
  inspectedCustomerId?: string | null;
  onInspectCustomerChange?: (customerId: string | null) => void;
  isCustomerPinned?: (customerId: string) => boolean;
  onTogglePinCustomer?: (customer: CustomerProfile) => void;
}

export function CustomersView({
  orders,
  onInspectOrder,
  filterMode = 'all',
  onChangeFilterMode,
  inspectedCustomerId,
  onInspectCustomerChange,
  isCustomerPinned,
  onTogglePinCustomer,
}: CustomersViewProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [internalFilter, setInternalFilter] =
    useState<CustomerFilterMode>(filterMode);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [internalCustomerId, setInternalCustomerId] = useState<string | null>(null);

  const isControlledInspect = inspectedCustomerId !== undefined;
  const resolvedCustomerId = isControlledInspect
    ? inspectedCustomerId
    : internalCustomerId;

  const setActiveCustomer = (customer: CustomerProfile | null) => {
    const nextId = customer ? customer.id : null;
    if (onInspectCustomerChange) {
      onInspectCustomerChange(nextId);
    } else {
      setInternalCustomerId(nextId);
    }
  };

  const activeCustomer = useMemo(
    () =>
      resolvedCustomerId
        ? INITIAL_CUSTOMERS.find((c) => c.id === resolvedCustomerId) ?? null
        : null,
    [resolvedCustomerId]
  );

  const activeFilter = onChangeFilterMode ? filterMode : internalFilter;
  const setActiveFilter = onChangeFilterMode ?? setInternalFilter;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return INITIAL_CUSTOMERS.filter((c) => {
      if (activeFilter === 'Enterprise' && c.tier !== 'Enterprise') return false;
      if (activeFilter === 'Growth' && c.tier !== 'Growth') return false;
      if (activeFilter === 'risk' && c.healthStatus === 'Healthy') return false;
      if (!q) return true;
      return `${c.name} ${c.company} ${c.email} ${c.location}`
        .toLowerCase()
        .includes(q);
    });
  }, [search, activeFilter]);

  const customerOrders = useMemo(() => {
    if (!activeCustomer) return [];
    return orders.filter(
      (o) =>
        o.customerEmail.toLowerCase() === activeCustomer.email.toLowerCase() ||
        o.company.toLowerCase() === activeCustomer.company.toLowerCase()
    );
  }, [activeCustomer, orders]);

  const columns: TableColumn<CustomerProfile>[] = [
    {
      key: 'name',
      label: t('colCustomer'),
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={row.avatar} name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-white truncate">
              {row.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      label: t('colOrganization'),
      render: (row) => (
        <div>
          <p className="text-sm text-slate-800 dark:text-slate-200">
            {row.company}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {row.tier === 'Enterprise' ? t('tierEnterprise') : t('tierGrowth')} ·{' '}
            {row.location}
          </p>
        </div>
      ),
    },
    {
      key: 'healthStatus',
      label: t('colHealth'),
      render: (row) => <StatusIndicator status={row.healthStatus} />,
    },
    {
      key: 'orderCount',
      label: t('colOrdersCount'),
      align: 'right',
      render: (row) => (
        <span
          dir="ltr"
          className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300 inline-block"
        >
          {row.orderCount}
        </span>
      ),
    },
    {
      key: 'totalSpend',
      label: t('colLifetimeSpend'),
      align: 'right',
      render: (row) => (
        <span
          dir="ltr"
          className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white inline-block"
        >
          {formatCurrency(row.totalSpend)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('customersTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('customersSubtitle')}
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Printer className="w-3.5 h-3.5" />}
          onClick={() => window.print()}
          data-testid="customers-print-btn"
        >
          {t('printBtn')}
        </Button>
      </div>

      <div
        data-print-controls="true"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchCustomersPlaceholder')}
            aria-label={t('searchCustomersPlaceholder')}
            className="w-full min-h-[44px] ps-10 pe-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <SegmentedControl
          ariaLabel={t('customersTitle')}
          value={activeFilter}
          onChange={setActiveFilter}
          options={[
            { value: 'all', label: t('allTiers'), count: INITIAL_CUSTOMERS.length },
            {
              value: 'Enterprise',
              label: t('tierEnterprise'),
              count: INITIAL_CUSTOMERS.filter((c) => c.tier === 'Enterprise')
                .length,
            },
            {
              value: 'Growth',
              label: t('tierGrowth'),
              count: INITIAL_CUSTOMERS.filter((c) => c.tier === 'Growth').length,
            },
            {
              value: 'risk',
              label: t('needsAttention'),
              count: INITIAL_CUSTOMERS.filter((c) => c.healthStatus !== 'Healthy')
                .length,
            },
          ]}
        />
      </div>

      <AdaptiveDataTable
        data={filtered}
        columns={columns}
        selectedIds={selectedIds}
        onToggleSelect={(id) =>
          setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
          )
        }
        onToggleSelectAll={() => {
          const allSelected =
            filtered.length > 0 &&
            filtered.every((c) => selectedIds.includes(c.id));
          setSelectedIds(allSelected ? [] : filtered.map((c) => c.id));
        }}
        onRowClick={setActiveCustomer}
        itemLabel="customer"
        emptyState={
          <EmptyState
            icon={<Search className="w-5 h-5" />}
            title={t('noCustomersFound')}
            description={t('noCustomersDesc')}
            actionLabel={t('resetFilters')}
            onAction={() => {
              setSearch('');
              setActiveFilter('all');
            }}
          />
        }
        renderMobileCard={(row) => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar src={row.avatar} name={row.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {row.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {row.company} · {row.role}
                  </p>
                </div>
              </div>
              <span
                dir="ltr"
                className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white shrink-0"
              >
                {formatCurrency(row.totalSpend)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>
                {row.tier === 'Enterprise' ? t('tierEnterprise') : t('tierGrowth')}{' '}
                · {row.orderCount} · {row.location}
              </span>
              <StatusIndicator status={row.healthStatus} />
            </div>
          </div>
        )}
      />

      <AdaptiveDrawer
        open={Boolean(activeCustomer)}
        onClose={() => setActiveCustomer(null)}
        title={activeCustomer?.name ?? t('colCustomer')}
        subtitle={
          activeCustomer
            ? `${activeCustomer.company} · ${
                activeCustomer.tier === 'Enterprise'
                  ? t('tierEnterprise')
                  : t('tierGrowth')
              }`
            : undefined
        }
        footer={
          <div className="flex items-center justify-between gap-2">
            <div>
              {activeCustomer && onTogglePinCustomer && (
                <Button
                  variant={
                    isCustomerPinned?.(activeCustomer.id)
                      ? 'primary'
                      : 'secondary'
                  }
                  size="md"
                  leftIcon={
                    isCustomerPinned?.(activeCustomer.id) ? (
                      <PinOff className="w-4 h-4" />
                    ) : (
                      <Pin className="w-4 h-4" />
                    )
                  }
                  onClick={() => onTogglePinCustomer(activeCustomer)}
                  aria-pressed={Boolean(isCustomerPinned?.(activeCustomer.id))}
                  data-testid="customer-drawer-pin-btn"
                >
                  {isCustomerPinned?.(activeCustomer.id)
                    ? t('favUnpinCustomer')
                    : t('favPinCustomer')}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
                data-testid="customer-detail-print-btn"
              >
                {t('printBtn')}
              </Button>
              <Button variant="secondary" onClick={() => setActiveCustomer(null)}>
                {t('close')}
              </Button>
            </div>
          </div>
        }
      >
        {activeCustomer && (
          <div className="space-y-5">
            <PrintViewBanner
              brandName={t('brandName')}
              title={activeCustomer.name}
              subtitle={`${activeCustomer.company} · ${activeCustomer.role} · ${activeCustomer.location}`}
              metaLabel={activeCustomer.id}
              testId="customer-drawer-print-banner"
            />
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Avatar
                src={activeCustomer.avatar}
                name={activeCustomer.name}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {activeCustomer.role}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {activeCustomer.email}
                </p>
                <div className="mt-1">
                  <StatusIndicator status={activeCustomer.healthStatus} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('colLifetimeSpend')}
                </span>
                <p
                  dir="ltr"
                  className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 text-start"
                >
                  {formatCurrency(activeCustomer.totalSpend)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('colOrdersCount')}
                </span>
                <p className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {activeCustomer.orderCount}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('recentLinkedOrders', { count: customerOrders.length })}
              </h3>
              {customerOrders.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('noLinkedOrders')}
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerOrders.map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      data-print-keep="true"
                      onClick={() => {
                        setActiveCustomer(null);
                        onInspectOrder(ord);
                      }}
                      className="w-full py-2.5 flex items-center justify-between gap-2 text-start hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p
                          dir="ltr"
                          className="text-xs font-mono font-semibold text-slate-900 dark:text-white text-start"
                        >
                          {ord.id}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {ord.planOrItem}
                        </p>
                      </div>
                      <div className="text-end shrink-0">
                        <p
                          dir="ltr"
                          className="text-xs font-mono font-semibold tabular-nums text-slate-900 dark:text-white"
                        >
                          {formatCurrency(ord.amount)}
                        </p>
                        <StatusIndicator status={ord.status} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AdaptiveDrawer>
    </div>
  );
}
