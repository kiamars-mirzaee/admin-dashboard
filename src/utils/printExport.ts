import type { OrderChannel, OrderRecord, OrderStatus } from '../types/admin';
import type { GridColumnSchema, GridOrderRow } from '../types/dataGrid';
import { formatCurrency } from './tableLogic';

export interface PrintableGridSummary {
  count: number;
  grossVolume: number;
  settledRevenue: number;
  averageOrder: number;
  flaggedCount: number;
  pendingCount: number;
}

export interface OrderPrintDocumentMeta {
  documentNumber: string;
  qrPayload: string;
  generatedAtDisplay: string;
  hasNotes: boolean;
}

export function buildPrintableColumns(
  columns: GridColumnSchema[],
  visibleColumnKeys?: string[] | null
): GridColumnSchema[] {
  const hasExplicit = Array.isArray(visibleColumnKeys) && visibleColumnKeys.length > 0;
  const visibleSet = hasExplicit ? new Set(visibleColumnKeys) : null;

  return columns.filter((col) => {
    if (col.sticky === 'end') return false;
    if (col.locked) return true;
    return visibleSet ? visibleSet.has(col.key) : col.visibleByDefault;
  });
}

export function formatPrintableCellValue(
  row: GridOrderRow | OrderRecord,
  col: GridColumnSchema,
  opts?: {
    statusLabel?: (s: OrderStatus) => string;
    channelLabel?: (c: OrderChannel) => string;
  }
): string {
  const record = row as unknown as Record<string, unknown>;
  switch (col.type) {
    case 'id':
      return row.id;
    case 'avatar-text': {
      const primary = row.customerName || '—';
      const secondary = col.secondaryKey
        ? String(record[col.secondaryKey] ?? '').trim()
        : '';
      return secondary ? `${primary} (${secondary})` : primary;
    }
    case 'currency':
      return formatCurrency(Number(record[col.key] ?? row.amount ?? 0));
    case 'number':
      return Number(record[col.key] ?? 0).toLocaleString('en-US');
    case 'status':
      return opts?.statusLabel ? opts.statusLabel(row.status) : row.status;
    case 'date':
      return String(record[col.key] ?? row.date ?? '—');
    case 'datetime':
      return String(record[col.key] ?? '—').replace('T', ' ');
    case 'text':
    default: {
      if (col.key === 'channel' && opts?.channelLabel) {
        return opts.channelLabel(row.channel);
      }
      const raw = record[col.key];
      return raw !== undefined && raw !== null && String(raw).trim() !== ''
        ? String(raw)
        : '—';
    }
  }
}

export function computePrintableGridSummary(
  rows: ReadonlyArray<Pick<OrderRecord, 'amount' | 'status'>>
): PrintableGridSummary {
  const count = rows.length;
  let grossVolume = 0;
  let settledRevenue = 0;
  let flaggedCount = 0;
  let pendingCount = 0;

  for (const row of rows) {
    const amt = Number.isFinite(row.amount) ? row.amount : 0;
    grossVolume += amt;
    if (row.status === 'Completed') {
      settledRevenue += amt;
    }
    if (row.status === 'Flagged') {
      flaggedCount += 1;
    }
    if (row.status === 'Pending' || row.status === 'Processing') {
      pendingCount += 1;
    }
  }

  return {
    count,
    grossVolume,
    settledRevenue,
    averageOrder: count > 0 ? Math.round(grossVolume / count) : 0,
    flaggedCount,
    pendingCount,
  };
}

export function buildPrintableFilterSummary(
  chips: ReadonlyArray<{ label: string }>,
  fallbackLabel: string
): string {
  if (chips.length === 0) return fallbackLabel;
  return chips.map((c) => c.label).join(' · ');
}

export function formatPrintTimestamp(isoOrDate: Date | string): string {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) {
    return typeof isoOrDate === 'string' ? isoOrDate : '2026-11-23 00:00 UTC';
  }
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min} UTC`;
}

export function buildOrderPrintDocumentMeta(
  order: Pick<OrderRecord, 'id' | 'notes'>,
  generatedAt: Date | string = new Date()
): OrderPrintDocumentMeta {
  return {
    documentNumber: `DOC-${order.id}`,
    qrPayload: `kestrel://order/${order.id}`,
    generatedAtDisplay: formatPrintTimestamp(generatedAt),
    hasNotes: Boolean(order.notes && order.notes.trim().length > 0),
  };
}
