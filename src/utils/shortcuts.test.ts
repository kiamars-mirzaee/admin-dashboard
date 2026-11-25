import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isCommandPaletteChord,
  isEditableTarget,
  normalizeKeyEvent,
  resolveShortcutSequence,
} from './shortcuts';

test('isEditableTarget blocks inputs, textareas, selects, and contentEditable nodes', () => {
  assert.equal(isEditableTarget({ tagName: 'INPUT' }), true);
  assert.equal(isEditableTarget({ tagName: 'textarea' }), true);
  assert.equal(isEditableTarget({ tagName: 'SELECT' }), true);
  assert.equal(isEditableTarget({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(isEditableTarget({ tagName: 'BUTTON', isContentEditable: false }), false);
  assert.equal(isEditableTarget(null), false);
});

test('normalizeKeyEvent ignores browser modifier chords and normalizes single keys', () => {
  assert.equal(normalizeKeyEvent({ key: 'g', metaKey: true }), null);
  assert.equal(normalizeKeyEvent({ key: 'n', ctrlKey: true }), null);
  assert.equal(normalizeKeyEvent({ key: 'o', altKey: true }), null);
  assert.equal(normalizeKeyEvent({ key: 'G' }), 'g');
  assert.equal(normalizeKeyEvent({ key: 'O' }), 'o');
  assert.equal(normalizeKeyEvent({ key: '?' }), '?');
  assert.equal(normalizeKeyEvent({ key: 'Escape' }), 'escape');
  assert.equal(normalizeKeyEvent({ key: 'Shift' }), null);
});

test('isCommandPaletteChord recognizes Cmd+K and Ctrl+K accurately', () => {
  assert.equal(isCommandPaletteChord({ key: 'k', metaKey: true }), true);
  assert.equal(isCommandPaletteChord({ key: 'K', ctrlKey: true }), true);
  assert.equal(isCommandPaletteChord({ key: 'k', ctrlKey: true, altKey: true }), false);
  assert.equal(isCommandPaletteChord({ key: 'k' }), false);
});

test('resolveShortcutSequence handles G+O, G+L, G+F, G+C, G+K two-key chords cleanly', () => {
  const step1 = resolveShortcutSequence(null, 'g');
  assert.deepEqual(step1, { matchedId: null, nextPrefix: 'g' });

  assert.deepEqual(resolveShortcutSequence(step1.nextPrefix, 'o'), {
    matchedId: 'nav-overview',
    nextPrefix: null,
  });
  assert.deepEqual(resolveShortcutSequence('g', 'l'), {
    matchedId: 'nav-orders',
    nextPrefix: null,
  });
  assert.deepEqual(resolveShortcutSequence('g', 'f'), {
    matchedId: 'nav-flagged',
    nextPrefix: null,
  });
  assert.deepEqual(resolveShortcutSequence('g', 'c'), {
    matchedId: 'nav-customers',
    nextPrefix: null,
  });
  assert.deepEqual(resolveShortcutSequence('g', 'k'), {
    matchedId: 'nav-components',
    nextPrefix: null,
  });
});

test('resolveShortcutSequence handles single-key shortcuts, Escape cancellation, and unknown chords', () => {
  assert.deepEqual(resolveShortcutSequence(null, 'n'), {
    matchedId: 'toggle-notifications',
    nextPrefix: null,
  });
  assert.deepEqual(resolveShortcutSequence(null, 'c'), {
    matchedId: 'new-order',
    nextPrefix: null,
  });
  assert.deepEqual(resolveShortcutSequence(null, 'd'), {
    matchedId: 'toggle-theme',
    nextPrefix: null,
  });
  assert.deepEqual(resolveShortcutSequence(null, '/'), {
    matchedId: 'open-command-palette',
    nextPrefix: null,
  });
  assert.deepEqual(resolveShortcutSequence(null, 'q'), {
    matchedId: 'open-qr-scanner',
    nextPrefix: null,
  });
  assert.deepEqual(resolveShortcutSequence(null, '?'), {
    matchedId: 'open-help',
    nextPrefix: null,
  });

  // Escape cancels a pending chord
  assert.deepEqual(resolveShortcutSequence('g', 'escape'), {
    matchedId: null,
    nextPrefix: null,
  });

  // Unknown second key resets pending chord cleanly
  assert.deepEqual(resolveShortcutSequence('g', 'z'), {
    matchedId: null,
    nextPrefix: null,
  });
});
