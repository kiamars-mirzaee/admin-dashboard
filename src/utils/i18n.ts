import {
  SUPPORTED_LOCALES,
  TRANSLATIONS,
  type Locale,
  type LocaleMeta,
  type TranslationKey,
} from '../i18n/translations';
import type { OrderChannel, OrderStatus } from '../types/admin';

export function getLocaleMeta(locale: Locale): LocaleMeta {
  return (
    SUPPORTED_LOCALES.find((item) => item.code === locale) ??
    SUPPORTED_LOCALES[0]
  );
}

export function isRtlLocale(locale: Locale): boolean {
  return getLocaleMeta(locale).dir === 'rtl';
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const dict = TRANSLATIONS[locale] ?? TRANSLATIONS.en;
  let text: string = dict[key] ?? TRANSLATIONS.en[key] ?? key;

  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      text = text.replaceAll(`{${paramKey}}`, String(paramValue));
    }
  }
  return text;
}

export function translateStatus(
  locale: Locale,
  status: OrderStatus | 'Healthy' | 'Attention' | 'At Risk'
): string {
  switch (status) {
    case 'Completed':
      return translate(locale, 'statusCompleted');
    case 'Processing':
      return translate(locale, 'statusProcessing');
    case 'Pending':
      return translate(locale, 'statusPending');
    case 'Flagged':
      return translate(locale, 'statusFlagged');
    case 'Refunded':
      return translate(locale, 'statusRefunded');
    case 'Healthy':
      return translate(locale, 'healthHealthy');
    case 'Attention':
      return translate(locale, 'healthAttention');
    case 'At Risk':
      return translate(locale, 'healthAtRisk');
  }
}

export function translateChannel(locale: Locale, channel: OrderChannel): string {
  switch (channel) {
    case 'Enterprise':
      return translate(locale, 'channelEnterprise');
    case 'Direct':
      return translate(locale, 'channelDirect');
    case 'Partner':
      return translate(locale, 'channelPartner');
    case 'Marketplace':
      return translate(locale, 'channelMarketplace');
  }
}
