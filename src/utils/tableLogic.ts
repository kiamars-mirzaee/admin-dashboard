import type {
  OrderFilters,
  OrderRecord,
  SortConfig,
} from '../types/admin';

export interface PaginationResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  startIndex: number;
  endIndex: number;
}

export interface ActiveFilterToken {
  key: string;
  label: string;
}

export interface OrderMetrics {
  totalRevenue: number;
  completedRevenue: number;
  pendingOrProcessingCount: number;
  flaggedCount: number;
  averageOrderValue: number;
}

function parseIsoDateUtc(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return NaN;
  return Date.UTC(y, m - 1, d);
}

export function filterOrders(
  orders: OrderRecord[],
  filters: OrderFilters,
  referenceDateIso: string = '2026-11-22'
): OrderRecord[] {
  const query = filters.search.trim().toLowerCase();
  const minAmt = filters.minAmount.trim() !== '' ? Number(filters.minAmount) : null;
  const maxAmt = filters.maxAmount.trim() !== '' ? Number(filters.maxAmount) : null;

  const refMs = parseIsoDateUtc(referenceDateIso);
  let presetCutoffMs: number | null = null;
  if (filters.datePreset === '7d' && !Number.isNaN(refMs)) {
    presetCutoffMs = refMs - 7 * 86_400_000;
  } else if (filters.datePreset === '30d' && !Number.isNaN(refMs)) {
    presetCutoffMs = refMs - 30 * 86_400_000;
  } else if (filters.datePreset === '90d' && !Number.isNaN(refMs)) {
    presetCutoffMs = refMs - 90 * 86_400_000;
  }

  const fromMs =
    filters.datePreset === 'custom' && filters.dateFrom
      ? parseIsoDateUtc(filters.dateFrom)
      : null;
  const toMs =
    filters.datePreset === 'custom' && filters.dateTo
      ? parseIsoDateUtc(filters.dateTo)
      : null;

  return orders.filter((order) => {
    if (query) {
      const haystack = [
        order.id,
        order.customerName,
        order.customerEmail,
        order.company,
        order.planOrItem,
        order.region,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (filters.statuses.length > 0 && !filters.statuses.includes(order.status)) {
      return false;
    }

    if (filters.channel !== 'all' && order.channel !== filters.channel) {
      return false;
    }

    if (minAmt !== null && !Number.isNaN(minAmt) && order.amount < minAmt) {
      return false;
    }

    if (maxAmt !== null && !Number.isNaN(maxAmt) && order.amount > maxAmt) {
      return false;
    }

    const orderMs = parseIsoDateUtc(order.date);
    if (presetCutoffMs !== null && !Number.isNaN(orderMs)) {
      if (orderMs < presetCutoffMs) return false;
    }
    if (fromMs !== null && !Number.isNaN(fromMs) && !Number.isNaN(orderMs)) {
      if (orderMs < fromMs) return false;
    }
    if (toMs !== null && !Number.isNaN(toMs) && !Number.isNaN(orderMs)) {
      if (orderMs > toMs) return false;
    }

    return true;
  });
}

export function sortOrders(orders: OrderRecord[], sort: SortConfig): OrderRecord[] {
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...orders].sort((a, b) => {
    switch (sort.field) {
      case 'amount':
        return (a.amount - b.amount) * factor;
      case 'customerName':
        return a.customerName.localeCompare(b.customerName) * factor;
      case 'status':
        return a.status.localeCompare(b.status) * factor;
      case 'date':
      default: {
        const cmp = a.date.localeCompare(b.date);
        if (cmp !== 0) return cmp * factor;
        return a.id.localeCompare(b.id) * factor;
      }
    }
  });
}

export function paginateItems<T>(
  items: T[],
  requestedPage: number,
  pageSize: number
): PaginationResult<T> {
  const safeSize = Math.max(1, pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * safeSize;
  const endIndex = Math.min(startIndex + safeSize, totalItems);

  return {
    items: items.slice(startIndex, endIndex),
    totalItems,
    totalPages,
    currentPage,
    startIndex,
    endIndex,
  };
}

export function countActiveFilters(filters: OrderFilters): number {
  let count = 0;
  if (filters.search.trim()) count += 1;
  if (filters.statuses.length > 0) count += filters.statuses.length;
  if (filters.channel !== 'all') count += 1;
  if (filters.datePreset !== 'all') count += 1;
  if (filters.minAmount.trim() || filters.maxAmount.trim()) count += 1;
  return count;
}

export function getActiveFilterTokens(filters: OrderFilters): ActiveFilterToken[] {
  const tokens: ActiveFilterToken[] = [];
  if (filters.search.trim()) {
    tokens.push({ key: 'search', label: `Search: "${filters.search.trim()}"` });
  }
  for (const status of filters.statuses) {
    tokens.push({ key: `status:${status}`, label: `Status: ${status}` });
  }
  if (filters.channel !== 'all') {
    tokens.push({ key: 'channel', label: `Channel: ${filters.channel}` });
  }
  if (filters.datePreset === 'custom') {
    const rangeText = `${filters.dateFrom || 'Any'} to ${filters.dateTo || 'Any'}`;
    tokens.push({ key: 'date', label: `Dates: ${rangeText}` });
  } else if (filters.datePreset !== 'all') {
    const map = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days' };
    tokens.push({ key: 'date', label: `Period: ${map[filters.datePreset]}` });
  }
  if (filters.minAmount.trim() || filters.maxAmount.trim()) {
    const minLabel = filters.minAmount.trim() ? `$${filters.minAmount.trim()}` : '$0';
    const maxLabel = filters.maxAmount.trim() ? `$${filters.maxAmount.trim()}` : 'Any';
    tokens.push({ key: 'amount', label: `Amount: ${minLabel} – ${maxLabel}` });
  }
  return tokens;
}

export function computeOrderMetrics(orders: OrderRecord[]): OrderMetrics {
  let totalRevenue = 0;
  let completedRevenue = 0;
  let pendingOrProcessingCount = 0;
  let flaggedCount = 0;

  for (const order of orders) {
    if (order.status !== 'Refunded') {
      totalRevenue += order.amount;
    }
    if (order.status === 'Completed') {
      completedRevenue += order.amount;
    }
    if (order.status === 'Pending' || order.status === 'Processing') {
      pendingOrProcessingCount += 1;
    }
    if (order.status === 'Flagged') {
      flaggedCount += 1;
    }
  }

  const nonRefundedCount = orders.filter((o) => o.status !== 'Refunded').length;
  const averageOrderValue =
    nonRefundedCount > 0 ? Math.round(totalRevenue / nonRefundedCount) : 0;

  return {
    totalRevenue,
    completedRevenue,
    pendingOrProcessingCount,
    flaggedCount,
    averageOrderValue,
  };
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportOrdersToCsv(orders: OrderRecord[]): string {
  const headers = [
    'Order ID',
    'Customer',
    'Email',
    'Company',
    'Plan / Item',
    'Channel',
    'Status',
    'Amount (USD)',
    'Date',
    'Region',
  ];
  const rows = orders.map((o) =>
    [
      o.id,
      o.customerName,
      o.customerEmail,
      o.company,
      o.planOrItem,
      o.channel,
      o.status,
      o.amount,
      o.date,
      o.region,
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
