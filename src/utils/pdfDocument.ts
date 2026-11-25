import type { OrderChannel, OrderRecord, OrderStatus } from '../types/admin';
import type { GridColumnSchema, GridOrderRow } from '../types/dataGrid';
import {
  type PrintableGridSummary,
  buildOrderPrintDocumentMeta,
  buildPrintableColumns,
  buildPrintableFilterSummary,
  computePrintableGridSummary,
  formatPrintTimestamp,
  formatPrintableCellValue,
} from './printExport';
import { formatCurrency } from './tableLogic';

export type PdfOrientation = 'portrait' | 'landscape';

export interface PrintOptimizedPalette {
  paper: [number, number, number];
  ink: [number, number, number];
  muted: [number, number, number];
  subtle: [number, number, number];
  rule: [number, number, number];
  lightRule: [number, number, number];
  surfaceAlt: [number, number, number];
  tableHeadFill: [number, number, number];
  brandAccent: [number, number, number];
}

export const PRINT_OPTIMIZED_PALETTE: PrintOptimizedPalette = {
  paper: [255, 255, 255],
  ink: [15, 23, 42], // slate-900
  muted: [71, 85, 105], // slate-600
  subtle: [100, 116, 139], // slate-500
  rule: [203, 213, 225], // slate-300
  lightRule: [226, 232, 240], // slate-200
  surfaceAlt: [248, 250, 252], // slate-50
  tableHeadFill: [241, 245, 249], // slate-100
  brandAccent: [15, 23, 42], // monochrome ink-first print contrast
};

export interface OrderPdfSpec {
  filename: string;
  orientation: PdfOrientation;
  documentNumber: string;
  qrPayload: string;
  generatedAt: string;
  title: string;
  orderId: string;
  statusText: string;
  customerBlock: string[];
  settlementRows: Array<[string, string]>;
  lineItemHeaders: [string, string, string, string];
  lineItemRows: Array<[string, string, string, string]>;
  totalAmountFormatted: string;
  notesText: string | null;
}

export interface DataGridPdfSpec {
  filename: string;
  orientation: PdfOrientation;
  generatedAt: string;
  title: string;
  scopeLabel: string;
  filterSummary: string;
  summary: PrintableGridSummary;
  columns: GridColumnSchema[];
  headers: string[];
  rows: string[][];
  totalFooterRow: string[] | null;
}

export function sanitizePdfFilename(raw: string, fallback = 'document'): string {
  const cleaned = raw
    .trim()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = cleaned.length > 0 ? cleaned : fallback;
  return `${base}.pdf`;
}

export function containsNonLatinScript(values: ReadonlyArray<string | undefined | null>): boolean {
  const nonLatinRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF\u4E00-\u9FFF]/;
  for (const val of values) {
    if (val && nonLatinRegex.test(val)) return true;
  }
  return false;
}

export function getStatusPrintColor(status: OrderStatus): [number, number, number] {
  switch (status) {
    case 'Completed':
      return [21, 128, 61]; // green-700
    case 'Processing':
      return [29, 78, 216]; // blue-700
    case 'Pending':
      return [180, 83, 9]; // amber-700
    case 'Flagged':
      return [185, 28, 28]; // red-700
    case 'Refunded':
    default:
      return [71, 85, 105]; // slate-600
  }
}

export function buildOrderPdfSpec(
  order: OrderRecord,
  options?: {
    title?: string;
    includeNotes?: boolean;
    generatedAt?: Date | string;
    statusLabel?: (s: OrderStatus) => string;
    channelLabel?: (c: OrderChannel) => string;
    labels?: {
      channel?: string;
      payment?: string;
      status?: string;
      date?: string;
      planItem?: string;
      amount?: string;
    };
  }
): OrderPdfSpec {
  const meta = buildOrderPrintDocumentMeta(order, options?.generatedAt ?? new Date());
  const statusText = options?.statusLabel ? options.statusLabel(order.status) : order.status;
  const channelText = options?.channelLabel ? options.channelLabel(order.channel) : order.channel;
  const includeNotes = options?.includeNotes ?? true;
  const labels = options?.labels ?? {};

  return {
    filename: sanitizePdfFilename(`kestrel-${order.id}`, 'kestrel-order'),
    orientation: 'portrait',
    documentNumber: meta.documentNumber,
    qrPayload: meta.qrPayload,
    generatedAt: meta.generatedAtDisplay,
    title: options?.title ?? 'Order Fulfillment Summary',
    orderId: order.id,
    statusText,
    customerBlock: [
      order.customerName,
      order.company,
      order.customerEmail,
      order.region,
    ].filter((s) => Boolean(s && s.trim())),
    settlementRows: [
      [labels.channel ?? 'Channel', channelText],
      [labels.payment ?? 'Payment method', order.paymentMethod],
      [labels.status ?? 'Status', statusText],
      [labels.date ?? 'Order date', order.date],
    ],
    lineItemHeaders: [
      labels.planItem ?? 'Plan / Item',
      labels.channel ?? 'Channel',
      labels.date ?? 'Order date',
      labels.amount ?? 'Amount',
    ],
    lineItemRows: [
      [
        order.planOrItem,
        channelText,
        order.date,
        formatCurrency(order.amount),
      ],
    ],
    totalAmountFormatted: formatCurrency(order.amount),
    notesText: includeNotes
      ? order.notes?.trim() || '—'
      : null,
  };
}

export function buildDataGridPdfSpec(
  rows: ReadonlyArray<GridOrderRow | OrderRecord>,
  columns: GridColumnSchema[],
  options?: {
    visibleColumnKeys?: string[] | null;
    filterChips?: ReadonlyArray<{ label: string }>;
    scopeLabel?: string;
    title?: string;
    noFiltersLabel?: string;
    totalLabel?: string;
    generatedAt?: Date | string;
    statusLabel?: (s: OrderStatus) => string;
    channelLabel?: (c: OrderChannel) => string;
  }
): DataGridPdfSpec {
  const printableCols = buildPrintableColumns(columns, options?.visibleColumnKeys);
  const summary = computePrintableGridSummary(rows);
  const generatedAt = formatPrintTimestamp(options?.generatedAt ?? new Date());
  const headers = printableCols.map((col) => col.label);

  const formattedRows = rows.map((row) =>
    printableCols.map((col) =>
      formatPrintableCellValue(row, col, {
        statusLabel: options?.statusLabel,
        channelLabel: options?.channelLabel,
      })
    )
  );

  const amountColIndex = printableCols.findIndex((c) => c.key === 'amount');
  let totalFooterRow: string[] | null = null;
  if (amountColIndex !== -1 && rows.length > 0 && printableCols.length > 0) {
    totalFooterRow = printableCols.map((_, idx) => {
      if (idx === amountColIndex) return formatCurrency(summary.grossVolume);
      if (idx === Math.max(0, amountColIndex - 1)) {
        return `${options?.totalLabel ?? 'Total'} (${summary.count})`;
      }
      return '';
    });
  }

  return {
    filename: sanitizePdfFilename(
      `kestrel-orders-${generatedAt.slice(0, 10)}`,
      'kestrel-orders'
    ),
    orientation: printableCols.length >= 6 ? 'landscape' : 'portrait',
    generatedAt,
    title: options?.title ?? 'Orders Ledger Report',
    scopeLabel: options?.scopeLabel ?? `${rows.length} rows`,
    filterSummary: buildPrintableFilterSummary(
      options?.filterChips ?? [],
      options?.noFiltersLabel ?? 'None (full active ledger)'
    ),
    summary,
    columns: printableCols,
    headers,
    rows: formattedRows,
    totalFooterRow,
  };
}
