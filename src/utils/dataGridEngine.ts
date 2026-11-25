import { INITIAL_ORDERS } from '../data/seedData';
import type { OrderChannel, OrderStatus, SortDirection } from '../types/admin';
import type {
  GridActionSchema,
  GridBulkActionSchema,
  GridBulkScope,
  GridColumnSchema,
  GridCrudFieldSchema,
  GridFilterOption,
  GridFilterSchema,
  GridFilterValues,
  GridOrderRow,
  GridSchemaResponse,
} from '../types/dataGrid';

const EXTRA_METADATA_BY_ID: Record<
  string,
  { seatsCount: number; cutoverAt: string; updatedBy: string }
> = {
  'ORD-8492': { seatsCount: 48, cutoverAt: '2026-11-22T14:30', updatedBy: 'Elena Rostova' },
  'ORD-8491': { seatsCount: 4, cutoverAt: '2026-11-21T09:15', updatedBy: 'Kaito Sato' },
  'ORD-8490': { seatsCount: 12, cutoverAt: '2026-11-21T16:45', updatedBy: 'Elena Rostova' },
  'ORD-8489': { seatsCount: 10, cutoverAt: '2026-11-20T11:00', updatedBy: 'Soren Holm' },
  'ORD-8488': { seatsCount: 64, cutoverAt: '2026-11-19T17:30', updatedBy: 'Elena Rostova' },
  'ORD-8487': { seatsCount: 12, cutoverAt: '2026-11-18T10:20', updatedBy: 'Claire Dupont' },
  'ORD-8486': { seatsCount: 8, cutoverAt: '2026-11-17T15:00', updatedBy: 'Kaito Sato' },
  'ORD-8485': { seatsCount: 10, cutoverAt: '2026-11-16T08:45', updatedBy: 'Elena Rostova' },
  'ORD-8484': { seatsCount: 3, cutoverAt: '2026-11-14T13:10', updatedBy: 'Soren Holm' },
  'ORD-8483': { seatsCount: 6, cutoverAt: '2026-11-12T12:00', updatedBy: 'Claire Dupont' },
  'ORD-8482': { seatsCount: 52, cutoverAt: '2026-11-10T18:00', updatedBy: 'Elena Rostova' },
  'ORD-8481': { seatsCount: 2, cutoverAt: '2026-11-05T09:30', updatedBy: 'Kaito Sato' },
  'ORD-8480': { seatsCount: 40, cutoverAt: '2026-10-29T14:00', updatedBy: 'Soren Holm' },
  'ORD-8479': { seatsCount: 18, cutoverAt: '2026-10-25T10:45', updatedBy: 'Elena Rostova' },
  'ORD-8478': { seatsCount: 5, cutoverAt: '2026-10-18T16:15', updatedBy: 'Claire Dupont' },
  'ORD-8477': { seatsCount: 10, cutoverAt: '2026-09-28T11:30', updatedBy: 'Elena Rostova' },
};

export function extractNumericCode(orderId: string): number {
  const digits = orderId.replace(/\D/g, '');
  const parsed = Number(digits);
  return Number.isFinite(parsed) && digits.length > 0 ? parsed : 0;
}

export function buildInitialGridOrders(): GridOrderRow[] {
  return INITIAL_ORDERS.map((order, idx) => {
    const extra = EXTRA_METADATA_BY_ID[order.id] ?? {
      seatsCount: 5 + (idx % 12),
      cutoverAt: `${order.date}T12:00`,
      updatedBy: 'Elena Rostova',
    };
    return {
      ...order,
      numericCode: extractNumericCode(order.id),
      seatsCount: extra.seatsCount,
      cutoverAt: extra.cutoverAt,
      updatedBy: extra.updatedBy,
    };
  });
}

