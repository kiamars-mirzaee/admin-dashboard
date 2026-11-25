import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_ORDERS } from '../data/seedData';
import type { GridColumnSchema } from '../types/dataGrid';
import {
  buildDataGridPdfSpec,
  buildOrderPdfSpec,
  containsNonLatinScript,
  sanitizePdfFilename,
} from './pdfDocument';
import {
  exportDataGridToPdf,
  exportOrderToPdf,
} from '../services/pdfExportService';

const SAMPLE_COLUMNS: GridColumnSchema[] = [
  { key: 'id', label: 'Order ID', type: 'id', sticky: 'start', locked: true, sortable: true, visibleByDefault: true },
  { key: 'customerName', label: 'Customer', type: 'avatar-text', sortable: true, visibleByDefault: true },
  { key: 'channel', label: 'Channel', type: 'text', sortable: false, visibleByDefault: true },
  { key: 'status', label: 'Status', type: 'status', sortable: true, visibleByDefault: true },
  { key: 'date', label: 'Date', type: 'date', sortable: true, visibleByDefault: true },
  { key: 'amount', label: 'Amount', type: 'currency', align: 'right', sortable: true, visibleByDefault: true },
  { key: 'actions', label: 'Actions', type: 'text', sticky: 'end', locked: true, sortable: false, visibleByDefault: true },
];

test('sanitizePdfFilename normalizes names and guarantees .pdf suffix', () => {
  assert.equal(sanitizePdfFilename('ORD-8490 / report'), 'ORD-8490-report.pdf');
  assert.equal(sanitizePdfFilename('ledger.pdf'), 'ledger.pdf');
  assert.equal(sanitizePdfFilename('   ', 'fallback'), 'fallback.pdf');
});

test('containsNonLatinScript detects Arabic/Persian text accurately', () => {
  assert.equal(containsNonLatinScript(['Northstar Labs', 'ORD-8492']), false);
  assert.equal(containsNonLatinScript(['دفتر کل سفارش‌ها', 'ORD-8492']), true);
  assert.equal(containsNonLatinScript(['ملخص الطلب']), true);
});

test('buildOrderPdfSpec constructs print-ready portrait document specification', () => {
  const order = INITIAL_ORDERS[0];
  const spec = buildOrderPdfSpec(order, {
    generatedAt: '2026-11-24T12:00:00Z',
    includeNotes: true,
  });

  assert.equal(spec.filename, `kestrel-${order.id}.pdf`);
  assert.equal(spec.orientation, 'portrait');
  assert.equal(spec.documentNumber, `DOC-${order.id}`);
  assert.equal(spec.qrPayload, `kestrel://order/${order.id}`);
  assert.equal(spec.generatedAt, '2026-11-24 12:00 UTC');
  assert.equal(spec.lineItemRows[0][0], order.planOrItem);
  assert.equal(spec.totalAmountFormatted, '$4,850');
  assert.ok(spec.notesText && spec.notesText.includes('Multi-seat'));
});

test('buildDataGridPdfSpec strips actions column, chooses landscape for wide grids, and adds summary total row', () => {
  const rows = INITIAL_ORDERS.slice(0, 4);
  const spec = buildDataGridPdfSpec(rows, SAMPLE_COLUMNS, {
    generatedAt: '2026-11-24T12:00:00Z',
    filterChips: [{ label: 'Status: Completed' }],
    scopeLabel: 'Current page (4)',
  });

  assert.equal(spec.headers.includes('Actions'), false);
  assert.equal(spec.columns.length, 6);
  assert.equal(spec.orientation, 'landscape');
  assert.equal(spec.rows.length, 4);
  assert.equal(spec.filterSummary, 'Status: Completed');
  assert.ok(spec.totalFooterRow);
  assert.equal(spec.totalFooterRow![5], '$11,170');
});

test('exportOrderToPdf and exportDataGridToPdf generate valid non-empty PDF blobs', async () => {
  const orderRes = await exportOrderToPdf(INITIAL_ORDERS[0], {
    autoDownload: false,
    includeQr: true,
    includeNotes: true,
  });
  assert.equal(orderRes.filename, `kestrel-${INITIAL_ORDERS[0].id}.pdf`);
  assert.ok(orderRes.byteLength > 1000);
  const orderHeader = await orderRes.blob.slice(0, 5).text();
  assert.equal(orderHeader, '%PDF-');

  const gridRes = await exportDataGridToPdf(
    {
      rows: INITIAL_ORDERS.slice(0, 8),
      columns: SAMPLE_COLUMNS,
      scopeLabel: 'Current page (8)',
      filterChips: [{ label: 'Channel: Enterprise' }],
    },
    { autoDownload: false }
  );
  assert.ok(gridRes.filename.endsWith('.pdf'));
  assert.equal(gridRes.rowCount, 8);
  assert.ok(gridRes.byteLength > 1200);
  const gridHeader = await gridRes.blob.slice(0, 5).text();
  assert.equal(gridHeader, '%PDF-');
});
