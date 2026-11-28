import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileDown,
  Loader2,
  PanelRightOpen,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import type { OrderRecord, OrderStatus } from '../../types/admin';
import { formatCurrency } from '../../utils/tableLogic';
import { exportOrderToPdf } from '../../services/pdfExportService';
import { useI18n } from '../../i18n/I18nContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useNotifications } from '../ui/NotificationSystem';
import { StatusIndicator } from '../ui/StatusIndicator';

export interface OrderDetailPageViewProps {
  orders: OrderRecord[];
  selectedOrderId: string | null;
  onSelectOrderId: (id: string) => void;
  onBackToOrders: () => void;
  onOpenQuickDrawer: (order: OrderRecord) => void;
  onUpdateOrder: (
    id: string,
    updates: Partial<Pick<OrderRecord, 'status' | 'notes'>>
  ) => void;
  onOpenEditorPage: (order: OrderRecord) => void;
}

const STATUSES: OrderStatus[] = [
  'Completed',
  'Processing',
  'Pending',
  'Flagged',
  'Refunded',
];

export function OrderDetailPageView({
  orders,
  selectedOrderId,
  onSelectOrderId,
  onBackToOrders,
  onOpenQuickDrawer,
  onUpdateOrder,
  onOpenEditorPage,
}: OrderDetailPageViewProps) {
  const { t, tStatus, tChannel, dir } = useI18n();
  const { addToast } = useNotifications();
  const order =
    orders.find((o) => o.id === selectedOrderId) ?? orders[0] ?? null;

  const [status, setStatus] = useState<OrderStatus>(order?.status ?? 'Pending');
  const [notes, setNotes] = useState(order?.notes ?? '');
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setNotes(order.notes ?? '');
    }
  }, [order]);

  if (!order) return null;

  const isDirty =
    status !== order.status || notes.trim() !== (order.notes ?? '').trim();

  const timelineEvents = [
    {
      id: 'ev-1',
      title: `Order ${order.id} created`,
      time: `${order.date} · 09:12 UTC`,
      tone: 'info' as const,
      detail: `${order.planOrItem} (${tChannel(order.channel)})`,
    },
    {
      id: 'ev-2',
      title: `Payment instrument attached`,
      time: `${order.date} · 09:14 UTC`,
      tone: 'info' as const,
      detail: `${order.paymentMethod} · ${order.region}`,
    },
    {
      id: 'ev-3',
      title: `Current stage: ${tStatus(order.status)}`,
      time: `${order.date} · 14:30 UTC`,
      tone:
        order.status === 'Flagged'
          ? ('warning' as const)
          : ('success' as const),
      detail: order.notes || 'Standard automated verification rule passed.',
    },
  ];

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const result = await exportOrderToPdf(order, {
        brandName: t('brandName'),
        title: t('printOrderDocTitle'),
        preparedBy: `${t('printPreparedBy')}: ${t('roleVpOps')}`,
        billToLabel: t('printBillTo'),
        settlementLabel: t('printSettlementInfo'),
        notesLabel: t('opsNotesLabel'),
        totalLabel: t('printSummaryTotal'),
        authorizationLabel: t('printAuthorization'),
        rtl: dir === 'rtl',
        statusLabel: tStatus,
        channelLabel: tChannel,
        labels: {
          channel: t('channelLabel'),
          payment: t('paymentLabel'),
          status: t('colStatus'),
          date: t('orderDateLabel'),
          planItem: t('planItemLabel'),
          amount: t('colAmount'),
          generatedAt: t('printGeneratedAt'),
          documentNo: t('printDocumentNo'),
        },
      });
      addToast({
        title: t('pdfExportSuccessToast', { filename: result.filename }),
        variant: 'success',
      });
    } catch {
      addToast({ title: t('pdfExportErrorToast'), variant: 'error' });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="order-detail-page">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-180" />}
            onClick={onBackToOrders}
          >
            {t('orderPageBack')}
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span dir="ltr" className="font-mono">
                {order.id}
              </span>
              <StatusIndicator status={order.status} />
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('orderPageTitle')} · {order.company}
            </p>
          </div>
        </div>

        <div data-print-controls="true" className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Switch active order"
            value={order.id}
            onChange={(e) => onSelectOrderId(e.target.value)}
            className="min-h-[36px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} — {o.company}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<PanelRightOpen className="w-4 h-4" />}
            onClick={() => onOpenQuickDrawer(order)}
          >
            {t('orderPageOpenDrawer')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            {t('printBtn')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={exportingPdf}
            leftIcon={
              exportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )
            }
            onClick={() => void handleExportPdf()}
          >
            {t('pdfExportBtn')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenEditorPage(order)}
          >
            {t('navOrderEditor')}
          </Button>
        </div>
      </div>

      {/* Main Two-Column Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left 2 Cols: Summary + Inline Status/Notes + Timeline */}
        <div className="lg:col-span-2 space-y-5">
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <Avatar
                  src={order.customerAvatar}
                  name={order.customerName}
                  size="lg"
                />
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {order.customerName}
                  </h3>
                  <p dir="ltr" className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {order.customerEmail}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {order.company} · {order.region}
                  </p>
                </div>
              </div>

              <div className="text-end">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  {t('colAmount')}
                </span>
                <span
                  dir="ltr"
                  className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white"
                >
                  {formatCurrency(order.amount)}
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t('planItemLabel')}
                </dt>
                <dd className="font-medium text-slate-900 dark:text-white mt-0.5">
                  {order.planOrItem}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t('channelLabel')}
                </dt>
                <dd className="font-medium text-slate-900 dark:text-white mt-0.5">
                  {tChannel(order.channel)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t('paymentLabel')}
                </dt>
                <dd dir="ltr" className="font-mono text-xs text-slate-800 dark:text-slate-200 mt-0.5">
                  {order.paymentMethod}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t('orderDateLabel')}
                </dt>
                <dd dir="ltr" className="font-mono text-xs tabular-nums text-slate-800 dark:text-slate-200 mt-0.5">
                  {order.date}
                </dd>
              </div>
            </dl>
          </section>

          {/* Activity Timeline */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Order activity timeline
            </h3>
            <ol className="space-y-4">
              {timelineEvents.map((ev) => (
                <li key={ev.id} className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {ev.tone === 'warning' ? (
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    ) : ev.tone === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {ev.title}
                      </p>
                      <span dir="ltr" className="font-mono text-[11px] text-slate-400">
                        {ev.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {ev.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Right Col: Quick Update Card */}
        <aside className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {t('updateStatusLabel')}
          </h3>
          <select
            aria-label={t('updateStatusLabel')}
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {tStatus(s)}
              </option>
            ))}
          </select>

          <div className="space-y-1.5">
            <label
              htmlFor="page-order-notes"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {t('opsNotesLabel')}
            </label>
            <textarea
              id="page-order-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <Button
            variant="primary"
            size="md"
            disabled={!isDirty}
            onClick={() =>
              onUpdateOrder(order.id, {
                status,
                notes: notes.trim() || undefined,
              })
            }
            className="w-full"
          >
            {t('saveChanges')}
          </Button>
        </aside>
      </div>
    </div>
  );
}
