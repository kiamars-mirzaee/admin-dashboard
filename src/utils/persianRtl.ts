export interface JsonDiffEntry {
  key: string;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
  before: unknown;
  after: unknown;
}

const PERSIAN_DIGIT_MAP: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

/**
 * Converts Persian (۰-۹) and Eastern Arabic (٠-٩) digits to ASCII 0-9.
 */
export function normalizeDigits(input: string): string {
  if (!input) return '';
  return input.replace(/[۰-۹٠-٩]/g, (ch) => PERSIAN_DIGIT_MAP[ch] ?? ch);
}

/**
 * Normalizes Persian/Arabic text for resilient search & filtering:
 * - Unifies Arabic Yeh/Kaf (ي/ئ/ى -> ی, ك -> ک)
 * - Strips zero-width non-joiner (\u200c) and Arabic diacritics
 * - Converts Persian/Arabic numerals to ASCII 0-9
 * - Collapses repeated whitespace and lowercases Latin characters
 */
export function normalizePersianText(input: string): string {
  if (!input) return '';
  return normalizeDigits(input)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[يئى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/\u200c/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function matchesNormalizedQuery(haystack: string, query: string): boolean {
  const cleanQuery = normalizePersianText(query);
  if (!cleanQuery) return true;
  return normalizePersianText(haystack).includes(cleanQuery);
}

const faCollator = new Intl.Collator('fa', {
  sensitivity: 'base',
  numeric: true,
});

export function comparePersianStrings(a: string, b: string): number {
  return faCollator.compare(a, b);
}

export function sortByPersianField<T>(
  items: T[],
  getValue: (item: T) => string,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => factor * faCollator.compare(getValue(a), getValue(b)));
}

/**
 * Computes field-level before/after diff entries for Audit Log & Version History comparisons.
 */
export function computeJsonDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): JsonDiffEntry[] {
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  return keys.map((key) => {
    const hasBefore = Object.prototype.hasOwnProperty.call(before, key);
    const hasAfter = Object.prototype.hasOwnProperty.call(after, key);
    if (!hasBefore && hasAfter) {
      return { key, status: 'added', before: undefined, after: after[key] };
    }
    if (hasBefore && !hasAfter) {
      return { key, status: 'removed', before: before[key], after: undefined };
    }
    const prevVal = before[key];
    const nextVal = after[key];
    const same = JSON.stringify(prevVal) === JSON.stringify(nextVal);
    return {
      key,
      status: same ? 'unchanged' : 'changed',
      before: prevVal,
      after: nextVal,
    };
  });
}

/**
 * Produces a concise human-readable summary for a standard 5-field cron expression.
 */
export function describeCronExpression(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return 'Custom schedule (expected 5 fields: min hour dom month dow)';
  }
  const [min, hour, dom, month, dow] = parts;
  if (min === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return 'Every minute';
  }
  if (min.startsWith('*/') && hour === '*') {
    return `Every ${min.slice(2)} minutes`;
  }
  if (hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return `Hourly at minute :${min.padStart(2, '0')}`;
  }
  const timeStr = `${hour.padStart(2, '0')}:${min.padStart(2, '0')} UTC`;
  if (dom === '*' && month === '*' && dow === '*') {
    return `Every day at ${timeStr}`;
  }
  if (dom === '*' && month === '*' && dow === '1-5') {
    return `Weekdays (Mon–Fri) at ${timeStr}`;
  }
  if (dom !== '*' && month === '*' && dow === '*') {
    return `Monthly on day ${dom} at ${timeStr}`;
  }
  return `At ${timeStr} (DOM:${dom} MON:${month} DOW:${dow})`;
}

export interface ConditionalRule {
  dependsOn: string;
  operator: 'equals' | 'notEquals' | 'in' | 'truthy';
  value?: unknown;
}

export function evaluateConditionalField(
  rule: ConditionalRule | undefined,
  values: Record<string, unknown>
): boolean {
  if (!rule) return true;
  const target = values[rule.dependsOn];
  switch (rule.operator) {
    case 'truthy':
      return Boolean(target);
    case 'equals':
      return target === rule.value;
    case 'notEquals':
      return target !== rule.value;
    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(target);
    default:
      return true;
  }
}
