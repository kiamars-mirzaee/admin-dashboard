import type { TranslationKey } from '../i18n/translations';

export type ShortcutId =
  | 'nav-overview'
  | 'nav-orders'
  | 'nav-flagged'
  | 'nav-customers'
  | 'nav-components'
  | 'toggle-notifications'
  | 'new-order'
  | 'toggle-theme'
  | 'open-command-palette'
  | 'open-qr-scanner'
  | 'open-help';

export type ShortcutCategory = 'navigation' | 'actions';

export interface ShortcutDefinition {
  id: ShortcutId;
  /** Lowercase normalized key sequence, e.g. ['g', 'o'] or ['n'] */
  keys: string[];
  /** Human-readable keycaps displayed in LTR order */
  displayKeys: string[];
  category: ShortcutCategory;
  labelKey: TranslationKey;
}

export const GLOBAL_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'nav-overview',
    keys: ['g', 'o'],
    displayKeys: ['G', 'O'],
    category: 'navigation',
    labelKey: 'scNavOverview',
  },
  {
    id: 'nav-orders',
    keys: ['g', 'l'],
    displayKeys: ['G', 'L'],
    category: 'navigation',
    labelKey: 'scNavOrders',
  },
  {
    id: 'nav-flagged',
    keys: ['g', 'f'],
    displayKeys: ['G', 'F'],
    category: 'navigation',
    labelKey: 'scNavFlagged',
  },
  {
    id: 'nav-customers',
    keys: ['g', 'c'],
    displayKeys: ['G', 'C'],
    category: 'navigation',
    labelKey: 'scNavCustomers',
  },
  {
    id: 'nav-components',
    keys: ['g', 'k'],
    displayKeys: ['G', 'K'],
    category: 'navigation',
    labelKey: 'scNavComponents',
  },
  {
    id: 'toggle-notifications',
    keys: ['n'],
    displayKeys: ['N'],
    category: 'actions',
    labelKey: 'scToggleNotifications',
  },
  {
    id: 'new-order',
    keys: ['c'],
    displayKeys: ['C'],
    category: 'actions',
    labelKey: 'scNewOrder',
  },
  {
    id: 'toggle-theme',
    keys: ['d'],
    displayKeys: ['D'],
    category: 'actions',
    labelKey: 'scToggleTheme',
  },
  {
    id: 'open-command-palette',
    keys: ['/'],
    displayKeys: ['⌘K'],
    category: 'actions',
    labelKey: 'scOpenCommandPalette',
  },
  {
    id: 'open-qr-scanner',
    keys: ['q'],
    displayKeys: ['Q'],
    category: 'actions',
    labelKey: 'scOpenQrScanner',
  },
  {
    id: 'open-help',
    keys: ['?'],
    displayKeys: ['?'],
    category: 'actions',
    labelKey: 'scOpenHelp',
  },
];

export function isCommandPaletteChord(event: KeyEventLike): boolean {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return false;
  return event.key.toLowerCase() === 'k';
}

export interface EditableTargetLike {
  tagName?: string;
  isContentEditable?: boolean;
}

export function isEditableTarget(target: EditableTargetLike | null): boolean {
  if (!target) return false;
  if (target.isContentEditable) return true;
  const tag = (target.tagName ?? '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export interface KeyEventLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

export function normalizeKeyEvent(event: KeyEventLike): string | null {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return null;
  }
  if (!event.key) return null;
  if (event.key === 'Escape') return 'escape';
  if (event.key === '?') return '?';
  if (event.key.length === 1) {
    return event.key.toLowerCase();
  }
  return null;
}

export interface SequenceResolution {
  matchedId: ShortcutId | null;
  nextPrefix: string | null;
}

export function resolveShortcutSequence(
  pendingPrefix: string | null,
  normalizedKey: string,
  definitions: ShortcutDefinition[] = GLOBAL_SHORTCUTS
): SequenceResolution {
  if (normalizedKey === 'escape') {
    return { matchedId: null, nextPrefix: null };
  }

  if (pendingPrefix) {
    const chordMatch = definitions.find(
      (def) =>
        def.keys.length === 2 &&
        def.keys[0] === pendingPrefix &&
        def.keys[1] === normalizedKey
    );
    if (chordMatch) {
      return { matchedId: chordMatch.id, nextPrefix: null };
    }
    return { matchedId: null, nextPrefix: null };
  }

  const startsChord = definitions.some(
    (def) => def.keys.length === 2 && def.keys[0] === normalizedKey
  );
  if (startsChord) {
    return { matchedId: null, nextPrefix: normalizedKey };
  }

  const singleMatch = definitions.find(
    (def) => def.keys.length === 1 && def.keys[0] === normalizedKey
  );
  if (singleMatch) {
    return { matchedId: singleMatch.id, nextPrefix: null };
  }

  return { matchedId: null, nextPrefix: null };
}
