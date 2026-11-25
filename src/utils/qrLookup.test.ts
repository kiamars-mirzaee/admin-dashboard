import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendQrScanHistory,
  formatQrTagPayload,
  parseQrLookupPayload,
  resolveQrEntityLookup,
} from './qrLookup';
import { INITIAL_CUSTOMERS, INITIAL_ORDERS } from '../data/seedData';

const collections = {
  orders: INITIAL_ORDERS,
  customers: INITIAL_CUSTOMERS,
};

test('formatQrTagPayload and parseQrLookupPayload round-trip canonical URIs', () => {
  const orderUri = formatQrTagPayload('order', 'ORD-8490');
  assert.equal(orderUri, 'kestrel://order/ORD-8490');
  assert.deepEqual(parseQrLookupPayload(orderUri), {
    kindHint: 'order',
    identifier: 'ORD-8490',
    raw: orderUri,
  });

  const customerUri = formatQrTagPayload('customer', 'CUS-101');
  assert.equal(customerUri, 'kestrel://customer/CUS-101');
  assert.deepEqual(parseQrLookupPayload(customerUri), {
    kindHint: 'customer',
    identifier: 'CUS-101',
    raw: customerUri,
  });
});

test('parseQrLookupPayload extracts IDs from JSON, HTTP URLs, prefixed tags, and bare codes', () => {
  assert.deepEqual(parseQrLookupPayload('{"type":"order","id":"ORD-8492"}'), {
    kindHint: 'order',
    identifier: 'ORD-8492',
    raw: '{"type":"order","id":"ORD-8492"}',
  });

  assert.deepEqual(
    parseQrLookupPayload('https://admin.kestrel.io/customers?id=CUS-104&src=badge'),
    {
      kindHint: 'customer',
      identifier: 'CUS-104',
      raw: 'https://admin.kestrel.io/customers?id=CUS-104&src=badge',
    }
  );

  assert.deepEqual(parseQrLookupPayload('CUSTOMER:marcus@northstarlabs.io'), {
    kindHint: 'customer',
    identifier: 'marcus@northstarlabs.io',
    raw: 'CUSTOMER:marcus@northstarlabs.io',
  });

  assert.deepEqual(parseQrLookupPayload('ord-8488'), {
    kindHint: 'order',
    identifier: 'ORD-8488',
    raw: 'ord-8488',
  });

  assert.equal(parseQrLookupPayload('   '), null);
});

test('resolveQrEntityLookup resolves orders and customers across multiple payload formats', () => {
  const ordUriHit = resolveQrEntityLookup('kestrel://order/ORD-8490', collections);
  assert.equal(ordUriHit.status, 'matched');
  if (ordUriHit.status === 'matched' && ordUriHit.kind === 'order') {
    assert.equal(ordUriHit.order.id, 'ORD-8490');
    assert.equal(ordUriHit.order.company, 'Gridline Mobility');
  }

  const ordNumericHit = resolveQrEntityLookup('8492', collections);
  assert.equal(ordNumericHit.status, 'matched');
  if (ordNumericHit.status === 'matched' && ordNumericHit.kind === 'order') {
    assert.equal(ordNumericHit.order.id, 'ORD-8492');
  }

  const cusEmailHit = resolveQrEntityLookup(
    '{"type":"customer","id":"marcus@northstarlabs.io"}',
    collections
  );
  assert.equal(cusEmailHit.status, 'matched');
  if (cusEmailHit.status === 'matched' && cusEmailHit.kind === 'customer') {
    assert.equal(cusEmailHit.customer.id, 'CUS-101');
  }

  const miss = resolveQrEntityLookup('kestrel://order/ORD-9999', collections);
  assert.equal(miss.status, 'not_found');
  if (miss.status === 'not_found') {
    assert.equal(miss.parsedHint, 'ORD-9999');
  }
});

test('appendQrScanHistory deduplicates entities and preserves cap order', () => {
  const first = appendQrScanHistory([], {
    id: '1',
    rawPayload: 'ORD-8490',
    kind: 'order',
    entityId: 'ORD-8490',
    label: 'ORD-8490',
    sublabel: 'Gridline Mobility',
    scannedAt: '10:00',
  });
  const second = appendQrScanHistory(first, {
    id: '2',
    rawPayload: 'CUS-101',
    kind: 'customer',
    entityId: 'CUS-101',
    label: 'Marcus Chen',
    sublabel: 'Northstar Labs',
    scannedAt: '10:01',
  });
  const duplicateFirst = appendQrScanHistory(second, {
    id: '3',
    rawPayload: 'kestrel://order/ORD-8490',
    kind: 'order',
    entityId: 'ORD-8490',
    label: 'ORD-8490',
    sublabel: 'Gridline Mobility',
    scannedAt: '10:02',
  });

  assert.equal(duplicateFirst.length, 2);
  assert.equal(duplicateFirst[0].entityId, 'ORD-8490');
  assert.equal(duplicateFirst[1].entityId, 'CUS-101');
});
