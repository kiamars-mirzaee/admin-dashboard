import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale, TranslationKey } from './translations';
import type { OrderChannel, OrderStatus } from '../types/admin';
import {
  getLocaleMeta,
  translate,
  translateChannel,
  translateStatus,
} from '../utils/i18n';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  tStatus: (status: OrderStatus | 'Healthy' | 'Attention' | 'At Risk') => string;
  tChannel: (channel: OrderChannel) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  const meta = getLocaleMeta(locale);

  useEffect(() => {
    const root = document.documentElement;
    root.dir = meta.dir;
    root.lang = meta.code;
  }, [meta.code, meta.dir]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  const tStatus = useCallback(
    (status: OrderStatus | 'Healthy' | 'Attention' | 'At Risk') =>
      translateStatus(locale, status),
    [locale]
  );

  const tChannel = useCallback(
    (channel: OrderChannel) => translateChannel(locale, channel),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      dir: meta.dir,
      isRtl: meta.dir === 'rtl',
      t,
      tStatus,
      tChannel,
    }),
    [locale, meta.dir, t, tStatus, tChannel]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
