import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { OrderRecord } from '../../types/admin';
import { useI18n } from '../../i18n/I18nContext';
import { formatCurrency } from '../../utils/tableLogic';
import { buildOrderPrintDocumentMeta } from '../../utils/printExport';
import { StatusIndicator } from '../ui/StatusIndicator';

export interface OrderPrintSheetProps {
  order: OrderRecord;
  includeNotes?: boolean;
  includeQr?: boolean;
  generatedAt?: string;
}

export function OrderPrintSheet({
  order,
  includeNotes = true,
  includeQr = true,
  generatedAt,
}: OrderPrintSheetProps) {
  const { t, tStatus, tChannel, dir } = useI18n();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timestamp] = useState<string>(
    () => generatedAt ?? new Date().toISOString()
  );

  const meta = buildOrderPrintDocumentMeta(order, timestamp);

  useEffect(() => {
    if (!includeQr) {
      setQrDataUrl('');
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(meta.qrPayload, {
      width: 112,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [includeQr, meta.qrPayload]);

  return (
    <article
      dir={dir}
      data-testid="order-print-sheet"
      className="print-sheet bg-white text-slate-900 border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm max-w-[780px] mx-auto space-y-5"
    >
      {/* Document Header */}
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-300">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-display font-bold text-xs shrink-0">
              K
            </div>
            <span className="font-display font-bold text-base tracking-tight text-slate-900">
              {t('brandName')}
            </span>
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900">
            {t('printOrderDocTitle')}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 tabular-nums">
            <span>
              {t('printDocumentNo')}:{' '}
              <strong dir="ltr" className="font-mono text-slate-900">
                {meta.documentNumber}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t('printGeneratedAt')}:{' '}
              <span dir="ltr" className="font-mono text-slate-800">
                {meta.generatedAtDisplay}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-start gap-4 shrink-0">
          <div className="text-start sm:text-end space-y-1">
            <div
              dir="ltr"
              className="font-mono text-lg font-bold tracking-tight text-slate-900 tabular-nums"
            >
              {order.id}
            </div>
            <div className="flex sm:justify-end">
              <StatusIndicator status={order.status} forceLight />
            </div>
            <p className="text-xs text-slate-500 tabular-nums">
              {t('orderDateLabel')}:{' '}
              <span dir="ltr" className="font-mono text-slate-700">
                {order.date}
              </span>
            </p>
          </div>

          {includeQr && qrDataUrl && (
            <div className="border border-slate-200 rounded-lg p-1.5 bg-white text-center shrink-0">
              <img
                src={qrDataUrl}
                alt={`QR ${order.id}`}
                width={76}
                height={76}
                className="w-[76px] h-[76px] block"
              />
            </div>
          )}
        </div>
      </header>

      {/* Customer & Settlement Metadata Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-4 border-b border-slate-200 print-avoid-break">
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-500 tracking-wide">
            {t('printBillTo')}
          </h2>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-slate-900">{order.customerName}</p>
            <p className="text-slate-700">{order.company}</p>
            <p dir="ltr" className="font-mono text-xs text-slate-600">
              {order.customerEmail}
            </p>
            <p className="text-xs text-slate-600">
              {t('regionLabel')}: <span className="text-slate-900">{order.region}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-500 tracking-wide">
            {t('printSettlementInfo')}
          </h2>
          <dl className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{t('channelLabel')}</dt>
              <dd className="font-medium text-slate-900">
                {tChannel(order.channel)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{t('paymentLabel')}</dt>
              <dd dir="ltr" className="font-mono font-medium text-slate-900">
                {order.paymentMethod}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{t('colStatus')}</dt>
              <dd className="font-medium text-slate-900">
                {tStatus(order.status)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{t('orderDateLabel')}</dt>
              <dd dir="ltr" className="font-mono tabular-nums text-slate-900">
                {order.date}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Structured Line Item Table */}
      <section className="print-avoid-break">
        <table className="w-full border-collapse text-start text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-xs font-semibold text-slate-700">
              <th className="py-2.5 pe-3 text-start">{t('planItemLabel')}</th>
              <th className="py-2.5 px-3 text-start">{t('channelLabel')}</th>
              <th className="py-2.5 px-3 text-start">{t('orderDateLabel')}</th>
              <th className="py-2.5 ps-3 text-end">{t('colAmount')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-3.5 pe-3 font-medium text-slate-900">
                {order.planOrItem}
              </td>
              <td className="py-3.5 px-3 text-slate-700">
                {tChannel(order.channel)}
              </td>
              <td className="py-3.5 px-3 font-mono text-xs tabular-nums text-slate-700 text-start">
                <span dir="ltr" className="inline-block">{order.date}</span>
              </td>
              <td
                className="py-3.5 ps-3 text-end font-mono font-semibold tabular-nums text-slate-900"
              >
                <span dir="ltr" className="inline-block">{formatCurrency(order.amount)}</span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-4 text-end text-xs font-semibold text-slate-600">
                {t('printSummaryTotal')}
              </td>
              <td
                className="pt-4 ps-3 text-end font-mono text-lg font-bold tabular-nums text-slate-900"
              >
                <span dir="ltr" className="inline-block">{formatCurrency(order.amount)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Operational Notes */}
      {includeNotes && (
        <section className="border border-slate-200 rounded-lg p-4 bg-slate-50/60 space-y-1.5 print-avoid-break">
          <h2 className="text-xs font-semibold text-slate-700">
            {t('opsNotesLabel')}
          </h2>
          <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
            {order.notes?.trim() || '—'}
          </p>
        </section>
      )}

      {/* Physical Verification Footer */}
      <footer className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs text-slate-500 print-avoid-break">
        <div className="space-y-1">
          <p>
            {t('printPreparedBy')}:{' '}
            <span className="font-medium text-slate-800">{t('roleVpOps')}</span>
          </p>
          {includeQr && (
            <p className="text-[11px] text-slate-500">
              {t('printVerificationQr')}:{' '}
              <span dir="ltr" className="font-mono text-slate-700">
                {meta.qrPayload}
              </span>
            </p>
          )}
        </div>
        <div className="w-52 pt-4 border-b border-slate-400 text-[11px] text-slate-500 pb-1">
          {t('printAuthorization')}
        </div>
      </footer>
    </article>
  );
}