export const ORDERS_COLUMNS_SCHEMA: GridColumnSchema[] = [
  {
    key: 'id',
    label: 'Order ID',
    type: 'id',
    sticky: 'start',
    sortable: true,
    widthPx: 120,
    visibleByDefault: true,
    locked: true,
  },
  {
    key: 'customerName',
    label: 'Customer',
    type: 'avatar-text',
    secondaryKey: 'company',
    sortable: true,
    widthPx: 220,
    visibleByDefault: true,
  },
  {
    key: 'planOrItem',
    label: 'Plan / Item',
    type: 'text',
    widthPx: 220,
    visibleByDefault: true,
  },
  {
    key: 'status',
    label: 'Status',
    type: 'status',
    sortable: true,
    widthPx: 145,
    visibleByDefault: true,
  },
  {
    key: 'channel',
    label: 'Channel',
    type: 'text',
    sortable: true,
    widthPx: 130,
    visibleByDefault: true,
  },
  {
    key: 'amount',
    label: 'Amount',
    type: 'currency',
    sortable: true,
    align: 'right',
    widthPx: 130,
    visibleByDefault: true,
  },
  {
    key: 'seatsCount',
    label: 'Seats / Units',
    type: 'number',
    sortable: true,
    align: 'right',
    widthPx: 120,
    visibleByDefault: true,
  },
  {
    key: 'date',
    label: 'Order Date',
    type: 'date',
    sortable: true,
    widthPx: 130,
    visibleByDefault: true,
  },
  {
    key: 'cutoverAt',
    label: 'Cutover Window',
    type: 'datetime',
    sortable: true,
    widthPx: 165,
    visibleByDefault: false,
  },
  {
    key: 'region',
    label: 'Region',
    type: 'text',
    sortable: true,
    widthPx: 155,
    visibleByDefault: true,
  },
  {
    key: 'paymentMethod',
    label: 'Payment Method',
    type: 'text',
    widthPx: 170,
    visibleByDefault: false,
  },
  {
    key: 'updatedBy',
    label: 'Owner',
    type: 'text',
    widthPx: 145,
    visibleByDefault: false,
  },
  {
    key: '_actions',
    label: 'Actions',
    type: 'text',
    sticky: 'end',
    align: 'right',
    widthPx: 96,
    visibleByDefault: true,
    locked: true,
  },
];

export const ORDERS_FILTERS_SCHEMA: GridFilterSchema[] = [
  {
    key: 'commaCodes',
    label: 'Order Numbers (Comma-separated)',
    type: 'comma-numbers',
    placeholder: 'e.g. 8492, 8490, 8488',
  },
  {
    key: 'seatsExact',
    label: 'Exact Seats / Units',
    type: 'number',
    placeholder: 'e.g. 12',
    min: 1,
    step: 1,
  },
  {
    key: 'amountRange',
    label: 'Amount Range (USD)',
    type: 'number-range',
    min: 0,
    step: 50,
  },
  {
    key: 'dateRange',
    label: 'Order Date Range',
    type: 'date-range',
  },
  {
    key: 'cutoverRange',
    label: 'Cutover Date & Time Range',
    type: 'datetime-range',
  },
  {
    key: 'statuses',
    label: 'Order Status (Multi-select)',
    type: 'multi-select',
    options: [
      { value: 'Completed', label: 'Completed', description: 'Settled & verified' },
      { value: 'Processing', label: 'Processing', description: 'In settlement queue' },
      { value: 'Pending', label: 'Pending', description: 'Awaiting approval' },
      { value: 'Flagged', label: 'Flagged', description: 'Manual compliance check' },
      { value: 'Refunded', label: 'Refunded', description: 'Reversed transaction' },
    ],
  },
  {
    key: 'channels',
    label: 'Sales Channel (Multi-select)',
    type: 'multi-select',
    options: [
      { value: 'Enterprise', label: 'Enterprise' },
      { value: 'Direct', label: 'Direct' },
      { value: 'Partner', label: 'Partner' },
      { value: 'Marketplace', label: 'Marketplace' },
    ],
  },
  {
    key: 'companies',
    label: 'Accounts / Companies (AJAX Search)',
    type: 'multi-select-ajax',
    placeholder: 'Type company or region...',
    ajaxEndpoint: '/api/orders/options/company',
  },
  {
    key: 'regions',
    label: 'Regions (AJAX Search)',
    type: 'multi-select-ajax',
    placeholder: 'Search city or country...',
    ajaxEndpoint: '/api/orders/options/region',
  },
];

