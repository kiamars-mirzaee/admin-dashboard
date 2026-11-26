import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildJsonTree,
  collectCollapsiblePaths,
  getJsonTreeStats,
  parseJsonInput,
  searchJsonTree,
  splitSearchHighlight,
} from './jsonViewer';

const SAMPLE_PAYLOAD = {
  status: 200,
  ok: true,
  error: null,
  endpoint: '/api/v2/settlements',
  meta: {
    region: 'eu-west-1',
    retries: 3,
    tags: ['sepa', 'instant'],
  },
  items: [
    { id: 'ORD-8490', amount: 3290, flagged: true },
    { id: 'ORD-8491', amount: 1200, flagged: false },
  ],
};

test('parseJsonInput parses JSON strings cleanly and reports syntax errors', () => {
  const valid = parseJsonInput('{"ok": true, "count": 4}');
  assert.equal(valid.ok, true);
  assert.deepEqual(valid.value, { ok: true, count: 4 });

  const invalid = parseJsonInput('{"ok": true,');
  assert.equal(invalid.ok, false);
  assert.ok(invalid.error && invalid.error.length > 0);
});

test('buildJsonTree assigns canonical JSONPaths, depths, and child counts', () => {
  const tree = buildJsonTree(SAMPLE_PAYLOAD);
  assert.equal(tree.path, '$');
  assert.equal(tree.type, 'object');
  assert.equal(tree.childCount, 6);

  const metaNode = tree.children.find((c) => c.keyName === 'meta');
  assert.ok(metaNode);
  assert.equal(metaNode.path, '$.meta');
  assert.equal(metaNode.depth, 1);

  const itemsNode = tree.children.find((c) => c.keyName === 'items');
  assert.ok(itemsNode);
  assert.equal(itemsNode.children[0].path, '$.items[0]');
  assert.equal(itemsNode.children[0].children[0].path, '$.items[0].id');

  const stats = getJsonTreeStats(tree);
  assert.equal(stats.maxDepth, 3);
  assert.ok(stats.totalNodes > 10);
});

test('collectCollapsiblePaths respects maxDepth limit for default expansion', () => {
  const tree = buildJsonTree(SAMPLE_PAYLOAD);
  const depth1 = collectCollapsiblePaths(tree, 1);
  assert.equal(depth1.has('$'), true);
  assert.equal(depth1.has('$.meta'), false);

  const all = collectCollapsiblePaths(tree);
  assert.equal(all.has('$.meta'), true);
  assert.equal(all.has('$.meta.tags'), true);
  assert.equal(all.has('$.items[0]'), true);
});

test('searchJsonTree finds matches by key and value and marks ancestor paths', () => {
  const tree = buildJsonTree(SAMPLE_PAYLOAD);
  const res = searchJsonTree(tree, 'sepa');

  assert.equal(res.totalMatches, 1);
  assert.equal(res.matchedPaths.has('$.meta.tags[0]'), true);
  assert.equal(res.ancestorPaths.has('$'), true);
  assert.equal(res.ancestorPaths.has('$.meta'), true);
  assert.equal(res.ancestorPaths.has('$.meta.tags'), true);

  const keyRes = searchJsonTree(tree, 'flagged');
  assert.equal(keyRes.totalMatches, 2);
  assert.deepEqual(keyRes.matchList, ['$.items[0].flagged', '$.items[1].flagged']);
});

test('splitSearchHighlight segments text safely without losing characters', () => {
  const segs = splitSearchHighlight('settlement_gateway_SEPA', 'sepa');
  assert.deepEqual(segs, [
    { text: 'settlement_gateway_', highlighted: false },
    { text: 'SEPA', highlighted: true },
  ]);

  const multi = splitSearchHighlight('foo-bar-foo', 'foo');
  assert.equal(multi.filter((s) => s.highlighted).length, 2);
});
