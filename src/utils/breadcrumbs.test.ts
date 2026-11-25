import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminNavTree } from './navTree';
import {
  buildBreadcrumbsForRoute,
  collapseBreadcrumbs,
  resolveGroupTargetRoute,
} from './breadcrumbs';

const tree = buildAdminNavTree({
  flaggedOrders: 2,
  pendingOrders: 4,
  atRiskCustomers: 2,
});

test('resolveGroupTargetRoute maps intermediate group nodes to navigable leaf views', () => {
  assert.equal(resolveGroupTargetRoute('commerce'), 'orders-all');
  assert.equal(resolveGroupTargetRoute('orders-group'), 'orders-all');
  assert.equal(resolveGroupTargetRoute('customers-group'), 'customers-all');
  assert.equal(resolveGroupTargetRoute('ui-system'), 'components-all');
  assert.equal(resolveGroupTargetRoute('orders-flagged'), 'orders-flagged');
});

test('buildBreadcrumbsForRoute returns single current root breadcrumb on overview', () => {
  const items = buildBreadcrumbsForRoute({
    navTree: tree,
    activeRoute: 'overview',
    rootLabel: 'Overview',
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].label, 'Overview');
  assert.equal(items[0].isCurrent, true);
  assert.equal(items[0].isRoot, true);
  assert.equal(items[0].onClick, undefined);
});

test('buildBreadcrumbsForRoute constructs full nested hierarchy with clickable ancestors', () => {
  const navigated: string[] = [];
  const items = buildBreadcrumbsForRoute({
    navTree: tree,
    activeRoute: 'orders-flagged',
    rootLabel: 'Overview',
    onNavigate: (route) => navigated.push(route),
  });

  assert.deepEqual(
    items.map((i) => i.label),
    ['Overview', 'Commerce', 'Orders', 'Flagged review']
  );
  assert.equal(items[0].isCurrent, false);
  assert.equal(items[1].isCurrent, false);
  assert.equal(items[2].isCurrent, false);
  assert.equal(items[3].isCurrent, true);
  assert.equal(items[3].onClick, undefined);

  // Clicking intermediate ancestors resolves group targets
  items[1].onClick?.();
  items[2].onClick?.();
  items[0].onClick?.();
  assert.deepEqual(navigated, ['orders-all', 'orders-all', 'overview']);
});

test('buildBreadcrumbsForRoute appends deep inspected item and makes parent view clickable', () => {
  let cleared = 0;
  const navigated: string[] = [];
  const items = buildBreadcrumbsForRoute({
    navTree: tree,
    activeRoute: 'orders-flagged',
    rootLabel: 'Overview',
    inspectedItemLabel: 'ORD-8492',
    onNavigate: (r) => navigated.push(r),
    onClearInspectedItem: () => {
      cleared += 1;
    },
  });

  assert.deepEqual(
    items.map((i) => i.label),
    ['Overview', 'Commerce', 'Orders', 'Flagged review', 'ORD-8492']
  );
  assert.equal(items[3].isCurrent, false);
  assert.equal(items[4].isCurrent, true);
  assert.equal(items[4].preserveLtr, true);

  // Clicking the parent leaf clears inspected order without changing route
  items[3].onClick?.();
  assert.equal(cleared, 1);
  assert.deepEqual(navigated, []);
});

test('collapseBreadcrumbs collapses middle items when trail exceeds maxVisible', () => {
  const items = buildBreadcrumbsForRoute({
    navTree: tree,
    activeRoute: 'orders-flagged',
    rootLabel: 'Overview',
    inspectedItemLabel: 'ORD-8492',
  });

  const full = collapseBreadcrumbs(items, 5);
  assert.equal(full.length, 5);
  assert.equal(full.every((t) => t.kind === 'item'), true);

  const compact = collapseBreadcrumbs(items, 3);
  assert.equal(compact.length, 3);
  assert.equal(compact[0].kind, 'item');
  assert.equal(compact[1].kind, 'ellipsis');
  assert.equal(compact[2].kind, 'item');
  if (compact[1].kind === 'ellipsis') {
    assert.deepEqual(
      compact[1].hiddenItems.map((h) => h.label),
      ['Commerce', 'Orders', 'Flagged review']
    );
  }
  if (compact[2].kind === 'item') {
    assert.equal(compact[2].item.label, 'ORD-8492');
  }
});
