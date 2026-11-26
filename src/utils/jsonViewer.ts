export type JsonValueType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null';

export interface JsonTreeNode {
  path: string;
  keyName: string | null;
  type: JsonValueType;
  value: unknown;
  depth: number;
  children: JsonTreeNode[];
  childCount: number;
}

export interface JsonSearchResult {
  matchedPaths: Set<string>;
  ancestorPaths: Set<string>;
  matchList: string[];
  totalMatches: number;
}

export interface JsonHighlightSegment {
  text: string;
  highlighted: boolean;
}

export interface ParsedJsonInput {
  ok: boolean;
  value: unknown;
  error?: string;
}

/**
 * Normalizes JS values or raw JSON strings into a parsed value + validity status.
 */
export function parseJsonInput(input: unknown): ParsedJsonInput {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      return { ok: true, value: '' };
    }
    if (
      trimmed.startsWith('{') ||
      trimmed.startsWith('[') ||
      trimmed === 'null' ||
      trimmed === 'true' ||
      trimmed === 'false'
    ) {
      try {
        return { ok: true, value: JSON.parse(trimmed) };
      } catch (err) {
        return {
          ok: false,
          value: input,
          error: err instanceof Error ? err.message : 'Invalid JSON syntax',
        };
      }
    }
  }
  return { ok: true, value: input };
}

export function getJsonValueType(value: unknown): JsonValueType {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
}

function formatChildPath(parentPath: string, key: string, isArrayItem: boolean): string {
  if (isArrayItem) {
    return `${parentPath}[${key}]`;
  }
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return `${parentPath}.${key}`;
  }
  return `${parentPath}[${JSON.stringify(key)}]`;
}

/**
 * Recursively constructs a deterministic tree of JsonTreeNode items with canonical JSONPath IDs.
 */
export function buildJsonTree(
  value: unknown,
  keyName: string | null = null,
  path = '$',
  depth = 0
): JsonTreeNode {
  const type = getJsonValueType(value);

  if (type === 'array') {
    const arr = value as unknown[];
    const children = arr.map((item, index) =>
      buildJsonTree(item, String(index), formatChildPath(path, String(index), true), depth + 1)
    );
    return {
      path,
      keyName,
      type,
      value: arr,
      depth,
      children,
      childCount: children.length,
    };
  }

  if (type === 'object') {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
    const children = entries.map(([k, v]) =>
      buildJsonTree(v, k, formatChildPath(path, k, false), depth + 1)
    );
    return {
      path,
      keyName,
      type,
      value: obj,
      depth,
      children,
      childCount: children.length,
    };
  }

  return {
    path,
    keyName,
    type,
    value: value === undefined ? null : value,
    depth,
    children: [],
    childCount: 0,
  };
}

/**
 * Collects collapsible container paths up to `maxDepth` (exclusive if collapsed below maxDepth).
 */
export function collectCollapsiblePaths(
  root: JsonTreeNode,
  maxDepth = Infinity
): Set<string> {
  const paths = new Set<string>();
  const walk = (node: JsonTreeNode) => {
    if ((node.type === 'object' || node.type === 'array') && node.childCount > 0) {
      if (node.depth < maxDepth) {
        paths.add(node.path);
      }
      for (const child of node.children) {
        walk(child);
      }
    }
  };
  walk(root);
  return paths;
}

export function getJsonTreeStats(root: JsonTreeNode): {
  totalNodes: number;
  maxDepth: number;
} {
  let totalNodes = 0;
  let maxDepth = 0;
  const walk = (node: JsonTreeNode) => {
    totalNodes += 1;
    if (node.depth > maxDepth) maxDepth = node.depth;
    for (const child of node.children) {
      walk(child);
    }
  };
  walk(root);
  return { totalNodes, maxDepth };
}

export function formatPrimitiveValue(value: unknown, type: JsonValueType): string {
  if (type === 'null') return 'null';
  if (type === 'string') return JSON.stringify(String(value));
  return String(value);
}

/**
 * Case-insensitively searches keys, JSONPaths, and primitive values, returning matched paths
 * plus every ancestor container path that should be auto-expanded to reveal matches.
 */
export function searchJsonTree(
  root: JsonTreeNode,
  rawQuery: string
): JsonSearchResult {
  const query = rawQuery.trim().toLowerCase();
  const matchedPaths = new Set<string>();
  const ancestorPaths = new Set<string>();
  const matchList: string[] = [];

  if (!query) {
    return {
      matchedPaths,
      ancestorPaths,
      matchList,
      totalMatches: 0,
    };
  }

  const walk = (node: JsonTreeNode, ancestors: string[]): boolean => {
    const keyMatches =
      node.keyName !== null && node.keyName.toLowerCase().includes(query);
    const isPrimitive = node.type !== 'object' && node.type !== 'array';
    const valStr = isPrimitive
      ? formatPrimitiveValue(node.value, node.type).toLowerCase()
      : '';
    const valueMatches = isPrimitive && valStr.includes(query);
    const selfMatched = keyMatches || valueMatches;

    if (selfMatched) {
      matchedPaths.add(node.path);
      matchList.push(node.path);
      for (const anc of ancestors) {
        ancestorPaths.add(anc);
      }
    }

    let childMatched = false;
    const nextAncestors = [...ancestors, node.path];
    for (const child of node.children) {
      if (walk(child, nextAncestors)) {
        childMatched = true;
      }
    }

    if (childMatched) {
      ancestorPaths.add(node.path);
    }

    return selfMatched || childMatched;
  };

  walk(root, []);

  return {
    matchedPaths,
    ancestorPaths,
    matchList,
    totalMatches: matchList.length,
  };
}

/**
 * Splits `text` into highlighted and non-highlighted segments for safe React rendering.
 */
export function splitSearchHighlight(
  text: string,
  rawQuery: string
): JsonHighlightSegment[] {
  const query = rawQuery.trim();
  if (!query || !text) {
    return [{ text, highlighted: false }];
  }
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const segments: JsonHighlightSegment[] = [];

  let cursor = 0;
  let idx = lowerText.indexOf(lowerQuery, cursor);
  while (idx !== -1) {
    if (idx > cursor) {
      segments.push({ text: text.slice(cursor, idx), highlighted: false });
    }
    segments.push({
      text: text.slice(idx, idx + query.length),
      highlighted: true,
    });
    cursor = idx + query.length;
    idx = lowerText.indexOf(lowerQuery, cursor);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false });
  }

  return segments.length > 0 ? segments : [{ text, highlighted: false }];
}