export const ORDERS_ROW_ACTIONS_SCHEMA: GridActionSchema[] = [
  {
    id: 'inspect',
    label: 'Inspect details',
    icon: 'eye',
    actionType: 'inspect',
  },
  {
    id: 'edit',
    label: 'Edit record',
    icon: 'edit',
    actionType: 'edit',
  },
  {
    id: 'status-submenu',
    label: 'Change status',
    icon: 'tag',
    actionType: 'submenu',
    children: [
      {
        id: 'status-completed',
        label: 'Mark Completed',
        icon: 'check',
        actionType: 'patch',
        variant: 'success',
        patchPayload: { status: 'Completed' },
      },
      {
        id: 'status-processing',
        label: 'Mark Processing',
        icon: 'clock',
        actionType: 'patch',
        patchPayload: { status: 'Processing' },
      },
      {
        id: 'status-flagged',
        label: 'Flag for review',
        icon: 'alert',
        actionType: 'patch',
        variant: 'warning',
        critical: true,
        confirmTitle: 'Flag order for compliance review?',
        confirmMessage: 'Flagging this order pauses automated settlement until an operator clears it.',
        patchPayload: { status: 'Flagged' },
      },
      {
        id: 'status-refunded',
        label: 'Issue Refund',
        icon: 'rotate',
        actionType: 'patch',
        variant: 'danger',
        critical: true,
        confirmTitle: 'Confirm order refund?',
        confirmMessage: 'Refunding reverses settlement revenue and cannot be undone automatically.',
        patchPayload: { status: 'Refunded' },
      },
    ],
  },
  {
    id: 'duplicate',
    label: 'Duplicate row',
    icon: 'copy',
    actionType: 'duplicate',
  },
  {
    id: 'delete',
    label: 'Delete order',
    icon: 'trash',
    actionType: 'delete',
    variant: 'danger',
    critical: true,
    confirmTitle: 'Delete this order permanently?',
    confirmMessage: 'This permanently removes the record from the backend ledger.',
  },
];

export const ORDERS_BULK_ACTIONS_SCHEMA: GridBulkActionSchema[] = [
  {
    id: 'export-csv',
    label: 'Export CSV',
    description: 'Download visible columns as an RFC-4180 CSV spreadsheet.',
    kind: 'export',
    variant: 'secondary',
    critical: false,
    supportedScopes: ['selected', 'current-page', 'current-filter', 'all-rows'],
  },
  {
    id: 'bulk-status',
    label: 'Update Status',
    description: 'Batch-transition targeted orders to a new lifecycle state.',
    kind: 'update',
    variant: 'primary',
    critical: false,
    supportedScopes: ['selected', 'current-page', 'current-filter', 'all-rows'],
    formFields: [
      {
        key: 'status',
        label: 'Target Status',
        type: 'select',
        required: true,
        options: [
          { value: 'Completed', label: 'Completed' },
          { value: 'Processing', label: 'Processing' },
          { value: 'Pending', label: 'Pending' },
          { value: 'Flagged', label: 'Flagged (Manual Review)' },
        ],
      },
      {
        key: 'auditNote',
        label: 'Batch Audit Note (optional)',
        type: 'text',
        placeholder: 'e.g. Cleared via nightly settlement batch',
      },
    ],
  },
  {
    id: 'bulk-assign-owner',
    label: 'Assign Operations Owner',
    description: 'Reassign responsibility across the targeted rows.',
    kind: 'update',
    variant: 'secondary',
    critical: false,
    supportedScopes: ['selected', 'current-page', 'current-filter', 'all-rows'],
    formFields: [
      {
        key: 'updatedBy',
        label: 'Operations Owner',
        type: 'select',
        required: true,
        options: [
          { value: 'Elena Rostova', label: 'Elena Rostova' },
          { value: 'Kaito Sato', label: 'Kaito Sato' },
          { value: 'Soren Holm', label: 'Soren Holm' },
          { value: 'Claire Dupont', label: 'Claire Dupont' },
        ],
      },
    ],
  },
  {
    id: 'bulk-refund',
    label: 'Batch Refund',
    description: 'Mark targeted orders as Refunded (requires operator approval).',
    kind: 'update',
    variant: 'danger',
    critical: true,
    confirmTitle: 'Approve Batch Refund?',
    confirmMessage: 'Refunding multiple orders will reverse all matching settled amounts.',
    supportedScopes: ['selected', 'current-page', 'current-filter', 'all-rows'],
    formFields: [
      {
        key: 'auditNote',
        label: 'Refund Reason',
        type: 'text',
        required: true,
        placeholder: 'e.g. Duplicate batch settlement',
      },
    ],
  },
  {
    id: 'bulk-delete',
    label: 'Delete Records',
    description: 'Permanently delete targeted orders from the backend store.',
    kind: 'delete',
    variant: 'danger',
    critical: true,
    confirmTitle: 'Approve Permanent Deletion?',
    confirmMessage: 'Deleted records cannot be recovered from the live ledger.',
    supportedScopes: ['selected', 'current-page', 'current-filter'],
  },
];

