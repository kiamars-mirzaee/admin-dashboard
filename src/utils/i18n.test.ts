import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_LOCALES, TRANSLATIONS, type TranslationKey } from '../i18n/translations';
import { getLocaleMeta, isRtlLocale, translate, translateChannel, translateStatus } from './i18n';

test('all supported locales contain complete translation keys matching English baseline', () => {
  const baselineKeys = Object.keys(TRANSLATIONS.en) as TranslationKey[];
  for (const localeMeta of SUPPORTED_LOCALES) {
    const dict = TRANSLATIONS[localeMeta.code];
    for (const key of baselineKeys) {
      assert.equal(
        typeof dict[key],
        'string',
        `Missing translation key "${key}" in locale "${localeMeta.code}"`
      );
      assert.ok(
        dict[key].length > 0,
        `Empty translation key "${key}" in locale "${localeMeta.code}"`
      );
    }
  }
});

test('isRtlLocale identifies Arabic and Persian as RTL and English/Spanish as LTR', () => {
  assert.equal(isRtlLocale('en'), false);
  assert.equal(isRtlLocale('es'), false);
  assert.equal(isRtlLocale('ar'), true);
  assert.equal(isRtlLocale('fa'), true);
  assert.equal(getLocaleMeta('ar').dir, 'rtl');
  assert.equal(getLocaleMeta('fa').dir, 'rtl');
});

test('translate interpolates dynamic count and ID placeholders cleanly', () => {
  assert.equal(
    translate('en', 'ordersShowing', { visible: 2, total: 16 }),
    'Showing 2 of 16 orders'
  );
  assert.equal(
    translate('ar', 'ordersShowing', { visible: 2, total: 16 }),
    'عرض 2 من 16 طلب'
  );
  assert.equal(
    translate('fa', 'ordersShowing', { visible: 2, total: 16 }),
    'نمایش 2 از 16 سفارش'
  );
});

test('translateStatus and translateChannel localize domain enums accurately', () => {
  assert.equal(translateStatus('ar', 'Flagged'), 'معلّم');
  assert.equal(translateStatus('fa', 'Completed'), 'تکمیل شده');
  assert.equal(translateChannel('es', 'Direct'), 'Directo');
});
