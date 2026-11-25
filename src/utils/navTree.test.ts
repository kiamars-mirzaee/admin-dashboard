import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAdminNavTree,
  filterNavTree,
  findNavPath,
  getAncestorIds,
  getSectionForRoute,
  isNodeActiveOrAncestor,
} from './navTree';

const tree = buildAdminNavTree({
  flaggedOrders: 2,
  pendingOrders: 4,
  atRiskCustomers: 2,
});

test('findNavPath returns full 3-level hierarchy for nested leaf routes', () => {
  const path = findNavPath(tree, 'orders-flagged');
  assert.deepEqual(
    path.map((n) => n.id),
    ['commerce', 'orders-group', 'orders-flagged']
  );

  const overviewPath = findNavPath(tree, 'overview');
  assert.deepEqual(
    overviewPath.map((n) => n.id),
    ['overview']
  );
});

test('getAncestorIds identifies parent and grandparent IDs for active menu expansion', () => {
  const ancestors = getAncestorIds(tree, 'customers-risk');
  assert.equal(ancestors.has('commerce'), true);
  assert.equal(ancestors.has('customers-group'), true);
  assert.equal(ancestors.has('customers-risk'), false);
  assert.equal(ancestors.has('ui-system'), false);
});

test('isNodeActiveOrAncestor highlights active branch without false positives', () => {
  const commerce = tree.find((n) => n.id === 'commerce')!;
  const uiSystem = tree.find((n) => n.id === 'ui-system')!;

  assert.equal(isNodeActiveOrAncestor(commerce, 'orders-flagged'), true);
  assert.equal(isNodeActiveOrAncestor(uiSystem, 'orders-flagged'), false);
  assert.equal(isNodeActiveOrAncestor(uiSystem, 'components-charts'), true);
});

test('getSectionForRoute maps nested routes to primary mobile tabs', () => {
  assert.equal(getSectionForRoute('overview'), 'overview');
  assert.equal(getSectionForRoute('orders-flagged'), 'orders');
  assert.equal(getSectionForRoute('customers-enterprise'), 'customers');
  assert.equal(getSectionForRoute('components-overlays'), 'components');
});

test('filterNavTree preserves parent hierarchy when nested children match query', () => {
  const filtered = filterNavTree(tree, 'flagged');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'commerce');
  assert.equal(filtered[0].children?.[0].id, 'orders-group');
  assert.equal(filtered[0].children?.[0].children?.[0].id, 'orders-flagged');
});
