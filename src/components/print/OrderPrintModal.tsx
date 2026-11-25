import { useState } from 'react';
import { FileDown, Loader2, Printer } from 'lucide-react';
import type { OrderRecord } from '../../types/admin';
import { useI18n } from '../../i18n/I18nContext';
import { exportOrderToPdf } from '../../services/pdfExportService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useNotifications } from '../ui/NotificationSystem';
import { OrderPrintSheet } from './OrderPrintSheet';
import { PrintPortal } from './PrintPortal';

export interface OrderPrintModalProps {
  open: boolean;
  onClose: () => void;
  order: OrderRecord | null;
}

export function OrderPrintModal({ open, onClose, order }: OrderPrintModalProps) {
  const { t, tStatus, tChannel, dir } = useI18n();
  const { addToast } = useNotifications();
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeQr, setIncludeQr] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  if (!order) return null;

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      const res = await exportOrderToPdf(order, {
        brandName: t('brandName'),
        title: t('printOrderDocTitle'),
        preparedBy: `${t('printPreparedBy')}: ${t('roleVpOps')}`,
        billToLabel: t('printBillTo'),
        settlementLabel: t('printSettlementInfo'),
        notesLabel: t('opsNotesLabel'),
        totalLabel: t('printSummaryTotal'),
        authorizationLabel: t('printAuthorization'),
        includeNotes,
        includeQr,
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
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`${t('printViewTitle')} · ${order.id}`}
        description={t('printPaperHint')}
        size="xl"
        footer={
          <div className="w-full flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('printPaperHint')}
            </span>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
              <Button variant="secondary" size="md" onClick={onClose}>
                {t('close')}
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
                onClick={() => void handleDownloadPdf()}
                data-testid="modal-order-download-pdf-btn"
              >
                {exportingPdf ? t('pdfExporting') : t('pdfExportBtn')}
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
                data-testid="confirm-print-order-btn"
              >
                {t('printSavePdfBtn')}
              </Button>
            </div>
          </div>
        }
      >
        {/* Print Options Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer min-h-[36px]">
              <input
                type="checkbox"
                checked={includeQr}
                onChange={(e) => setIncludeQr(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <span>{t('printIncludeQr')}</span>
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer min-h-[36px]">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
              <span>{t('printIncludeNotes')}</span>
            </label>
          </div>
        </div>

        {/* Paper Desk Preview */}
        <div className="bg-slate-100 dark:bg-slate-950 p-3 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <OrderPrintSheet
            order={order}
            includeNotes={includeNotes}
            includeQr={includeQr}
          />
        </div>
      </Modal>

      <PrintPortal active={open}>
        <OrderPrintSheet
          order={order}
          includeNotes={includeNotes}
          includeQr={includeQr}
        />
      </PrintPortal>
    </>
  );
}
