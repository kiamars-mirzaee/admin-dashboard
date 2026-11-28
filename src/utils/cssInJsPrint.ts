import type { NavRouteId, NavSection } from '../types/admin';

export type PrintViewMode =
  | 'orders'
  | 'order-detail'
  | 'customers'
  | 'customer-detail'
  | 'overview'
  | 'generic';

export type PrintOrientation = 'portrait' | 'landscape' | 'auto';
export type PrintPaperSize = 'A4' | 'letter' | 'auto';
export type CssValue = string | number;
export type CssDeclarationMap = Record<string, CssValue>;
export interface CssRuleTree {
  [selectorOrAtRule: string]: CssDeclarationMap | CssRuleTree;
}

export interface PrintStyleConfig {
  viewMode: PrintViewMode;
  hasActiveDrawer?: boolean;
  orientation?: PrintOrientation;
  paperSize?: PrintPaperSize;
  marginMm?: number;
  dir?: 'ltr' | 'rtl';
  fontSizePt?: number;
  customHideSelectors?: string[];
  preserveScreenColors?: boolean;
}

export interface PrintLayoutContext {
  activeRoute: NavRouteId;
  activeSection: NavSection;
  inspectedOrderId?: string | null;
  inspectedCustomerId?: string | null;
  detailPageOrderId?: string | null;
  dir?: 'ltr' | 'rtl';
}

export interface ResolvedPrintProfile {
  viewMode: PrintViewMode;
  hasActiveDrawer: boolean;
  orientation: PrintOrientation;
  paperSize: PrintPaperSize;
  marginMm: number;
  dir: 'ltr' | 'rtl';
  documentLabel: string;
}

const UNITLESS_CSS_PROPS = new Set([
  'animationIterationCount',
  'columnCount',
  'columns',
  'flex',
  'flexGrow',
  'flexShrink',
  'fontWeight',
  'gridColumn',
  'gridRow',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'scale',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
]);

/**
 * Converts camelCase JS CSS properties (including vendor prefixes like WebkitPrintColorAdjust)
 * into canonical kebab-case CSS property names.
 */
export function camelToKebab(prop: string): string {
  if (prop.startsWith('--')) return prop;
  return prop
    .replace(/^(Webkit|Moz|Ms|O)([A-Z])/, (_, prefix: string, first: string) => {
      return `-${prefix.toLowerCase()}-${first.toLowerCase()}`;
    })
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Formats numeric and string declaration values for CSS output.
 */
export function formatCssValue(prop: string, value: CssValue): string {
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) return '0';
  if (value === 0 || UNITLESS_CSS_PROPS.has(prop)) {
    return String(value);
  }
  return `${value}px`;
}

function isDeclarationBlock(
  node: CssDeclarationMap | CssRuleTree
): node is CssDeclarationMap {
  return Object.values(node).every(
    (val) => typeof val === 'string' || typeof val === 'number'
  );
}

/**
 * Compiles a CSS-in-JS declaration map into sorted CSS property lines.
 */
export function compileCssDeclarations(
  declarations: CssDeclarationMap,
  indent = '  '
): string {
  return Object.entries(declarations)
    .map(([prop, val]) => `${indent}${camelToKebab(prop)}: ${formatCssValue(prop, val)};`)
    .join('\n');
}

/**
 * Compiles a nested CSS-in-JS rule tree (selectors, `@page`, `@media print`) into CSS text.
 */
export function compileCssRules(tree: CssRuleTree, indent = ''): string {
  const blocks: string[] = [];

  for (const [selector, body] of Object.entries(tree)) {
    if (!body || typeof body !== 'object') continue;
    if (isDeclarationBlock(body)) {
      const decls = compileCssDeclarations(body, `${indent}  `);
      if (decls) {
        blocks.push(`${indent}${selector} {\n${decls}\n${indent}}`);
      }
    } else {
      const nested = compileCssRules(body as CssRuleTree, `${indent}  `);
      if (nested) {
        blocks.push(`${indent}${selector} {\n${nested}\n${indent}}`);
      }
    }
  }

  return blocks.join('\n\n');
}

/**
 * Resolves the optimal print layout profile for the active console route or open detail drawer.
 */
