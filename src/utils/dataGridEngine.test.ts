import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyGridFilters,
  buildGridCsv,
  buildInitialGridOrders,
  buildOrdersGridSchemaResponse,
  getRemoteFilterOptions,
  ORDERS_COLUMNS_SCHEMA,
  paginateGridRows,
  parseCommaSeparatedNumbers,
  resolveBulkTargetRows,
  sortGridRows,
  validateOrderCrudPayload,
} from './dataGridEngine';

test('parseCommaSeparatedNumbers extracts unique order numbers from comma and space strings', () => {
  assert.deepEqual(parseCommaSeparatedNumbers('8492, ORD-8490, 8488 8492'), [8492, 8490, 8488]);
  assert.deepEqual(parseCommaSeparatedNumbers('abc, ,'), []);
});

test('applyGridFilters handles all 7 backend filter types accurately', () => {
  const rows = buildInitialGridOrders();

  // 1. comma-numbers
  const byCodes = applyGridFilters(rows, { commaCodes: '8492, 8490' });
  assert.deepEqual(
    byCodes.map((r) => r.id),
    ['ORD-8492', 'ORD-8490']
  );

  // 2. number (exact seatsCount)
  const bySeats = applyGridFilters(rows, { seatsExact: 12 });
  assert.deepEqual(
    bySeats.map((r) => r.id),
    ['ORD-8490', 'ORD-8487']
  );

  // 3. number-range (amount)
  const byAmountRange = applyGridFilters(rows, { amountRange: { min: 4800, max: 6400 } });
  assert.ok(byAmountRange.every((r) => r.amount >= 4800 && r.amount <= 6400));
  assert.equal(byAmountRange.length, 4);

  // 4. date-range
  const byDateRange = applyGridFilters(rows, {
    dateRange: { startDate: '2026-11-20', endDate: '2026-11-22' },
  });
  assert.deepEqual(
    byDateRange.map((r) => r.id),
    ['ORD-8492', 'ORD-8491', 'ORD-8490', 'ORD-8489']
  );

  // 5. datetime-range (cutoverAt)
  const byCutover = applyGridFilters(rows, {
    cutoverRange: { start: '2026-11-21T12:00', end: '2026-11-22T15:00' },
  });
  assert.deepEqual(
    byCutover.map((r) => r.id),
    ['ORD-8492', 'ORD-8490']
  );

  // 6. multi-select (statuses & channels)
  const byMulti = applyGridFilters(rows, {
    statuses: ['Flagged'],
    channels: ['Enterprise', 'Partner'],
  });
  assert.deepEqual(
    byMulti.map((r) => r.id),
    ['ORD-8490', 'ORD-8482']
  );

  // 7. multi-select-ajax (companies & regions)
  const byAjax = applyGridFilters(rows, {
    companies: ['Northstar Labs', 'Kurokawa Robotics'],
  });
  assert.deepEqual(
    byAjax.map((r) => r.id),
    ['ORD-8492', 'ORD-8491']
  );
});

test('resolveBulkTargetRows resolves selected, current-page, current-filter, and all-rows scopes', () => {
  const allRows = buildInitialGridOrders();
  const filteredRows = applyGridFilters(allRows, { statuses: ['Completed'] });
  const paged = paginateGridRows(filteredRows, 1, 3);

  assert.equal(
    resolveBulkTargetRows({
      allRows,
      filteredRows,
      pageRows: paged.items,
      scope: 'selected',
      selectedIds: ['ORD-8492', 'ORD-8489'],
    }).length,
    2
  );
  assert.equal(
    resolveBulkTargetRows({
      allRows,
      filteredRows,
      pageRows: paged.items,
      scope: 'current-page',
      selectedIds: [],
    }).length,
    3
  );
  assert.equal(
    resolveBulkTargetRows({
      allRows,
      filteredRows,
      pageRows: paged.items,
      scope: 'current-filter',
      selectedIds: [],
    }).length,
    filteredRows.length
  );
  assert.equal(
    resolveBulkTargetRows({
      allRows,
      filteredRows,
      pageRows: paged.items,
      scope: 'all-rows',
      selectedIds: [],
    }).length,
    allRows.length
  );
});

test('buildGridCsv exports only selected visible columns plus locked ID and excludes _actions', () => {
  const rows = buildInitialGridOrders().slice(0, 2);
  const csv = buildGridCsv(rows, ORDERS_COLUMNS_SCHEMA, ['id', 'customerName', 'amount', '_actions']);
  const lines = csv.split('\n');
  assert.equal(lines[0], 'Order ID,Customer,Amount');
  assert.ok(lines[1].startsWith('ORD-8492,Marcus Chen,4850'));
});

test('getRemoteFilterOptions filters company options case-insensitively', () => {
  const rows = buildInitialGridOrders();
  const matches = getRemoteFilterOptions(rows, 'company', 'north');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].value, 'Northstar Labs');
});

test('validateOrderCrudPayload enforces required fields and normalizes valid CRUD payloads', () => {
  const invalid = validateOrderCrudPayload({ customerName: '', amount: -10 });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.customerName);
  assert.ok(invalid.errors.amount);

  const valid = validateOrderCrudPayload({
    customerName: 'Maya Lin',
    customerEmail: 'maya@helios.io',
    company: 'Helios Dynamics',
    planOrItem: 'Enterprise Cluster',
    channel: 'Enterprise',
    status: 'Pending',
    amount: 4200,
    seatsCount: 16,
    date: '2026-11-23',
    cutoverAt: '2026-11-23T15:30',
    region: 'Zurich, CH',
    paymentMethod: 'ACH Wire',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.normalized?.amount, 4200);
  assert.equal(valid.normalized?.seatsCount, 16);
});

test('buildOrdersGridSchemaResponse assembles complete backend schema and paginated rows', () => {
  const allRows = buildInitialGridOrders();
  const sorted = sortGridRows(allRows, 'amount', 'desc');
  const res = buildOrdersGridSchemaResponse({
    allRows: sorted,
    page: 1,
    pageSize: 6,
    sortField: 'amount',
    sortDirection: 'desc',
  });
  assert.equal(res.columns[0].sticky, 'start');
  assert.equal(res.columns[res.columns.length - 1].sticky, 'end');
  assert.equal(res.rows.length, 6);
  assert.equal(res.pagination.totalItems, allRows.length);
  assert.ok(res.rowActions.some((a) => a.actionType === 'submenu' && (a.children?.length ?? 0) >= 3));
  assert.ok(res.bulkActions.some((b) => b.critical));
});
