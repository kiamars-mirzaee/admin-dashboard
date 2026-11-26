import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Plus,
  Search,
} from 'lucide-react';
import type { OrderRecord, OrderStatus } from '../../types/admin';
import {
  KANBAN_STATUS_ORDER,
  groupOrdersByStatus,
} from '../../utils/adminSuite';
import { formatCurrency } from '../../utils/tableLogic';
import { useI18n } from '../../i18n/I18nContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';

export interface KanbanViewProps {
  orders: OrderRecord[];
  onUpdateOrderStatus: (id: string, status: OrderStatus) => void;
  onInspectOrder: (order: OrderRecord) => void;
  onCreateNewOrder: () => void;
}

export function KanbanView({
  orders,
  onUpdateOrderStatus,
  onInspectOrder,
  onCreateNewOrder,
}: KanbanViewProps) {
  const { t, tStatus, tChannel } = useI18n();
  const [search, setSearch] = useState('');
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<OrderStatus | null>(null);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.company.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.planOrItem.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const columns = useMemo(
    () => groupOrdersByStatus(filteredOrders),
    [filteredOrders]
  );

  const moveAdjacent = (order: OrderRecord, delta: -1 | 1) => {
    const idx = KANBAN_STATUS_ORDER.indexOf(order.status);
    const nextIdx = idx + delta;
    if (nextIdx >= 0 && nextIdx < KANBAN_STATUS_ORDER.length) {
      onUpdateOrderStatus(order.id, KANBAN_STATUS_ORDER[nextIdx]);
    }
  };

  return (
    <div className="space-y-5" data-testid="kanban-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('kanbanTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('kanbanSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchOrdersPlaceholder')}
              aria-label={t('searchOrdersPlaceholder')}
              className="min-h-[40px] w-56 sm:w-64 ps-9 pe-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onCreateNewOrder}
          >
            {t('newOrder')}
          </Button>
        </div>
      </div>

      {/* Horizontal Scrollable Board */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 min-w-[300px]">
          {columns.map((col) => {
            const isDropTarget = dragOverStatus === col.status;
            const colIndex = KANBAN_STATUS_ORDER.indexOf(col.status);
            return (
              <section
                key={col.status}
                data-testid={`kanban-col-${col.status}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStatus(col.status);
                }}
                onDragLeave={() => {
                  if (dragOverStatus === col.status) setDragOverStatus(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const orderId =
                    e.dataTransfer.getData('text/plain') || draggedOrderId;
                  setDragOverStatus(null);
                  setDraggedOrderId(null);
                  if (orderId) {
                    const target = orders.find((o) => o.id === orderId);
                    if (target && target.status !== col.status) {
                      onUpdateOrderStatus(orderId, col.status);
                    }
                  }
                }}
                className={`rounded-2xl border p-3 flex flex-col gap-3 min-h-[360px] transition-colors ${
                  isDropTarget
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600'
                    : 'bg-slate-100/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusIndicator status={col.status} />
                    <span className="font-mono text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                      {col.orders.length}
                    </span>
                  </div>
                  <span
                    dir="ltr"
                    className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200"
                  >
                    {formatCurrency(col.totalAmount)}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 flex-1">
                  {col.orders.length === 0 ? (
                    <div className="h-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center px-3 text-center text-xs text-slate-400 dark:text-slate-500">
                      {t('kanbanEmptyCol')}
                    </div>
                  ) : (
                    col.orders.map((order) => (
                      <article
                        key={order.id}
                        draggable
                        data-testid={`kanban-card-${order.id}`}
                        onDragStart={(e) => {
                          setDraggedOrderId(order.id);
                          e.dataTransfer.setData('text/plain', order.id);
                        }}
                        onDragEnd={() => {
                          setDraggedOrderId(null);
                          setDragOverStatus(null);
                        }}
                        className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical
                              className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 cursor-grab"
                              aria-hidden="true"
                            />
                            <button
                              type="button"
                              dir="ltr"
                              onClick={() => onInspectOrder(order)}
                              className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              {order.id}
                            </button>
                          </div>
                          <span
                            dir="ltr"
                            className="font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white"
                          >
                            {formatCurrency(order.amount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar
                            src={order.customerAvatar}
                            name={order.customerName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {order.company}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {order.customerName} · {tChannel(order.channel)}
                            </p>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                          {order.planOrItem}
                        </p>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                          <button
                            type="button"
                            disabled={colIndex === 0}
                            onClick={() => moveAdjacent(order, -1)}
                            aria-label={`${t('kanbanMovePrev')} (${order.id})`}
                            title={t('kanbanMovePrev')}
                            className="min-h-[28px] min-w-[28px] rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" />
                          </button>

                          <select
                            aria-label={`${t('colStatus')} ${order.id}`}
                            value={order.status}
                            onChange={(e) =>
                              onUpdateOrderStatus(
                                order.id,
                                e.target.value as OrderStatus
                              )
                            }
                            className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            {KANBAN_STATUS_ORDER.map((s) => (
                              <option key={s} value={s}>
                                {tStatus(s)}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            disabled={colIndex === KANBAN_STATUS_ORDER.length - 1}
                            onClick={() => moveAdjacent(order, 1)}
                            aria-label={`${t('kanbanMoveNext')} (${order.id})`}
                            title={t('kanbanMoveNext')}
                            data-testid={`kanban-advance-${order.id}`}
                            className="min-h-[28px] min-w-[28px] rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