export const ORDERS_CRUD_FIELDS_SCHEMA: GridCrudFieldSchema[] = [
  {
    key: 'customerName',
    label: 'Customer Name',
    type: 'text',
    required: true,
    placeholder: 'e.g. Maya Lin',
  },
  {
    key: 'customerEmail',
    label: 'Customer Email',
    type: 'email',
    required: true,
    placeholder: 'maya@company.io',
  },
  {
    key: 'company',
    label: 'Company / Account',
    type: 'text',
    required: true,
    placeholder: 'e.g. Helios Dynamics',
  },
  {
    key: 'planOrItem',
    label: 'Plan / Item',
    type: 'text',
    required: true,
    placeholder: 'Enterprise Cluster (Annual)',
  },
  {
    key: 'channel',
    label: 'Sales Channel',
    type: 'select',
    required: true,
    options: [
      { value: 'Direct', label: 'Direct' },
      { value: 'Enterprise', label: 'Enterprise' },
      { value: 'Partner', label: 'Partner' },
      { value: 'Marketplace', label: 'Marketplace' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'Pending', label: 'Pending' },
      { value: 'Processing', label: 'Processing' },
      { value: 'Completed', label: 'Completed' },
      { value: 'Flagged', label: 'Flagged' },
      { value: 'Refunded', label: 'Refunded' },
    ],
  },
  {
    key: 'amount',
    label: 'Amount (USD)',
    type: 'number',
    required: true,
    min: 1,
    step: 1,
  },
  {
    key: 'seatsCount',
    label: 'Seats / Units',
    type: 'number',
    required: true,
    min: 1,
    step: 1,
  },
  {
    key: 'date',
    label: 'Order Date',
    type: 'date',
    required: true,
  },
  {
    key: 'cutoverAt',
    label: 'Cutover Date & Time',
    type: 'datetime',
    required: true,
  },
  {
    key: 'region',
    label: 'Region',
    type: 'text',
    required: true,
    placeholder: 'e.g. Zurich, CH',
  },
  {
    key: 'paymentMethod',
    label: 'Payment Method',
    type: 'text',
    required: true,
    placeholder: 'e.g. ACH Wire •• 4821',
  },
  {
    key: 'notes',
    label: 'Operator Notes',
    type: 'textarea',
    placeholder: 'Optional compliance or fulfillment notes...',
  },
];

