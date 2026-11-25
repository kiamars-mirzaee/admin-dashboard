import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDateTimeDisplay,
  formatDateTimeIso,
  parseDateTimeIso,
  to12HourParts,
  to24Hour,
} from './dateTime';

test('parseDateTimeIso parses valid YYYY-MM-DDTHH:mm strings and rejects invalid bounds', () => {
  assert.deepEqual(parseDateTimeIso('2026-11-22T14:30'), {
    date: '2026-11-22',
    hour24: 14,
    minute: 30,
  });
  assert.deepEqual(parseDateTimeIso('2026-11-22 00:05'), {
    date: '2026-11-22',
    hour24: 0,
    minute: 5,
  });
  assert.equal(parseDateTimeIso('2026-11-22T25:00'), null);
  assert.equal(parseDateTimeIso('2026-02-30T10:00'), null);
  assert.equal(formatDateTimeIso('2026-11-22', 9, 5), '2026-11-22T09:05');
});

test('12h and 24h conversion helpers handle midnight, noon, AM, and PM accurately', () => {
  assert.deepEqual(to12HourParts(0), { hour12: 12, period: 'AM' });
  assert.deepEqual(to12HourParts(12), { hour12: 12, period: 'PM' });
  assert.deepEqual(to12HourParts(15), { hour12: 3, period: 'PM' });

  assert.equal(to24Hour(12, 'AM'), 0);
  assert.equal(to24Hour(12, 'PM'), 12);
  assert.equal(to24Hour(3, 'PM'), 15);
  assert.equal(to24Hour(9, 'AM'), 9);
});

test('formatDateTimeDisplay renders Gregorian/Persian and 24h/12h strings cleanly', () => {
  assert.equal(
    formatDateTimeDisplay('2026-11-22T14:30', { use24Hour: true, calendar: 'gregorian' }),
    '2026-11-22 · 14:30'
  );
  assert.equal(
    formatDateTimeDisplay('2026-11-22T14:30', { use24Hour: false, calendar: 'gregorian' }),
    '2026-11-22 · 02:30 PM'
  );
  assert.equal(
    formatDateTimeDisplay('2026-11-22T14:30', { use24Hour: true, calendar: 'persian' }),
    '۱۴۰۵/۰۹/۰۱ · ۱۴:۳۰'
  );
});
