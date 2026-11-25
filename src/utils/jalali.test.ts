import test from 'node:test';
import assert from 'node:assert/strict';
import {
  diffDaysInclusive,
  formatIsoDate,
  getGregorianMonthDays,
  getJalaliMonthDays,
  getJalaliMonthStartWeekday,
  gregorianToJalali,
  isJalaliLeapYear,
  isoToJalaliString,
  jalaliToGregorian,
  parseIsoDate,
} from './jalali';

test('gregorianToJalali converts exact reference dates and round-trips cleanly', () => {
  // 2026-11-22 -> 1405-09-01 (1 Azar 1405)
  assert.deepEqual(gregorianToJalali(2026, 11, 22), { jy: 1405, jm: 9, jd: 1 });
  assert.deepEqual(jalaliToGregorian(1405, 9, 1), { gy: 2026, gm: 11, gd: 22 });

  // Nowruz 1405: 2026-03-21 -> 1405-01-01
  assert.deepEqual(gregorianToJalali(2026, 3, 21), { jy: 1405, jm: 1, jd: 1 });
  assert.deepEqual(jalaliToGregorian(1405, 1, 1), { gy: 2026, gm: 3, gd: 21 });

  // Leap year end: 1403-12-30 -> 2025-03-20
  assert.deepEqual(jalaliToGregorian(1403, 12, 30), { gy: 2025, gm: 3, gd: 20 });
  assert.deepEqual(gregorianToJalali(2025, 3, 20), { jy: 1403, jm: 12, jd: 30 });
});

test('isJalaliLeapYear and getJalaliMonthDays handle leap vs common Esfand', () => {
  assert.equal(isJalaliLeapYear(1403), true);
  assert.equal(isJalaliLeapYear(1404), false);
  assert.equal(isJalaliLeapYear(1405), false);

  assert.equal(getJalaliMonthDays(1405, 1), 31);
  assert.equal(getJalaliMonthDays(1405, 7), 30);
  assert.equal(getJalaliMonthDays(1405, 12), 29);
  assert.equal(getJalaliMonthDays(1403, 12), 30);
});

test('getJalaliMonthStartWeekday indexes Saturday as 0 through Friday as 6', () => {
  // 1405-09-01 = 2026-11-22 = Sunday -> Saturday=0, Sunday=1
  assert.equal(getJalaliMonthStartWeekday(1405, 9), 1);
  // 1405-01-01 = 2026-03-21 = Saturday -> 0
  assert.equal(getJalaliMonthStartWeekday(1405, 1), 0);
});

test('ISO helpers parse, format, convert to Jalali, and count inclusive range days', () => {
  assert.equal(formatIsoDate(2026, 11, 22), '2026-11-22');
  assert.deepEqual(parseIsoDate('2026-11-22'), { gy: 2026, gm: 11, gd: 22 });
  assert.equal(parseIsoDate('2026-02-30'), null);
  assert.equal(getGregorianMonthDays(2024, 2), 29);
  assert.equal(isoToJalaliString('2026-11-22'), '1405/09/01');
  assert.equal(diffDaysInclusive('2026-11-16', '2026-11-22'), 7);
  assert.equal(diffDaysInclusive('2026-11-22', '2026-11-22'), 1);
  assert.equal(diffDaysInclusive('2026-11-22', '2026-11-16'), 0);
});