export function parseCommaSeparatedNumbers(input: string): number[] {
  if (!input || typeof input !== 'string') return [];
  const seen = new Set<number>();
  const results: number[] = [];
  for (const part of input.split(/[,\s]+/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const cleaned = trimmed.replace(/^ORD-/i, '');
    const n = Number(cleaned);
    if (Number.isFinite(n) && !seen.has(n)) {
      seen.add(n);
      results.push(n);
    }
  }
  return results;
}

export function applyGridFilters(
  rows: GridOrderRow[],
  filters: GridFilterValues = {},
  search: string = ''
): GridOrderRow[] {
  const q = search.trim().toLowerCase();

  const commaCodesRaw = typeof filters.commaCodes === 'string' ? filters.commaCodes : '';
  const commaCodes = parseCommaSeparatedNumbers(commaCodesRaw);

  const seatsExactRaw = filters.seatsExact;
  const seatsExact =
    seatsExactRaw !== undefined && seatsExactRaw !== null && String(seatsExactRaw).trim() !== ''
      ? Number(seatsExactRaw)
      : null;

  const amountRange = (filters.amountRange ?? {}) as { min?: string | number; max?: string | number };
  const minAmt =
    amountRange.min !== undefined && amountRange.min !== null && String(amountRange.min).trim() !== ''
      ? Number(amountRange.min)
      : null;
  const maxAmt =
    amountRange.max !== undefined && amountRange.max !== null && String(amountRange.max).trim() !== ''
      ? Number(amountRange.max)
      : null;

  const dateRange = (filters.dateRange ?? {}) as { startDate?: string; endDate?: string };
  const dateFrom = typeof dateRange.startDate === 'string' ? dateRange.startDate.trim() : '';
  const dateTo = typeof dateRange.endDate === 'string' ? dateRange.endDate.trim() : '';

  const cutoverRange = (filters.cutoverRange ?? {}) as { start?: string; end?: string };
  const cutoverFrom = typeof cutoverRange.start === 'string' ? cutoverRange.start.trim() : '';
  const cutoverTo = typeof cutoverRange.end === 'string' ? cutoverRange.end.trim() : '';

  const statuses = Array.isArray(filters.statuses) ? (filters.statuses as string[]) : [];
  const channels = Array.isArray(filters.channels) ? (filters.channels as string[]) : [];
  const companies = Array.isArray(filters.companies) ? (filters.companies as string[]) : [];
  const regions = Array.isArray(filters.regions) ? (filters.regions as string[]) : [];

  return rows.filter((row) => {
    if (q) {
      const hay = [
        row.id,
        String(row.numericCode),
        row.customerName,
        row.customerEmail,
        row.company,
        row.planOrItem,
        row.region,
        row.updatedBy,
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (commaCodes.length > 0 && !commaCodes.includes(row.numericCode)) {
      return false;
    }

    if (seatsExact !== null && !Number.isNaN(seatsExact) && row.seatsCount !== seatsExact) {
      return false;
    }

    if (minAmt !== null && !Number.isNaN(minAmt) && row.amount < minAmt) {
      return false;
    }
    if (maxAmt !== null && !Number.isNaN(maxAmt) && row.amount > maxAmt) {
      return false;
    }

    if (dateFrom && row.date < dateFrom) return false;
    if (dateTo && row.date > dateTo) return false;

    if (cutoverFrom && row.cutoverAt < cutoverFrom) return false;
    if (cutoverTo && row.cutoverAt > cutoverTo) return false;

    if (statuses.length > 0 && !statuses.includes(row.status)) return false;
    if (channels.length > 0 && !channels.includes(row.channel)) return false;
    if (companies.length > 0 && !companies.includes(row.company)) return false;
    if (regions.length > 0 && !regions.includes(row.region)) return false;

    return true;
  });
}

export function sortGridRows(
  rows: GridOrderRow[],
  sortField: string = 'date',
  sortDirection: SortDirection = 'desc'
): GridOrderRow[] {
  const factor = sortDirection === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'id':
        cmp = a.numericCode - b.numericCode;
        break;
      case 'amount':
        cmp = a.amount - b.amount;
        break;
      case 'seatsCount':
        cmp = a.seatsCount - b.seatsCount;
        break;
      case 'customerName':
        cmp = a.customerName.localeCompare(b.customerName);
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
      case 'channel':
        cmp = a.channel.localeCompare(b.channel);
        break;
      case 'region':
        cmp = a.region.localeCompare(b.region);
        break;
      case 'cutoverAt':
        cmp = a.cutoverAt.localeCompare(b.cutoverAt);
        break;
      case 'date':
      default:
        cmp = a.date.localeCompare(b.date);
        break;
    }
    if (cmp !== 0) return cmp * factor;
    return (a.numericCode - b.numericCode) * factor;
  });
}

