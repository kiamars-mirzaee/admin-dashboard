import assert from 'node:assert/strict';
import test from 'node:test';
import {
  comparePersianStrings,
  computeJsonDiff,
  describeCronExpression,
  evaluateConditionalField,
  matchesNormalizedQuery,
  normalizeDigits,
  normalizePersianText,
  sortByPersianField,
} from './persianRtl';

test('normalizeDigits converts Persian and Eastern Arabic digits to ASCII 0-9', () => {
  assert.equal(normalizeDigits('ORD-۸۴۹۰'), 'ORD-8490');
  assert.equal(normalizeDigits('١٢٣٤٥٦٧٨٩٠'), '1234567890');
  assert.equal(normalizeDigits('۱۴۰۵/۰۹/۰۵'), '1405/09/05');
});

test('normalizePersianText unifies Yeh/Kaf variants, strips ZWNJ, and normalizes digits', () => {
  assert.equal(normalizePersianText('مي‌خواهم كتاب يك'), 'میخواهم کتاب یک');
  assert.equal(matchesNormalizedQuery('گزارش مالی می‌رسد — ORD-8490', 'مالی میرسد'), true);
  assert.equal(matchesNormalizedQuery('سفارش ORD-8490 ثبت شد', '۸۴۹۰'), true);
  assert.equal(matchesNormalizedQuery('شرکت فناوری كيان', 'کیان'), true);
});

test('comparePersianStrings and sortByPersianField sort cleanly with Intl.Collator(fa)', () => {
  const rows = [
    { name: 'گزارش' },
    { name: 'آمار' },
    { name: 'پرونده' },
    { name: 'بایگانی' },
  ];
  const sorted = sortByPersianField(rows, (r) => r.name, 'asc');
  assert.deepEqual(
    sorted.map((r) => r.name),
    ['آمار', 'بایگانی', 'پرونده', 'گزارش']
  );
  assert.ok(comparePersianStrings('آمار', 'بایگانی') < 0);
});

test('computeJsonDiff classifies added, removed, changed, and unchanged keys', () => {
  const diff = computeJsonDiff(
    { status: 'pending', amount: 1200, oldNote: 'check' },
    { status: 'settled', amount: 1200, reviewer: 'Elena' }
  );
  const byKey = Object.fromEntries(diff.map((d) => [d.key, d.status]));
  assert.equal(byKey.status, 'changed');
  assert.equal(byKey.amount, 'unchanged');
  assert.equal(byKey.oldNote, 'removed');
  assert.equal(byKey.reviewer, 'added');
});

test('describeCronExpression summarizes common 5-field schedules', () => {
  assert.equal(describeCronExpression('*/15 * * * *'), 'Every 15 minutes');
  assert.equal(describeCronExpression('0 9 * * 1-5'), 'Weekdays (Mon–Fri) at 09:00 UTC');
  assert.equal(describeCronExpression('30 14 * * *'), 'Every day at 14:30 UTC');
});

test('evaluateConditionalField evaluates dependsOn rules accurately', () => {
  const values = { channel: 'Enterprise', requirePo: true };
  assert.equal(
    evaluateConditionalField({ dependsOn: 'channel', operator: 'equals', value: 'Enterprise' }, values),
    true
  );
  assert.equal(
    evaluateConditionalField({ dependsOn: 'channel', operator: 'in', value: ['Partner', 'Direct'] }, values),
    false
  );
  assert.equal(
    evaluateConditionalField({ dependsOn: 'requirePo', operator: 'truthy' }, values),
    true
  );
});
