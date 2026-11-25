import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeHref, sanitizeRichHtml, stripHtmlToText } from './htmlSanitizer';

test('isSafeHref permits relative, http(s), and mailto URLs while blocking javascript: and data:', () => {
  assert.equal(isSafeHref('https://example.com/docs'), true);
  assert.equal(isSafeHref('/orders/ORD-8492'), true);
  assert.equal(isSafeHref('mailto:ops@kestrel.io'), true);
  assert.equal(isSafeHref('javascript:alert(1)'), false);
  assert.equal(isSafeHref('data:text/html,<script>alert(1)</script>'), false);
});

test('sanitizeRichHtml strips dangerous tags and event attributes while preserving safe formatting', () => {
  const dirty =
    '<h2>Release Notes</h2><p onclick="alert(1)">Hello <b>Ops</b>!</p><script>steal()</script><iframe src="https://evil.test"></iframe><a href="javascript:xss()" onmouseover="bad()">Bad</a><a href="https://kestrel.dev">Docs</a>';
  const clean = sanitizeRichHtml(dirty);

  assert.equal(clean.includes('<script>'), false);
  assert.equal(clean.includes('<iframe'), false);
  assert.equal(clean.includes('onclick'), false);
  assert.equal(clean.includes('javascript:'), false);
  assert.equal(clean.includes('<h2>Release Notes</h2>'), true);
  assert.equal(clean.includes('<b>Ops</b>'), true);
  assert.equal(
    clean.includes('<a href="https://kestrel.dev" target="_blank" rel="noopener noreferrer">Docs</a>'),
    true
  );
});

test('stripHtmlToText extracts readable text content', () => {
  assert.equal(
    stripHtmlToText('<h3>Summary</h3><p>First line<br />Second line &amp; more</p>'),
    'Summary\nFirst line\nSecond line & more'
  );
});
