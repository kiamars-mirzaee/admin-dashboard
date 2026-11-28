import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createCssInJsPrintManager,
  resolvePrintLayoutProfile,
  type CssInJsPrintManager,
  type PrintLayoutContext,
  type PrintOrientation,
  type PrintPaperSize,
  type ResolvedPrintProfile,
} from '../../utils/cssInJsPrint';

export interface UseAutoPrintStylesOptions extends PrintLayoutContext {
  orientation?: PrintOrientation;
  paperSize?: PrintPaperSize;
  marginMm?: number;
  customHideSelectors?: string[];
  enabled?: boolean;
}

export interface UseAutoPrintStylesResult {
  profile: ResolvedPrintProfile;
  cssText: string;
  isPrinting: boolean;
  triggerPrint: () => void;
}

/**
 * React hook that dynamically compiles & injects a CSS-in-JS `@media print` stylesheet
 * tailored to the active view (`orders`, `order-detail`, `customers`, `customer-detail`, etc.).
 * Automatically hides navigation, sidebars, toolbars, backdrops, and FABs during print operations.
 */
export function useAutoPrintStyles({
  activeRoute,
  activeSection,
  inspectedOrderId = null,
  inspectedCustomerId = null,
  detailPageOrderId = null,
  dir = 'ltr',
  orientation,
  paperSize = 'A4',
  marginMm,
  customHideSelectors,
  enabled = true,
}: UseAutoPrintStylesOptions): UseAutoPrintStylesResult {
  const managerRef = useRef<CssInJsPrintManager | null>(null);
  const [cssText, setCssText] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  const profile = useMemo(
    () =>
      resolvePrintLayoutProfile({
        activeRoute,
        activeSection,
        inspectedOrderId,
        inspectedCustomerId,
        detailPageOrderId,
        dir,
      }),
    [
      activeRoute,
      activeSection,
      inspectedOrderId,
      inspectedCustomerId,
      detailPageOrderId,
      dir,
    ]
  );

  useEffect(() => {
    if (!enabled) {
      managerRef.current?.destroy();
      managerRef.current = null;
      return;
    }

    if (!managerRef.current) {
      managerRef.current = createCssInJsPrintManager('kestrel-css-in-js-print');
    }

    const compiled = managerRef.current.update({
      viewMode: profile.viewMode,
      hasActiveDrawer: profile.hasActiveDrawer,
      orientation: orientation ?? profile.orientation,
      paperSize,
      marginMm: marginMm ?? profile.marginMm,
      dir: profile.dir,
      customHideSelectors,
    });
    setCssText(compiled);
  }, [
    enabled,
    profile,
    orientation,
    paperSize,
    marginMm,
    customHideSelectors,
  ]);

  useEffect(() => {
    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onBeforePrint = () => setIsPrinting(true);
    const onAfterPrint = () => setIsPrinting(false);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  const triggerPrint = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  return {
    profile,
    cssText,
    isPrinting,
    triggerPrint,
  };
}

export function AutoPrintStyles(props: UseAutoPrintStylesOptions) {
  useAutoPrintStyles(props);
  return null;
}

export interface PrintViewBannerProps {
  brandName?: string;
  title: string;
  subtitle?: string;
  metaLabel?: string;
  testId?: string;
}

/**
 * Screen-hidden letterhead automatically revealed by CSS-in-JS `@media print` rules
 * to give printed views and detail drawers crisp executive metadata.
 */
export function PrintViewBanner({
  brandName = 'Kestrel Ops',
  title,
  subtitle,
  metaLabel,
  testId = 'print-view-banner',
}: PrintViewBannerProps) {
  const printedDate = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

  return (
    <div
      data-print-only="true"
      data-testid={testId}
      className="kestrel-print-only mb-4 pb-3 border-b-2 border-slate-900 text-slate-900"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            {brandName}
          </p>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="text-end shrink-0">
          {metaLabel && (
            <p dir="ltr" className="text-xs font-mono font-semibold text-slate-800">
              {metaLabel}
            </p>
          )}
          <p dir="ltr" className="text-[11px] font-mono text-slate-500">
            {printedDate}
          </p>
        </div>
      </div>
    </div>
  );
}
