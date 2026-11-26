import { useEffect, useState } from 'react';
import { FileDown, Loader2, Paperclip, Pin, PinOff, Printer, Trash2 } from 'lucide-react';
import type { OrderRecord, OrderStatus } from '../../types/admin';
import { formatCurrency } from '../../utils/tableLogic';
import { useI18n } from '../../i18n/I18nContext';
import { exportOrderToPdf } from '../../services/pdfExportService';
import { AdaptiveDrawer } from '../ui/AdaptiveDrawer';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { ConfirmModal } from '../ui/Modal';
import { useNotifications } from '../ui/NotificationSystem';
import { OrderPrintModal } from '../print/OrderPrintModal';
import { FileStoragePickerModal } from '../storage/FileStoragePickerModal';

const STATUS_OPTIONS: OrderStatus[] = [
  'Completed',
  'Processing',
  'Pending',
  'Flagged',
  'Refunded',
];

export interface OrderDetailDrawerProps {
  order: OrderRecord | null;
  onClose: () => void;
  onUpdateOrder: (
    id: string,
    updates: Partial<Pick<OrderRecord, 'status' | 'notes'>>
  ) => void;
  onDeleteOrder: (id: string) => void;
  isPinned?: boolean;
  onTogglePin?: (order: OrderRecord) => void;
}

export function OrderDetailDrawer({
  order,
  onClose,
  onUpdateOrder,
  onDeleteOrder,
  isPinned = false,
  onTogglePin,
}: OrderDetailDrawerProps) {
  const { t, tStatus, tChannel, dir } = useI18n();
  const { addToast } = useNotifications();
  const [status, setStatus] = useState<OrderStatus>('Completed');
  const [notes, setNotes] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setNotes(order.notes ?? '');
      setPrintOpen(false);
      setAttachModalOpen(false);
    }
  }, [order]);

  if (!order) return null;

  const hasChanges =
    status !== order.status || notes.trim() !== (order.notes ?? '').trim();

  const handleSave = () => {
    onUpdateOrder(order.id, { status, notes: notes.trim() || undefined });
    onClose();
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const result = await exportOrderToPdf(
        {
          ...order,
          status,
          notes: notes.trim() || undefined,
        },
        {
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
        }
      );
      addToast({
        title: t('pdfExportSuccessToast', { filename: result.filename }),
        variant: 'success',
      });
    } catch {
      addToast({
        title: t('pdfExportErrorToast'),
        variant: 'error',
      });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <>
      <AdaptiveDrawer
        open={Boolean(order)}
        onClose={onClose}
        disableEscapeClose={printOpen || confirmDeleteOpen || attachModalOpen}
        title={order.id}
        subtitle={`${order.company} · ${order.date}`}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="ghost"
                size="md"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => setConfirmDeleteOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                {t('delete')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => setPrintOpen(true)}
                data-testid="order-drawer-print-btn"
              >
                {t('printBtn')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                disabled={exportingPdf}
                leftIcon={
                  exportingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )
                }
                onClick={() => void handleExportPdf()}
                data-testid="order-drawer-pdf-btn"
              >
                {exportingPdf ? t('pdfExporting') : t('pdfExportBtn')}
              </Button>
              {onTogglePin && (
                <Button
                  variant={isPinned ? 'primary' : 'secondary'}
                  size="md"
                  leftIcon={
                    isPinned ? (
                      <PinOff className="w-4 h-4" />
                    ) : (
                      <Pin className="w-4 h-4" />
                    )
                  }
                  onClick={() => onTogglePin(order)}
                  aria-pressed={isPinned}
                  data-testid="order-drawer-pin-btn"
                >
                  {isPinned ? t('favUnpinOrder') : t('favPinOrder')}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="md" onClick={onClose}>
                {t('close')}
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!hasChanges}
                onClick={handleSave}
              >
                {t('saveChanges')}
              </Button>
            </div>
          </div>
        }
      >
        {/* Customer Summary */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={order.customerAvatar}
              name={order.customerName}
              size="lg"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {order.customerName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {order.customerEmail}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {order.company} · {order.region}
              </p>
            </div>
          </div>
          <div className="text-end shrink-0">
            <div
              dir="ltr"
              className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white"
            >
              {formatCurrency(order.amount)}
            </div>
            <div className="mt-1 flex justify-end">
              <StatusIndicator status={order.status} />
            </div>
          </div>
        </div>

        {/* Structured Details */}
        <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          <div className="py-2.5 flex items-center justify-between gap-4">
            <dt className="text-slate-500 dark:text-slate-400">{t('planItemLabel')}</dt>
            <dd className="font-medium text-slate-900 dark:text-white text-end">
              {order.planOrItem}
            </dd>
          </div>
          <div className="py-2.5 flex items-center justify-between gap-4">
            <dt className="text-slate-500 dark:text-slate-400">{t('channelLabel')}</dt>
            <dd className="font-medium text-slate-900 dark:text-white">
              {tChannel(order.channel)}
            </dd>
          </div>
          <div className="py-2.5 flex items-center justify-between gap-4">
            <dt className="text-slate-500 dark:text-slate-400">{t('paymentLabel')}</dt>
            <dd dir="ltr" className="font-mono text-xs text-slate-800 dark:text-slate-200">
              {order.paymentMethod}
            </dd>
          </div>
          <div className="py-2.5 flex items-center justify-between gap-4">
            <dt className="text-slate-500 dark:text-slate-400">{t('orderDateLabel')}</dt>
            <dd dir="ltr" className="font-mono text-xs tabular-nums text-slate-800 dark:text-slate-200">
              {order.date}
            </dd>
          </div>
        </dl>

        {/* Editable Status */}
        <div className="space-y-2 pt-2">
          <label
            htmlFor="detail-order-status"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {t('updateStatusLabel')}
          </label>
          <select
            id="detail-order-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {tStatus(opt)}
              </option>
            ))}
          </select>
        </div>

        {/* Editable Notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="detail-order-notes"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {t('opsNotesLabel')}
            </label>
            <button
              type="button"
              onClick={() => setAttachModalOpen(true)}
              data-testid="order-drawer-attach-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Paperclip className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('storageDrawerAttachBtn')}</span>
            </button>
          </div>
          <textarea
            id="detail-order-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('opsNotesPlaceholder')}
            className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          />
        </div>
      </AdaptiveDrawer>

      <ConfirmModal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          onDeleteOrder(order.id);
          onClose();
        }}
        title={t('deleteOrderConfirmTitle', { id: order.id })}
        message={t('deleteOrderConfirmMsg', {
          name: order.customerName,
          amount: formatCurrency(order.amount),
        })}
        confirmLabel={t('deleteOrder')}
        cancelLabel={t('cancel')}
        destructive
      />

      <OrderPrintModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        order={{
          ...order,
          status,
          notes: notes.trim() || undefined,
        }}
      />

      <FileStoragePickerModal
        open={attachModalOpen}
        onClose={() => setAttachModalOpen(false)}
        rootFolderId="fld-settlements"
        onConfirm={(files) => {
          const picked = files[0];
          if (!picked) return;
          const marker = `[Attachment: ${picked.name}]`;
          setNotes((prev) => {
            const trimmed = prev.trim();
            if (!trimmed) return marker;
            if (trimmed.includes(marker)) return prev;
            return `${trimmed}\n${marker}`;
          });
        }}
      />
    </>
  );
}
