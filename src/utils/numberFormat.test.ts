import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBytesValue,
  formatNumberValue,
  getContrastRatio,
  hexToRgb,
  isValidHexColor,
  normalizeHexColor,
  toArabicDigits,
  toLatinDigits,
  toPersianDigits,
} from './numberFormat';

test('toPersianDigits and toArabicDigits convert digits and optional separators cleanly', () => {
  assert.equal(toPersianDigits('1405/09/01'), '۱۴۰۵/۰۹/۰۱');
  assert.equal(toPersianDigits('1,250.75', true), '۱٬۲۵۰٫۷۵');
  assert.equal(toArabicDigits('2026-11-22'), '٢٠٢٦-١١-٢٢');
  assert.equal(toLatinDigits('۱٬۲۵۰٫۷۵'), '1250.75');
  assert.equal(toLatinDigits('٢٠٢٦'), '2026');
});

test('formatNumberValue supports decimal, currency, percent, compact, bytes, and numeral scripts', () => {
  assert.equal(formatNumberValue(12540.5, { style: 'decimal', decimals: 1 }), '12,540.5');
  assert.equal(
    formatNumberValue(12540.5, { style: 'decimal', decimals: 1, script: 'persian' }),
    '۱۲٬۵۴۰٫۵'
  );
  assert.equal(
    formatNumberValue(8450, { style: 'currency', currency: 'USD', decimals: 0 }),
    '$8,450'
  );
  assert.equal(
    formatNumberValue(14.8, { style: 'percent', decimals: 1, script: 'persian' }),
    '۱۴٫۸%'
  );
  assert.equal(formatNumberValue(1250000, { style: 'compact', decimals: 1 }), '1.3M');
  assert.equal(formatBytesValue(2621440, 1), '2.5 MB');
  assert.equal(
    formatNumberValue(2621440, { style: 'bytes', decimals: 1, script: 'persian' }),
    '۲٫۵ MB'
  );
});

test('color helpers validate, normalize hex codes, extract RGB, and compute contrast ratio', () => {
  assert.equal(isValidHexColor('#2563eb'), true);
  assert.equal(isValidHexColor('#fff'), true);
  assert.equal(isValidHexColor('not-a-hex'), false);
  assert.equal(normalizeHexColor('#38f'), '#3388FF');
  assert.deepEqual(hexToRgb('#2563EB'), { r: 37, g: 99, b: 235 });
  assert.equal(getContrastRatio('#000000', '#FFFFFF'), 21);
  assert.ok(getContrastRatio('#2563EB', '#FFFFFF') > 5);
});
