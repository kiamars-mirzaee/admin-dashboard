import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeOrderMetrics,
  countActiveFilters,
  exportOrdersToCsv,
  filterOrders,
  getActiveFilterTokens,
  paginateItems,
  sortOrders,
} from './tableLogic';
import { DEFAULT_ORDER_FILTERS, INITIAL_ORDERS } from '../data/seedData';
import type { OrderFilters } from '../types/admin';

test('filterOrders filters by search query across customer, id, and company', () => {
  const byCompany = filterOrders(INITIAL_ORDERS, {
    ...DEFAULT_ORDER_FILTERS,
    search: 'kurokawa',
  });
  assert.equal(byCompany.length, 1);
  assert.equal(byCompany[0].id, 'ORD-8491');

  const byId = filterOrders(INITIAL_ORDERS, {
    ...DEFAULT_ORDER_FILTERS,
    search: 'ORD-8488',
  });
  assert.equal(byId.length, 1);
  assert.equal(byId[0].customerName, 'Samuel Okafor');
});

test('filterOrders supports multi-status and channel combinations', () => {
  const filters: OrderFilters = {
    ...DEFAULT_ORDER_FILTERS,
    statuses: ['Flagged', 'Pending'],
    channel: 'Enterprise',
  };
  const result = filterOrders(INITIAL_ORDERS, filters);
  assert.deepEqual(
    result.map((o) => o.id),
    ['ORD-8488', 'ORD-8482']
  );
});

test('filterOrders respects 7d date preset and numeric amount bounds', () => {
  const filters: OrderFilters = {
    ...DEFAULT_ORDER_FILTERS,
    datePreset: '7d',
    minAmount: '2000',
    maxAmount: '5000',
  };
  const result = filterOrders(INITIAL_ORDERS, filters, '2026-11-22');
  assert.ok(result.length > 0);
  for (const row of result) {
    assert.ok(row.date >= '2026-11-15');
    assert.ok(row.amount >= 2000 && row.amount <= 5000);
  }
});

test('filterOrders respects custom date range', () => {
  const filters: OrderFilters = {
    ...DEFAULT_ORDER_FILTERS,
    datePreset: 'custom',
    dateFrom: '2026-10-01',
    dateTo: '2026-10-31',
  };
  const result = filterOrders(INITIAL_ORDERS, filters);
  assert.deepEqual(
    result.map((o) => o.id),
    ['ORD-8480', 'ORD-8479', 'ORD-8478']
  );
});

test('sortOrders sorts deterministically by amount descending and ascending', () => {
  const desc = sortOrders(INITIAL_ORDERS, { field: 'amount', direction: 'desc' });
  assert.equal(desc[0].amount, 6400);
  assert.equal(desc[desc.length - 1].amount, 240);

  const asc = sortOrders(INITIAL_ORDERS, { field: 'amount', direction: 'asc' });
  assert.equal(asc[0].amount, 240);
  assert.equal(asc[asc.length - 1].amount, 6400);
});

test('paginateItems clamps out-of-range page numbers cleanly', () => {
  const page1 = paginateItems(INITIAL_ORDERS, 1, 5);
  assert.equal(page1.items.length, 5);
  assert.equal(page1.totalPages, 4);
  assert.equal(page1.startIndex, 0);
  assert.equal(page1.endIndex, 5);

  const clamped = paginateItems(INITIAL_ORDERS, 99, 5);
  assert.equal(clamped.currentPage, 4);
  assert.equal(clamped.items.length, 1);
});

test('countActiveFilters and getActiveFilterTokens reflect active criteria accurately', () => {
  assert.equal(countActiveFilters(DEFAULT_ORDER_FILTERS), 0);
  assert.deepEqual(getActiveFilterTokens(DEFAULT_ORDER_FILTERS), []);

  const active: OrderFilters = {
    ...DEFAULT_ORDER_FILTERS,
    search: 'Marcus',
    statuses: ['Completed', 'Flagged'],
    channel: 'Enterprise',
    minAmount: '1000',
  };
  assert.equal(countActiveFilters(active), 5);
  const tokens = getActiveFilterTokens(active);
  assert.equal(tokens.length, 5);
});

test('computeOrderMetrics excludes refunded orders from total revenue and counts flagged items', () => {
  const metrics = computeOrderMetrics(INITIAL_ORDERS);
  assert.equal(metrics.flaggedCount, 2);
  assert.equal(metrics.pendingOrProcessingCount, 4);
  assert.ok(metrics.totalRevenue > metrics.completedRevenue);
  assert.ok(metrics.averageOrderValue > 0);
});

test('exportOrdersToCsv escapes commas and quotes per RFC-4180', () => {
  const csv = exportOrdersToCsv([INITIAL_ORDERS[0]]);
  const lines = csv.split('\n');
  assert.equal(lines.length, 2);
  assert.ok(lines[1].includes('"San Francisco, US"'));
  assert.ok(lines[1].includes('ORD-8492'));
});
