import test from 'node:test';
import assert from 'node:assert/strict';
import { ORDERS_COLUMNS_SCHEMA, buildInitialGridOrders } from './dataGridEngine';
import {
  buildOrderPrintDocumentMeta,
  buildPrintableColumns,
  buildPrintableFilterSummary,
  computePrintableGridSummary,
  formatPrintableCellValue,
  formatPrintTimestamp,
} from './printExport';

test('buildPrintableColumns strips sticky-end actions column and preserves locked + visible columns', () => {
  const visible = buildPrintableColumns(ORDERS_COLUMNS_SCHEMA, [
    'id',
    'customerName',
    'amount',
  ]);
  const keys = visible.map((c) => c.key);

  assert.equal(keys.includes('actions'), false);
  assert.equal(keys.includes('id'), true);
  assert.equal(keys.includes('customerName'), true);
  assert.equal(keys.includes('amount'), true);
  assert.equal(keys.includes('region'), false);
});

test('buildPrintableColumns falls back to visibleByDefault when no custom keys are passed', () => {
  const defaults = buildPrintableColumns(ORDERS_COLUMNS_SCHEMA, null);
  assert.ok(defaults.every((col) => col.sticky !== 'end'));
  assert.ok(defaults.some((col) => col.key === 'status'));
  assert.equal(
    defaults.some((col) => col.key === 'cutoverAt'),
    false
  );
});

test('formatPrintableCellValue formats currency, datetime, channel, status, and composite avatar columns cleanly', () => {
  const rows = buildInitialGridOrders();
  const row = rows[0];
  const customerCol = ORDERS_COLUMNS_SCHEMA.find((c) => c.key === 'customerName')!;
  const amountCol = ORDERS_COLUMNS_SCHEMA.find((c) => c.key === 'amount')!;
  const cutoverCol = ORDERS_COLUMNS_SCHEMA.find((c) => c.key === 'cutoverAt')!;
  const channelCol = ORDERS_COLUMNS_SCHEMA.find((c) => c.key === 'channel')!;

  assert.equal(
    formatPrintableCellValue(row, customerCol),
    `${row.customerName} (${row.company})`
  );
  assert.ok(formatPrintableCellValue(row, amountCol).startsWith('$'));
  assert.equal(
    formatPrintableCellValue(row, cutoverCol).includes('T'),
    false
  );
  assert.equal(
    formatPrintableCellValue(row, channelCol, {
      channelLabel: (ch) => `CH:${ch}`,
    }),
    `CH:${row.channel}`
  );
});

test('computePrintableGridSummary calculates totals, settled volume, averages, and status counts', () => {
  const summary = computePrintableGridSummary([
    { amount: 12000, status: 'Completed' },
    { amount: 6000, status: 'Flagged' },
    { amount: 3000, status: 'Pending' },
  ]);

  assert.equal(summary.count, 3);
  assert.equal(summary.grossVolume, 21000);
  assert.equal(summary.settledRevenue, 12000);
  assert.equal(summary.averageOrder, 7000);
  assert.equal(summary.flaggedCount, 1);
  assert.equal(summary.pendingCount, 1);

  const empty = computePrintableGridSummary([]);
  assert.equal(empty.count, 0);
  assert.equal(empty.averageOrder, 0);
});

test('buildOrderPrintDocumentMeta builds canonical QR deep-link URI and formatted timestamp', () => {
  const meta = buildOrderPrintDocumentMeta(
    { id: 'ORD-8490', notes: 'Verify wire clearance before provisioning.' },
    '2026-11-23T14:05:00.000Z'
  );
  assert.equal(meta.documentNumber, 'DOC-ORD-8490');
  assert.equal(meta.qrPayload, 'kestrel://order/ORD-8490');
  assert.equal(meta.generatedAtDisplay, '2026-11-23 14:05 UTC');
  assert.equal(meta.hasNotes, true);

  assert.equal(formatPrintTimestamp('invalid-date'), 'invalid-date');
});

test('buildPrintableFilterSummary joins active chips or falls back cleanly', () => {
  assert.equal(
    buildPrintableFilterSummary([], 'No active filters'),
    'No active filters'
  );
  assert.equal(
    buildPrintableFilterSummary(
      [{ label: 'Status: Flagged' }, { label: 'Amount: 5000 – ∞' }],
      'No active filters'
    ),
    'Status: Flagged · Amount: 5000 – ∞'
  );
});
