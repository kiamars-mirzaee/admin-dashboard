import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCompiledPrintCss,
  buildPrintStylesheetObject,
  camelToKebab,
  compileCssDeclarations,
  compileCssRules,
  createCssInJsPrintManager,
  formatCssValue,
  resolvePrintLayoutProfile,
  type PrintManagerLikeDocument,
  type PrintStyleElementLike,
} from './cssInJsPrint';

test('camelToKebab converts standard, logical, and vendor-prefixed CSS properties', () => {
  assert.equal(camelToKebab('backgroundColor'), 'background-color');
  assert.equal(camelToKebab('paddingInlineStart'), 'padding-inline-start');
  assert.equal(camelToKebab('breakInside'), 'break-inside');
  assert.equal(camelToKebab('WebkitPrintColorAdjust'), '-webkit-print-color-adjust');
  assert.equal(camelToKebab('--kestrel-gap'), '--kestrel-gap');
});

test('formatCssValue preserves unitless properties and adds px only to non-zero lengths', () => {
  assert.equal(formatCssValue('margin', 0), '0');
  assert.equal(formatCssValue('fontWeight', 700), '700');
  assert.equal(formatCssValue('opacity', 0.5), '0.5');
  assert.equal(formatCssValue('paddingTop', 16), '16px');
  assert.equal(formatCssValue('width', '100%'), '100%');
});

test('compileCssDeclarations and compileCssRules emit nested @media print and @page blocks', () => {
  const decls = compileCssDeclarations({ backgroundColor: '#fff', fontWeight: 600 });
  assert.match(decls, /background-color: #fff;/);
  assert.match(decls, /font-weight: 600;/);

  const css = compileCssRules({
    '@page': { size: 'A4 landscape', margin: '10mm' },
    '@media print': {
      'aside, nav': { display: 'none !important' },
    },
  });
  assert.match(css, /@page \{\n  size: A4 landscape;/);
  assert.match(css, /@media print \{\n  aside, nav \{\n    display: none !important;\n  \}\n\}/);
});

test('resolvePrintLayoutProfile automatically adapts orientation and viewMode for orders and customer details', () => {
  const ordersProfile = resolvePrintLayoutProfile({
    activeRoute: 'orders-all',
    activeSection: 'orders',
    dir: 'ltr',
  });
  assert.equal(ordersProfile.viewMode, 'orders');
  assert.equal(ordersProfile.orientation, 'landscape');
  assert.equal(ordersProfile.hasActiveDrawer, false);

  const customerDetailProfile = resolvePrintLayoutProfile({
    activeRoute: 'customers-all',
    activeSection: 'customers',
    inspectedCustomerId: 'CUS-04',
    dir: 'rtl',
  });
  assert.equal(customerDetailProfile.viewMode, 'customer-detail');
  assert.equal(customerDetailProfile.orientation, 'portrait');
  assert.equal(customerDetailProfile.hasActiveDrawer, true);
  assert.equal(customerDetailProfile.dir, 'rtl');
  assert.match(customerDetailProfile.documentLabel, /CUS-04/);

  const orderDetailProfile = resolvePrintLayoutProfile({
    activeRoute: 'order-detail',
    activeSection: 'orders',
    detailPageOrderId: 'ORD-8490',
  });
  assert.equal(orderDetailProfile.viewMode, 'order-detail');
  assert.equal(orderDetailProfile.orientation, 'portrait');
  assert.equal(orderDetailProfile.hasActiveDrawer, false);
});

test('buildPrintStylesheetObject hides navigation, sidebars, FABs, and clears sidebar padding offset', () => {
  const tree = buildPrintStylesheetObject({
    viewMode: 'orders',
    dir: 'rtl',
  });
  assert.deepEqual(tree['@page'], { size: 'A4 landscape', margin: '12mm' });

  const css = buildCompiledPrintCss({
    viewMode: 'orders',
    dir: 'rtl',
    customHideSelectors: ['.custom-debug-pill'],
  });
  assert.match(css, /aside\[data-testid="desktop-sidebar"\]/);
  assert.match(css, /nav\[aria-label="Mobile navigation"\]/);
  assert.match(css, /\[data-testid="favorites-bar"\]/);
  assert.match(css, /\[data-testid="quick-actions-fab"\]/);
  assert.match(css, /\.custom-debug-pill/);
  assert.match(css, /padding-inline-start: 0 !important;/);
  assert.match(css, /direction: rtl;/);
  assert.match(css, /table input\[type="checkbox"\]/);
});

test('buildPrintStylesheetObject isolates active customer/order detail drawer during print', () => {
  const css = buildCompiledPrintCss({
    viewMode: 'customer-detail',
    hasActiveDrawer: true,
  });
  assert.match(css, /size: A4 portrait;/);
  assert.match(css, /body\[data-print-drawer="true"\]:not\(\.has-print-document\) #root/);
  assert.match(css, /body\[data-print-drawer="true"\]:not\(\.has-print-document\) \[data-print-drawer-panel="true"\]/);
  assert.match(css, /\[data-print-drawer-panel="true"\] button\[data-print-keep="true"\]/);
});

test('createCssInJsPrintManager injects, updates, and cleans up dynamic <style> element and body dataset', () => {
  const state: { el: PrintStyleElementLike | null } = { el: null };
  const mockDoc: PrintManagerLikeDocument = {
    body: { dataset: {} },
    head: {
      appendChild: (el) => {
        state.el = el;
        el.parentNode = {
          removeChild: () => {
            state.el = null;
          },
        };
      },
    },
    getElementById: (id) => (state.el && state.el.id === id ? state.el : null),
    createElement: () => ({
      id: '',
      textContent: null,
      setAttribute: () => {},
      parentNode: null,
    }),
  };

  const manager = createCssInJsPrintManager('test-print-style', mockDoc);
  const firstCss = manager.update({
    viewMode: 'orders',
    hasActiveDrawer: false,
    orientation: 'landscape',
  });
  assert.ok(state.el !== null);
  assert.equal(state.el.textContent, firstCss);
  assert.equal(mockDoc.body!.dataset.printView, 'orders');
  assert.equal(mockDoc.body!.dataset.printDrawer, 'false');
  assert.equal(mockDoc.body!.dataset.printOrientation, 'landscape');

  manager.update({
    viewMode: 'customer-detail',
    hasActiveDrawer: true,
    orientation: 'portrait',
  });
  assert.equal(mockDoc.body!.dataset.printView, 'customer-detail');
  assert.equal(mockDoc.body!.dataset.printDrawer, 'true');
  assert.equal(mockDoc.body!.dataset.printOrientation, 'portrait');

  manager.destroy();
  assert.equal(state.el, null);
  assert.equal(mockDoc.body!.dataset.printView, undefined);
});