export function paginateGridRows<T>(
  items: T[],
  requestedPage: number = 1,
  requestedPageSize: number = 6
) {
  const pageSize = Math.max(1, Math.min(100, Math.floor(requestedPageSize) || 6));
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, Math.floor(requestedPage) || 1), totalPages);
  const start = (page - 1) * pageSize;
  const sliced = items.slice(start, start + pageSize);
  return {
    items: sliced,
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

export function resolveBulkTargetRows(args: {
  allRows: GridOrderRow[];
  filteredRows: GridOrderRow[];
  pageRows: GridOrderRow[];
  scope: GridBulkScope;
  selectedIds: string[];
}): GridOrderRow[] {
  const { allRows, filteredRows, pageRows, scope, selectedIds } = args;
  switch (scope) {
    case 'selected': {
      const idSet = new Set(selectedIds);
      return allRows.filter((r) => idSet.has(r.id));
    }
    case 'current-page':
      return pageRows;
    case 'current-filter':
      return filteredRows;
    case 'all-rows':
    default:
      return allRows;
  }
}

function escapeCsvCell(value: unknown): string {
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildGridCsv(
  rows: GridOrderRow[],
  columns: GridColumnSchema[],
  visibleColumnKeys?: string[]
): string {
  const activeCols = columns.filter((col) => {
    if (col.key === '_actions') return false;
    if (!visibleColumnKeys || visibleColumnKeys.length === 0) return true;
    return visibleColumnKeys.includes(col.key) || col.locked;
  });

  const headers = activeCols.map((c) => escapeCsvCell(c.label));
  const lines = rows.map((row) =>
    activeCols
      .map((col) => escapeCsvCell((row as unknown as Record<string, unknown>)[col.key]))
      .join(',')
  );

  return [headers.join(','), ...lines].join('\n');
}

export function getRemoteFilterOptions(
  rows: GridOrderRow[],
  field: 'company' | 'region' | 'planOrItem',
  query: string = ''
): GridFilterOption[] {
  const q = query.trim().toLowerCase();
  const counts = new Map<string, number>();
  for (const row of rows) {
    const val = String(row[field] ?? '').trim();
    if (!val) continue;
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([label]) => (!q ? true : label.toLowerCase().includes(q)))
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, count]) => ({
      value: label,
      label,
      description: `${count} order${count === 1 ? '' : 's'}`,
    }));
}

export function countActiveGridFilters(filters: GridFilterValues, search: string): number {
  let count = 0;
  if (search.trim()) count += 1;
  if (typeof filters.commaCodes === 'string' && filters.commaCodes.trim()) count += 1;
  if (
    filters.seatsExact !== undefined &&
    filters.seatsExact !== null &&
    String(filters.seatsExact).trim() !== ''
  ) {
    count += 1;
  }
  const amt = (filters.amountRange ?? {}) as { min?: unknown; max?: unknown };
  if ((amt.min !== undefined && String(amt.min).trim() !== '') || (amt.max !== undefined && String(amt.max).trim() !== '')) {
    count += 1;
  }
  const dr = (filters.dateRange ?? {}) as { startDate?: string; endDate?: string };
  if (dr.startDate || dr.endDate) count += 1;
  const dt = (filters.cutoverRange ?? {}) as { start?: string; end?: string };
  if (dt.start || dt.end) count += 1;
  if (Array.isArray(filters.statuses) && filters.statuses.length > 0) count += filters.statuses.length;
  if (Array.isArray(filters.channels) && filters.channels.length > 0) count += filters.channels.length;
  if (Array.isArray(filters.companies) && filters.companies.length > 0) count += filters.companies.length;
  if (Array.isArray(filters.regions) && filters.regions.length > 0) count += filters.regions.length;
  return count;
}

export interface CrudValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  normalized?: Partial<GridOrderRow>;
}

const VALID_STATUSES: OrderStatus[] = ['Completed', 'Processing', 'Pending', 'Flagged', 'Refunded'];
const VALID_CHANNELS: OrderChannel[] = ['Direct', 'Enterprise', 'Marketplace', 'Partner'];