export function resolvePrintLayoutProfile(
  context: PrintLayoutContext
): ResolvedPrintProfile {
  const dir = context.dir === 'rtl' ? 'rtl' : 'ltr';

  if (context.inspectedCustomerId) {
    return {
      viewMode: 'customer-detail',
      hasActiveDrawer: true,
      orientation: 'portrait',
      paperSize: 'A4',
      marginMm: 12,
      dir,
      documentLabel: `Customer Profile · ${context.inspectedCustomerId}`,
    };
  }

  if (context.inspectedOrderId) {
    return {
      viewMode: 'order-detail',
      hasActiveDrawer: true,
      orientation: 'portrait',
      paperSize: 'A4',
      marginMm: 12,
      dir,
      documentLabel: `Order Details · ${context.inspectedOrderId}`,
    };
  }

  if (context.activeRoute === 'order-detail') {
    return {
      viewMode: 'order-detail',
      hasActiveDrawer: false,
      orientation: 'portrait',
      paperSize: 'A4',
      marginMm: 12,
      dir,
      documentLabel: context.detailPageOrderId
        ? `Order Dispatch · ${context.detailPageOrderId}`
        : 'Order Dispatch Details',
    };
  }

  if (context.activeSection === 'orders') {
    return {
      viewMode: 'orders',
      hasActiveDrawer: false,
      orientation: 'landscape',
      paperSize: 'A4',
      marginMm: 10,
      dir,
      documentLabel: 'Orders Ledger',
    };
  }

  if (context.activeSection === 'customers') {
    return {
      viewMode: 'customers',
      hasActiveDrawer: false,
      orientation: 'landscape',
      paperSize: 'A4',
      marginMm: 10,
      dir,
      documentLabel: 'Customers Directory',
    };
  }

  if (context.activeSection === 'overview') {
    return {
      viewMode: 'overview',
      hasActiveDrawer: false,
      orientation: 'portrait',
      paperSize: 'A4',
      marginMm: 12,
      dir,
      documentLabel: 'Operations Overview',
    };
  }

  return {
    viewMode: 'generic',
    hasActiveDrawer: false,
    orientation: 'portrait',
    paperSize: 'A4',
    marginMm: 12,
    dir,
    documentLabel: 'Kestrel Operations View',
  };
}

/**
 * Generates a complete CSS-in-JS rule tree for `@page` and `@media print` that:
 * - hides navigation, sidebars, top bars, drawers backdrops, FABs, and interactive toolbars
 * - removes sidebar padding offsets (`lg:ps-64` / `lg:ps-20`)
 * - isolates active Order or Customer Detail drawers cleanly
 * - formats orders/customer tables, cards, typography, and RTL direction for print
 */
