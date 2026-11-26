import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeGaugeRatio,
  computeRadarCoordinates,
  formatCurrencyInputString,
  formatCurrencyValue,
  formatFileSize,
  formatPhoneNumber,
  formatRelativeTime,
  parseCsvForImport,
  parseCurrencyInputString,
  slugifyText,
  validateImportedRows,
  validateJsonText,
} from './formatters';

test('formatFileSize formats bytes, KB, MB, and GB cleanly', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(1536), '1.5 KB');
  assert.equal(formatFileSize(1024 * 1024 * 3), '3 MB');
});

test('formatCurrencyValue handles USD, EUR, and Persian IRR localization', () => {
  assert.equal(formatCurrencyValue(4850, 'USD', 'en'), '$4,850');
  assert.equal(formatCurrencyValue(1200, 'EUR', 'en'), '€1,200');
  assert.equal(formatCurrencyValue(250000, 'IRR', 'fa'), '۲۵۰٬۰۰۰ ریال');
});

test('formatRelativeTime produces English and Persian relative phrases', () => {
  const now = new Date('2026-11-26T12:00:00Z').getTime();
  assert.equal(formatRelativeTime(new Date('2026-11-26T11:59:45Z'), now, 'en'), 'just now');
  assert.equal(formatRelativeTime(new Date('2026-11-26T10:00:00Z'), now, 'en'), '2 hours ago');
  assert.equal(formatRelativeTime(new Date('2026-11-26T10:00:00Z'), now, 'fa'), '۲ ساعت پیش');
});

test('slugifyText, currency input, and phone formatters work deterministically', () => {
  assert.equal(slugifyText('  Q4 Enterprise Plan!  '), 'q4-enterprise-plan');
  assert.equal(formatCurrencyInputString('1234567.89'), '1,234,567.89');
  assert.equal(parseCurrencyInputString('1,234,567.89'), 1234567.89);
  assert.equal(formatPhoneNumber('4155550198'), '(415) 555-0198');
});

test('validateJsonText validates and pretty-prints valid JSON', () => {
  const ok = validateJsonText('{"env":"prod","retries":3}');
  assert.equal(ok.valid, true);
  assert.match(ok.formatted ?? '', /"env": "prod"/);
  const bad = validateJsonText('{bad json}');
  assert.equal(bad.valid, false);
  assert.ok(bad.error);
});

test('parseCsvForImport and validateImportedRows parse and flag bad rows cleanly', () => {
  const csv = [
    'Name,Email,Company,Amount,Plan',
    '"Sara Nouri",sara@acme.io,Acme Corp,2400,Enterprise',
    'Invalid Row,not-an-email,Bad Co,0,Starter',
  ].join('\n');

  const parsed = parseCsvForImport(csv);
  assert.deepEqual(parsed.headers, ['Name', 'Email', 'Company', 'Amount', 'Plan']);
  assert.equal(parsed.rows.length, 2);

  const validated = validateImportedRows(parsed.rows, {
    customerName: 'Name',
    customerEmail: 'Email',
    company: 'Company',
    amount: 'Amount',
    planOrItem: 'Plan',
  });
  assert.equal(validated.validRows.length, 1);
  assert.equal(validated.validRows[0].amount, 2400);
  assert.equal(validated.errors.length, 1);
  assert.equal(validated.errors[0].rowIndex, 3);
});

test('computeRadarCoordinates and computeGaugeRatio clamp bounds accurately', () => {
  const pts = computeRadarCoordinates([100, 50, 0, 100], 100, 100, 80);
  assert.equal(pts.length, 4);
  assert.equal(Math.round(pts[0].x), 100);
  assert.equal(Math.round(pts[0].y), 20);
  assert.equal(computeGaugeRatio(75, 0, 100), 0.75);
  assert.equal(computeGaugeRatio(150, 0, 100), 1);
});
