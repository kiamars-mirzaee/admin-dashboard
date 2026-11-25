import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_QUICK_FAVORITES,
  createCustomerPin,
  createOrderPin,
  createViewPin,
  getCustomerPinId,
  getOrderPinId,
  getViewPinId,
  isFavoritePinActive,
  isPinned,
  pruneDeletedOrderPins,
  removeFavoritePin,
  reorderFavoritePin,
  resolveViewPinLabel,
  sanitizeStoredFavorites,
  toggleFavoritePin,
} from './favorites';
import { buildAdminNavTree } from './navTree';
import { translate } from './i18n';

test('toggleFavoritePin adds missing pins and removes existing pins cleanly', () => {
  const start = [...DEFAULT_QUICK_FAVORITES];
  const newOrderPin = createOrderPin('ORD-8492', 'Northstar Labs');

  const added = toggleFavoritePin(start, newOrderPin);
  assert.equal(added.action, 'added');
  assert.equal(isPinned(added.pins, getOrderPinId('ORD-8492')), true);
  assert.equal(added.pins.length, start.length + 1);

  const removed = toggleFavoritePin(added.pins, newOrderPin);
  assert.equal(removed.action, 'removed');
  assert.equal(isPinned(removed.pins, getOrderPinId('ORD-8492')), false);
  assert.equal(removed.pins.length, start.length);
});

test('toggleFavoritePin enforces max cap without mutating existing array', () => {
  const full = [
    createOrderPin('ORD-1'),
    createOrderPin('ORD-2'),
  ];
  const result = toggleFavoritePin(full, createOrderPin('ORD-3'), 2);
  assert.equal(result.action, 'limit_reached');
  assert.equal(result.pins.length, 2);
  assert.equal(isPinned(result.pins, getOrderPinId('ORD-3')), false);
});

test('removeFavoritePin and reorderFavoritePin update order predictably', () => {
  const a = createViewPin('overview', 'Overview');
  const b = createOrderPin('ORD-8490', 'Gridline Mobility');
  const c = createCustomerPin('CUS-101', 'Marcus Chen', 'Northstar Labs');

  const movedNext = reorderFavoritePin([a, b, c], a.id, 'next');
  assert.deepEqual(
    movedNext.map((p) => p.id),
    [b.id, a.id, c.id]
  );

  const movedPrev = reorderFavoritePin(movedNext, c.id, 'prev');
  assert.deepEqual(
    movedPrev.map((p) => p.id),
    [b.id, c.id, a.id]
  );

  const pruned = removeFavoritePin(movedPrev, b.id);
  assert.deepEqual(
    pruned.map((p) => p.id),
    [c.id, a.id]
  );
});

test('isFavoritePinActive differentiates views from inspected order/customer drawers', () => {
  const viewPin = createViewPin('orders-all', 'All orders');
  const orderPin = createOrderPin('ORD-8490');
  const customerPin = createCustomerPin('CUS-101', 'Marcus Chen');

  assert.equal(
    isFavoritePinActive(viewPin, {
      activeRoute: 'orders-all',
      inspectedOrderId: null,
      inspectedCustomerId: null,
    }),
    true
  );

  // When an order drawer is open, the order pin is active rather than the view pin
  assert.equal(
    isFavoritePinActive(viewPin, {
      activeRoute: 'orders-all',
      inspectedOrderId: 'ORD-8490',
      inspectedCustomerId: null,
    }),
    false
  );
  assert.equal(
    isFavoritePinActive(orderPin, {
      activeRoute: 'orders-all',
      inspectedOrderId: 'ORD-8490',
      inspectedCustomerId: null,
    }),
    true
  );
  assert.equal(
    isFavoritePinActive(customerPin, {
      activeRoute: 'customers-all',
      inspectedOrderId: null,
      inspectedCustomerId: 'CUS-101',
    }),
    true
  );
});

test('resolveViewPinLabel localizes pinned routes using active nav tree', () => {
  const arTree = buildAdminNavTree(
    { flaggedOrders: 2, pendingOrders: 3, atRiskCustomers: 1 },
    (k) => translate('ar', k)
  );
  const label = resolveViewPinLabel('orders-flagged', arTree, 'Flagged review');
  assert.equal(label, translate('ar', 'navOrdersFlagged'));
});

test('sanitizeStoredFavorites filters corrupt entries, deduplicates IDs, and accepts intentional empty arrays', () => {
  assert.equal(sanitizeStoredFavorites(null), null);
  assert.equal(sanitizeStoredFavorites('bad'), null);
  assert.deepEqual(sanitizeStoredFavorites([]), []);

  const cleaned = sanitizeStoredFavorites([
    { kind: 'view', routeId: 'overview', label: 'Overview' },
    { kind: 'view', routeId: 'overview', label: 'Duplicate Overview' },
    { kind: 'view', routeId: 'not-a-route', label: 'Invalid' },
    { kind: 'order', orderId: 'ORD-8492', sublabel: 'Northstar Labs' },
    { kind: 'customer', customerId: 'CUS-101', label: 'Marcus Chen' },
    { kind: 'customer', customerId: '', label: 'Missing ID' },
  ]);

  assert.ok(cleaned);
  assert.deepEqual(
    cleaned.map((p) => p.id),
    [getViewPinId('overview'), getOrderPinId('ORD-8492'), getCustomerPinId('CUS-101')]
  );
});

test('pruneDeletedOrderPins removes deleted orders while keeping views and customers', () => {
  const pins = [
    createViewPin('overview', 'Overview'),
    createOrderPin('ORD-8490'),
    createOrderPin('ORD-9999'),
    createCustomerPin('CUS-101', 'Marcus Chen'),
  ];
  const next = pruneDeletedOrderPins(pins, ['ORD-8490', 'ORD-8492']);
  assert.deepEqual(
    next.map((p) => p.id),
    [getViewPinId('overview'), getOrderPinId('ORD-8490'), getCustomerPinId('CUS-101')]
  );
});