export function buildPrintStylesheetObject(config: PrintStyleConfig): CssRuleTree {
  const orientation =
    config.orientation ??
    (config.viewMode === 'orders' || config.viewMode === 'customers'
      ? 'landscape'
      : 'portrait');
  const paperSize = config.paperSize ?? 'A4';
  const marginMm = config.marginMm ?? 12;
  const dir = config.dir ?? 'ltr';
  const fontSizePt = config.fontSizePt ?? (orientation === 'landscape' ? 9.5 : 10);

  const pageSizeValue =
    paperSize === 'auto'
      ? orientation === 'auto'
        ? 'auto'
        : orientation
      : orientation === 'auto'
        ? paperSize
        : `${paperSize} ${orientation}`;

  const defaultHideSelectors = [
    'aside[data-testid="desktop-sidebar"]',
    'nav[aria-label="Mobile navigation"]',
    'nav[aria-label="Breadcrumb"]',
    'header',
    'footer[data-testid="app-footer"]',
    '[data-testid="favorites-bar"]',
    '[data-testid="quick-actions-fab"]',
    '[role="region"][aria-label="Global announcement"]',
    '[data-print-hide="true"]',
    '[data-print-controls="true"]',
    '[data-print-col-hide="true"]',
    '[data-print-drawer-backdrop="true"]',
    '[data-print-drawer-close="true"]',
    '[data-print-drawer-footer="true"]',
    '.no-print',
    '.print\\:hidden',
    ...(config.customHideSelectors ?? []),
  ];

  const printRules: CssRuleTree = {
    'html, body': {
      backgroundColor: '#ffffff !important',
      color: '#0f172a !important',
      height: 'auto !important',
      minHeight: '0 !important',
      overflow: 'visible !important',
      margin: '0 !important',
      padding: '0 !important',
      direction: dir,
      fontSize: `${fontSizePt}pt`,
      WebkitPrintColorAdjust: config.preserveScreenColors === false ? 'economy' : 'exact',
      printColorAdjust: config.preserveScreenColors === false ? 'economy' : 'exact',
    },

    [defaultHideSelectors.join(', ')]: {
      display: 'none !important',
    },

    // Hide interactive controls, search boxes, and pagination inside printable content
    'main button:not([data-print-keep="true"]), main input[type="search"], main [role="search"], main select, [data-print-drawer-panel="true"] button:not([data-print-keep="true"]), [data-print-drawer-panel="true"] select': {
      display: 'none !important',
    },

    // Preserve sortable column header text while hiding sort chevron icons
    'main table th button:not([data-print-hide="true"]), [data-print-drawer-panel="true"] table th button:not([data-print-hide="true"])': {
      display: 'inline-flex !important',
      padding: '0 !important',
      color: '#0f172a !important',
      fontWeight: 700,
    },

    'main table th button svg, [data-print-drawer-panel="true"] table th button svg': {
      display: 'none !important',
    },

    // Keep explicitly marked record links inside tables visible
    'main table td button[data-print-keep="true"]': {
      display: 'inline-block !important',
      padding: '0 !important',
      color: '#0f172a !important',
    },

    // Show automatic CSS-in-JS print headers/footers only on paper
    '.kestrel-print-only, [data-print-only="true"]': {
      display: 'block !important',
    },

    // Remove desktop sidebar padding offset & container max-width constraints
    '[data-testid="app-shell-main-wrapper"]': {
      paddingInlineStart: '0 !important',
      paddingInlineEnd: '0 !important',
      paddingLeft: '0 !important',
      paddingRight: '0 !important',
      margin: '0 !important',
      width: '100% !important',
      display: 'block !important',
      transition: 'none !important',
    },

    'main#main-content': {
      maxWidth: 'none !important',
      width: '100% !important',
      margin: '0 !important',
      padding: '0 !important',
      display: 'block !important',
    },

    // Expand scrollable containers so wide tables and tall panels never clip
    '.overflow-x-auto, .overflow-y-auto, [data-print-scroll="true"]': {
      overflow: 'visible !important',
      maxHeight: 'none !important',
      height: 'auto !important',
    },

    // Force desktop ledger table visible even if printed from a narrow viewport
    '[data-testid="desktop-data-table"]': {
      display: 'block !important',
      border: '1px solid #cbd5e1 !important',
      borderRadius: '8px !important',
      backgroundColor: '#ffffff !important',
      overflow: 'visible !important',
    },

    '[data-print-mobile-cards="true"]': {
      display: 'none !important',
    },

    // Neutralize dark surfaces & shadows across views and drawers
    'main *, [data-print-drawer-panel="true"] *': {
      boxShadow: 'none !important',
      textShadow: 'none !important',
    },

    'main section, main article, main aside, [data-print-card="true"]': {
      backgroundColor: '#ffffff !important',
      color: '#0f172a !important',
      borderColor: '#cbd5e1 !important',
      breakInside: 'avoid',
      pageBreakInside: 'avoid',
    },

    // Clean print typography & table layout
    'main table, [data-print-drawer-panel="true"] table': {
      width: '100% !important',
      minWidth: '0 !important',
      tableLayout: 'auto !important',
      borderCollapse: 'collapse !important',
      fontSize: `${Math.max(8, fontSizePt - 1)}pt`,
      backgroundColor: '#ffffff !important',
      color: '#0f172a !important',
    },

    'main thead, [data-print-drawer-panel="true"] thead': {
      display: 'table-header-group',
    },

    'main th, main td, [data-print-drawer-panel="true"] th, [data-print-drawer-panel="true"] td': {
      position: 'static !important',
      minWidth: '0 !important',
      width: 'auto !important',
      backgroundColor: 'transparent !important',
      color: '#0f172a !important',
      borderBottom: '1px solid #e2e8f0 !important',
      padding: '5px 6px !important',
      whiteSpace: 'normal !important',
      boxShadow: 'none !important',
    },

    'main th, [data-print-drawer-panel="true"] th': {
      backgroundColor: '#f8fafc !important',
      fontWeight: 700,
      borderBottom: '1.5px solid #94a3b8 !important',
    },

    'main tr, [data-print-drawer-panel="true"] tr': {
      breakInside: 'avoid',
      pageBreakInside: 'avoid',
    },

    // Hide selection checkboxes in printable tables while keeping row identifiers intact
    'table input[type="checkbox"]': {
      display: 'none !important',
    },

    // Preserve interactive PrintPortal modal print flow when explicitly opened
    'body.has-print-document #root, body.has-print-document [data-print-drawer-root="true"]': {
      display: 'none !important',
    },

    'body.has-print-document .print-document-root': {
      display: 'block !important',
    },
  };

  // When an Order or Customer Details drawer is open, isolate it as the primary print document
  if (config.hasActiveDrawer) {
    printRules['body[data-print-drawer="true"]:not(.has-print-document) #root'] = {
      display: 'none !important',
    };
    printRules['body[data-print-drawer="true"]:not(.has-print-document) [data-print-drawer-root="true"]'] = {
      position: 'static !important',
      inset: 'auto !important',
      display: 'block !important',
      width: '100% !important',
      height: 'auto !important',
      padding: '0 !important',
      backgroundColor: '#ffffff !important',
    };
    printRules['body[data-print-drawer="true"]:not(.has-print-document) [data-print-drawer-panel="true"]'] = {
      position: 'static !important',
      width: '100% !important',
      maxWidth: 'none !important',
      maxHeight: 'none !important',
      height: 'auto !important',
      border: 'none !important',
      borderRadius: '0 !important',
      boxShadow: 'none !important',
      backgroundColor: '#ffffff !important',
      color: '#0f172a !important',
    };
    printRules['body[data-print-drawer="true"]:not(.has-print-document) [data-print-drawer-header="true"]'] = {
      display: 'none !important',
    };
    printRules['body[data-print-drawer="true"]:not(.has-print-document) [data-print-drawer-body="true"]'] = {
      overflow: 'visible !important',
      padding: '12px 16px !important',
    };
    printRules['[data-print-drawer-panel="true"] button[data-print-keep="true"]'] = {
      display: 'flex !important',
      width: '100% !important',
      backgroundColor: '#ffffff !important',
      color: '#0f172a !important',
      borderBottom: '1px solid #e2e8f0 !important',
      borderRadius: '0 !important',
      margin: '0 !important',
      padding: '8px 4px !important',
    };
  }

  // Order detail & Customer detail spacing polish
  if (config.viewMode === 'order-detail' || config.viewMode === 'customer-detail') {
    printRules['main#main-content .lg\\:col-span-2'] = {
      gridColumn: 'span 3 / span 3 !important',
    };
  }

  return {
    '.kestrel-print-only, [data-print-only="true"]': {
      display: 'none',
    },
    '@page': {
      size: pageSizeValue,
      margin: `${marginMm}mm`,
    },
    '@media print': printRules,
  };
}

