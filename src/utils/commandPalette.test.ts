import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCommandPaletteItems,
  fuzzyMatchScore,
  searchCommandPalette,
  splitHighlightSegments,
} from './commandPalette';
import { INITIAL_CUSTOMERS, INITIAL_ORDERS } from '../data/seedData';
import { buildAdminNavTree } from './navTree';
import { TRANSLATIONS } from '../i18n/translations';

const tEn = (key: keyof typeof TRANSLATIONS.en): string => TRANSLATIONS.en[key];
const navTree = buildAdminNavTree(
  { flaggedOrders: 2, pendingOrders: 3, atRiskCustomers: 2 },
  tEn
);

const allItems = buildCommandPaletteItems({
  orders: INITIAL_ORDERS,
  customers: INITIAL_CUSTOMERS,
  navTree,
  t: tEn,
});

test('fuzzyMatchScore ranks exact and prefix hits above sparse subsequences', () => {
  const exact = fuzzyMatchScore('ORD-8490', 'ORD-8490 — Gridline Mobility');
  const subsequence = fuzzyMatchScore('grdmo', 'ORD-8490 — Gridline Mobility');
  const miss = fuzzyMatchScore('xyz999', 'ORD-8490 — Gridline Mobility');

  assert.equal(exact.matched, true);
  assert.equal(subsequence.matched, true);
  assert.equal(miss.matched, false);
  assert.ok(exact.score > subsequence.score);
  assert.deepEqual(exact.indices, [0, 1, 2, 3, 4, 5, 6, 7]);
});

test('fuzzyMatchScore matches compact out-of-word subsequences cleanly and rejects noisy cross-phrase scatter', () => {
  const hit = fuzzyMatchScore('nrtlab', 'Marcus Chen — Northstar Labs');
  assert.equal(hit.matched, true);
  assert.ok(hit.indices.length === 6);

  const noisyFalsePositive = fuzzyMatchScore(
    'persian',
    'Operations Lead · Chicago, US · jvance@apexlogistics.us'
  );
  assert.equal(noisyFalsePositive.matched, false);
});

test('splitHighlightSegments merges contiguous highlighted indices cleanly', () => {
  const segs = splitHighlightSegments('ORD-8490', [0, 1, 2, 4, 5]);
  assert.deepEqual(segs, [
    { text: 'ORD', highlighted: true },
    { text: '-', highlighted: false },
    { text: '84', highlighted: true },
    { text: '90', highlighted: false },
  ]);
});

test('searchCommandPalette finds exact orders by fuzzy ID or company query', () => {
  const byId = searchCommandPalette(allItems, '8490', 'all');
  assert.ok(byId.flatItems.length > 0);
  assert.equal(byId.flatItems[0].item.type, 'order');
  assert.equal(byId.flatItems[0].item.entityId, 'ORD-8490');

  const byFuzzy = searchCommandPalette(allItems, 'nrthstr', 'order');
  assert.ok(byFuzzy.flatItems.some((r) => r.item.entityId === 'ORD-8492'));
});

test('searchCommandPalette finds customers with multi-term fuzzy queries', () => {
  const res = searchCommandPalette(allItems, 'marcus sf', 'customer');
  assert.ok(res.flatItems.length >= 1);
  assert.equal(res.flatItems[0].item.type, 'customer');
  assert.equal(res.flatItems[0].item.entityId, 'CUS-101');
});

test('searchCommandPalette finds component sections via fuzzy aliases', () => {
  const wysiwygRes = searchCommandPalette(allItems, 'wsyg', 'section');
  assert.ok(
    wysiwygRes.flatItems.some((r) => r.item.routeId === 'components-inputs')
  );

  const workflowRes = searchCommandPalette(allItems, 'wkflw', 'section');
  assert.ok(
    workflowRes.flatItems.some((r) => r.item.routeId === 'components-workflows')
  );

  const breadcrumbRes = searchCommandPalette(allItems, 'breadcrmb', 'section');
  assert.ok(
    breadcrumbRes.flatItems.some((r) => r.item.routeId === 'components-overlays')
  );
});

test('searchCommandPalette returns grouped defaults on empty query and supports category filtering', () => {
  const emptyAll = searchCommandPalette(allItems, '', 'all', 3);
  assert.equal(emptyAll.groups.length, 3);
  assert.ok(emptyAll.groups.every((g) => g.items.length <= 3));

  const emptyCustomers = searchCommandPalette(allItems, '', 'customer', 10);
  assert.equal(emptyCustomers.groups.length, 1);
  assert.equal(emptyCustomers.groups[0].type, 'customer');
  assert.equal(emptyCustomers.flatItems.length, INITIAL_CUSTOMERS.length);
});