export function validateOrderCrudPayload(
  payload: Record<string, unknown>,
  isPatch: boolean = false
): CrudValidationResult {
  const errors: Record<string, string> = {};

  const str = (key: string) =>
    typeof payload[key] === 'string' ? payload[key].trim() : '';

  if (!isPatch || 'customerName' in payload) {
    if (!str('customerName')) errors.customerName = 'Customer name is required';
  }
  if (!isPatch || 'customerEmail' in payload) {
    const email = str('customerEmail');
    if (!email || !email.includes('@')) errors.customerEmail = 'Valid email is required';
  }
  if (!isPatch || 'company' in payload) {
    if (!str('company')) errors.company = 'Company is required';
  }
  if (!isPatch || 'planOrItem' in payload) {
    if (!str('planOrItem')) errors.planOrItem = 'Plan or item is required';
  }
  if (!isPatch || 'amount' in payload) {
    const amt = Number(payload.amount);
    if (!Number.isFinite(amt) || amt <= 0) errors.amount = 'Amount must be greater than 0';
  }
  if (!isPatch || 'seatsCount' in payload) {
    const seats = Number(payload.seatsCount ?? 1);
    if (!Number.isFinite(seats) || seats < 1) errors.seatsCount = 'Seats must be at least 1';
  }
  if ('status' in payload && !VALID_STATUSES.includes(payload.status as OrderStatus)) {
    errors.status = 'Invalid order status';
  }
  if ('channel' in payload && !VALID_CHANNELS.includes(payload.channel as OrderChannel)) {
    errors.channel = 'Invalid sales channel';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  const normalized: Partial<GridOrderRow> = {};
  if ('customerName' in payload) normalized.customerName = str('customerName');
  if ('customerEmail' in payload) normalized.customerEmail = str('customerEmail');
  if ('company' in payload) normalized.company = str('company');
  if ('planOrItem' in payload) normalized.planOrItem = str('planOrItem');
  if ('channel' in payload) normalized.channel = payload.channel as OrderChannel;
  if ('status' in payload) normalized.status = payload.status as OrderStatus;
  if ('amount' in payload) normalized.amount = Number(payload.amount);
  if ('seatsCount' in payload) normalized.seatsCount = Math.round(Number(payload.seatsCount));
  if ('date' in payload) normalized.date = str('date') || '2026-11-23';
  if ('cutoverAt' in payload) normalized.cutoverAt = str('cutoverAt') || '2026-11-23T12:00';
  if ('region' in payload) normalized.region = str('region') || 'Global';
  if ('paymentMethod' in payload) normalized.paymentMethod = str('paymentMethod') || 'Invoice Net-30';
  if ('updatedBy' in payload) normalized.updatedBy = str('updatedBy') || 'Elena Rostova';
  if ('notes' in payload) normalized.notes = str('notes') || undefined;

  return { valid: true, errors: {}, normalized };
}

export function buildOrdersGridSchemaResponse(args: {
  allRows: GridOrderRow[];
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: SortDirection;
  search?: string;
  filters?: GridFilterValues;
}): GridSchemaResponse {
  const {
    allRows,
    page = 1,
    pageSize = 6,
    sortField = 'date',
    sortDirection = 'desc',
    search = '',
    filters = {},
  } = args;

  const filtered = applyGridFilters(allRows, filters, search);
  const sorted = sortGridRows(filtered, sortField, sortDirection);
  const paged = paginateGridRows(sorted, page, pageSize);

  const statusCounts: Record<string, number> = {
    all: allRows.length,
    Completed: 0,
    Processing: 0,
    Pending: 0,
    Flagged: 0,
    Refunded: 0,
  };
  for (const row of allRows) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  }

  return {
    resource: 'orders',
    endpoint: '/api/orders',
    title: 'Orders Ledger',
    subtitle: 'Backend-automated data grid with sticky columns, 7 filter modes, bulk scopes, and CRUD.',
    primaryKey: 'id',
    columns: ORDERS_COLUMNS_SCHEMA,
    filters: ORDERS_FILTERS_SCHEMA,
    rowActions: ORDERS_ROW_ACTIONS_SCHEMA,
    bulkActions: ORDERS_BULK_ACTIONS_SCHEMA,
    crud: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      fields: ORDERS_CRUD_FIELDS_SCHEMA,
    },
    defaultVisibleColumns: ORDERS_COLUMNS_SCHEMA.filter((c) => c.visibleByDefault).map((c) => c.key),
    rows: paged.items,
    pagination: {
      page: paged.page,
      pageSize: paged.pageSize,
      totalItems: paged.totalItems,
      totalPages: paged.totalPages,
      allMatchingCount: filtered.length,
      totalDatasetCount: allRows.length,
    },
    applied: {
      search,
      sortField,
      sortDirection,
      filters,
    },
    statusCounts,
  };
}