/**
 * Convenience function that compiles a `PrintStyleConfig` directly into a CSS string.
 */
export function buildCompiledPrintCss(config: PrintStyleConfig): string {
  return compileCssRules(buildPrintStylesheetObject(config));
}

export interface PrintManagerLikeDocument {
  head?: { appendChild: (el: PrintStyleElementLike) => void } | null;
  body?: {
    dataset: Record<string, string | undefined>;
  } | null;
  getElementById?: (id: string) => PrintStyleElementLike | null;
  createElement?: (tagName: string) => PrintStyleElementLike;
}

export interface PrintStyleElementLike {
  id: string;
  textContent: string | null;
  setAttribute: (name: string, value: string) => void;
  parentNode?: { removeChild: (el: PrintStyleElementLike) => void } | null;
}

export interface CssInJsPrintManager {
  update: (config: PrintStyleConfig) => string;
  getCss: () => string;
  destroy: () => void;
}

/**
 * Creates an imperative CSS-in-JS `<style>` manager bound to a document (browser or test mock).
 * Injects/updates print rules dynamically and tracks `data-print-view` / `data-print-drawer` on `<body>`.
 */
export function createCssInJsPrintManager(
  styleId = 'kestrel-css-in-js-print',
  doc: PrintManagerLikeDocument | undefined = typeof document !== 'undefined'
    ? (document as unknown as PrintManagerLikeDocument)
    : undefined
): CssInJsPrintManager {
  let latestCss = '';

  const update = (config: PrintStyleConfig): string => {
    latestCss = buildCompiledPrintCss(config);
    if (!doc || !doc.head || !doc.createElement) {
      return latestCss;
    }

    let styleEl = doc.getElementById?.(styleId) ?? null;
    if (!styleEl) {
      styleEl = doc.createElement('style');
      styleEl.id = styleId;
      styleEl.setAttribute('data-css-in-js', 'kestrel-print');
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = latestCss;

    if (doc.body?.dataset) {
      doc.body.dataset.printView = config.viewMode;
      doc.body.dataset.printDrawer = config.hasActiveDrawer ? 'true' : 'false';
      doc.body.dataset.printOrientation =
        config.orientation ??
        (config.viewMode === 'orders' || config.viewMode === 'customers'
          ? 'landscape'
          : 'portrait');
    }

    return latestCss;
  };

  const destroy = () => {
    if (!doc) return;
    const styleEl = doc.getElementById?.(styleId) ?? null;
    if (styleEl?.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
    if (doc.body?.dataset) {
      delete doc.body.dataset.printView;
      delete doc.body.dataset.printDrawer;
      delete doc.body.dataset.printOrientation;
    }
  };

  return {
    update,
    getCss: () => latestCss,
    destroy,
  };
}
