import type {
  CustomerProfile,
  NavRouteId,
  OrderRecord,
} from '../types/admin';
import type { NavNode } from './navTree';
import type { TranslationKey } from '../i18n/translations';
import { formatCurrency } from './tableLogic';

export type CommandItemType = 'order' | 'customer' | 'section';
export type CommandCategoryFilter = 'all' | CommandItemType;

export interface CommandPaletteItem {
  id: string;
  type: CommandItemType;
  title: string;
  subtitle: string;
  meta?: string;
  keywords: string[];
  routeId: NavRouteId;
  entityId?: string;
  anchorId?: string;
}

export interface FuzzyMatchResult {
  matched: boolean;
  score: number;
  indices: number[];
}

export interface RankedCommandItem {
  item: CommandPaletteItem;
  score: number;
  titleIndices: number[];
  subtitleIndices: number[];
}

export interface CommandResultGroup {
  type: CommandItemType;
  items: RankedCommandItem[];
}

export interface CommandSearchOutput {
  groups: CommandResultGroup[];
  flatItems: RankedCommandItem[];
  totalCount: number;
}

export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

const BOUNDARY_CHARS = new Set([' ', '-', '_', '.', '/', '&', ':', ',']);

/**
 * Computes fuzzy match score and character highlight indices of `query` in `target`.
 * Prefers exact prefix, word-boundary, and contiguous character matches over sparse subsequences.
 */
export function fuzzyMatchScore(
  rawQuery: string,
  target: string
): FuzzyMatchResult {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return { matched: true, score: 1, indices: [] };
  }
  if (!target) {
    return { matched: false, score: 0, indices: [] };
  }

  const targetLower = target.toLowerCase();
  const compactQuery = query.replace(/\s+/g, '');
  if (!compactQuery) {
    return { matched: true, score: 1, indices: [] };
  }

  // Direct substring check yields crisp contiguous highlight + high score
  const directIdx = targetLower.indexOf(query);
  if (directIdx !== -1) {
    const indices: number[] = [];
    for (let i = directIdx; i < directIdx + query.length; i++) {
      indices.push(i);
    }
    let score = 80 + query.length * 6;
    if (targetLower === query) score += 120;
    else if (directIdx === 0) score += 45;
    else if (BOUNDARY_CHARS.has(targetLower[directIdx - 1])) score += 30;
    return { matched: true, score, indices };
  }

  // Subsequence fuzzy scan across compactQuery
  const indices: number[] = [];
  let qIdx = 0;
  let score = 0;
  let prevMatchIdx = -2;
  let maxGap = 0;
  let contiguousPairs = 0;

  for (let tIdx = 0; tIdx < targetLower.length && qIdx < compactQuery.length; tIdx++) {
    if (targetLower[tIdx] === compactQuery[qIdx]) {
      indices.push(tIdx);
      let charScore = 10;
      if (tIdx === 0 || BOUNDARY_CHARS.has(targetLower[tIdx - 1])) {
        charScore += 18;
      }
      if (tIdx === prevMatchIdx + 1) {
        charScore += 14;
        contiguousPairs++;
      } else if (prevMatchIdx >= 0) {
        const gap = tIdx - prevMatchIdx - 1;
        if (gap > maxGap) maxGap = gap;
        charScore -= Math.min(8, gap);
      }
      score += charScore;
      prevMatchIdx = tIdx;
      qIdx++;
    }
  }

  if (qIdx !== compactQuery.length) {
    return { matched: false, score: 0, indices: [] };
  }

  // Reject loose cross-sentence scatter when query is a real multi-char term (>= 4 chars)
  // Allow word-boundary acronym/abbreviation hops up to a reasonable window,
  // but prevent unrelated words 20+ chars apart from matching as a false positive.
  if (compactQuery.length >= 4) {
    const totalSpan = indices[indices.length - 1] - indices[0] + 1;
    const maxAllowedSpan = compactQuery.length * 3 + 4;
    if (maxGap > 8 || (totalSpan > maxAllowedSpan && contiguousPairs === 0)) {
      return { matched: false, score: 0, indices: [] };
    }
  }

  // Slight preference for shorter, denser targets
  const densityBonus = Math.max(0, 20 - Math.floor((targetLower.length - compactQuery.length) / 3));
  return {
    matched: true,
    score: Math.max(1, score + densityBonus),
    indices,
  };
}

/**
 * Splits `text` into plain and highlighted segments based on matched character indices.
 */
export function splitHighlightSegments(
  text: string,
  indices: number[]
): HighlightSegment[] {
  if (!text) return [];
  if (!indices || indices.length === 0) {
    return [{ text, highlighted: false }];
  }

  const indexSet = new Set(indices);
  const segments: HighlightSegment[] = [];
  let currentText = '';
  let currentHighlighted = indexSet.has(0);

  for (let i = 0; i < text.length; i++) {
    const isHit = indexSet.has(i);
    if (isHit === currentHighlighted) {
      currentText += text[i];
    } else {
      if (currentText) {
        segments.push({ text: currentText, highlighted: currentHighlighted });
      }
      currentText = text[i];
      currentHighlighted = isHit;
    }
  }

  if (currentText) {
    segments.push({ text: currentText, highlighted: currentHighlighted });
  }

  return segments;
}

function flattenNavLeaves(
  nodes: NavNode[],
  parents: string[] = []
): Array<{ node: NavNode; trail: string[] }> {
  const result: Array<{ node: NavNode; trail: string[] }> = [];
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      result.push(...flattenNavLeaves(node.children, [...parents, node.label]));
    } else {
      result.push({ node, trail: parents });
    }
  }
  return result;
}

export interface BuildCommandItemsParams {
  orders: OrderRecord[];
  customers: CustomerProfile[];
  navTree: NavNode[];
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

interface ComponentAliasDef {
  id: string;
  titleKey: TranslationKey;
  routeId: NavRouteId;
  categoryKey: TranslationKey;
  anchorId: string;
  extraKeywords: string[];
}

const COMPONENT_SECTION_ALIASES: ComponentAliasDef[] = [
  {
    id: 'comp-pickers',
    titleKey: 'kitSecPickers',
    routeId: 'components-inputs',
    categoryKey: 'kitTabInputs',
    anchorId: 'kit-section-pickers',
    extraKeywords: ['multiselect', 'multi select', 'color picker', 'hex', 'swatch', 'tags'],
  },
  {
    id: 'comp-dates',
    titleKey: 'kitSecCalendars',
    routeId: 'components-inputs',
    categoryKey: 'kitTabInputs',
    anchorId: 'kit-section-dates',
    extraKeywords: ['datepicker', 'date picker', 'datetime', 'range picker', 'persian', 'jalali', 'shamsi', 'calendar'],
  },
  {
    id: 'comp-editor-upload',
    titleKey: 'kitSecEditorUpload',
    routeId: 'components-inputs',
    categoryKey: 'kitTabInputs',
    anchorId: 'kit-section-editor-upload',
    extraKeywords: ['wysiwyg', 'rich text editor', 'multipart', 'file uploader', 'upload', 'chunk'],
  },
  {
    id: 'comp-numbers',
    titleKey: 'kitSecNumbers',
    routeId: 'components-inputs',
    categoryKey: 'kitTabInputs',
    anchorId: 'kit-section-numbers',
    extraKeywords: ['persian number', 'number formatter', 'currency', 'compact', 'numeral', 'digits'],
  },
  {
    id: 'comp-qr',
    titleKey: 'qrKitSectionTitle',
    routeId: 'components-inputs',
    categoryKey: 'kitTabInputs',
    anchorId: 'kit-section-qr',
    extraKeywords: ['qr', 'qr code', 'scanner', 'camera', 'barcode', 'tag', 'document'],
  },
  {
    id: 'comp-workflows',
    titleKey: 'kitTabWorkflows',
    routeId: 'components-workflows',
    categoryKey: 'kitTabWorkflows',
    anchorId: 'kit-section-workflows',
    extraKeywords: ['task', 'subtask', 'project', 'subproject', 'ticket', 'conversion log', 'template'],
  },
  {
    id: 'comp-breadcrumbs',
    titleKey: 'breadcrumbDemoTitle',
    routeId: 'components-overlays',
    categoryKey: 'kitTabOverlays',
    anchorId: 'kit-section-breadcrumbs',
    extraKeywords: ['breadcrumb', 'hierarchy', 'trail', 'navigation'],
  },
];

export function buildCommandPaletteItems({
  orders,
  customers,
  navTree,
  t,
}: BuildCommandItemsParams): CommandPaletteItem[] {
  const items: CommandPaletteItem[] = [];

  for (const order of orders) {
    items.push({
      id: `order:${order.id}`,
      type: 'order',
      title: `${order.id} — ${order.company}`,
      subtitle: `${order.customerName} · ${order.planOrItem}`,
      meta: formatCurrency(order.amount),
      keywords: [
        order.id,
        order.customerName,
        order.customerEmail,
        order.company,
        order.planOrItem,
        order.status,
        order.region,
        order.paymentMethod,
        String(order.amount),
      ],
      routeId: 'orders-all',
      entityId: order.id,
    });
  }

  for (const customer of customers) {
    items.push({
      id: `customer:${customer.id}`,
      type: 'customer',
      title: `${customer.name} — ${customer.company}`,
      subtitle: `${customer.role} · ${customer.location} · ${customer.email}`,
      meta: formatCurrency(customer.totalSpend),
      keywords: [
        customer.id,
        customer.name,
        customer.company,
        customer.email,
        customer.role,
        customer.tier,
        customer.location,
        customer.healthStatus,
      ],
      routeId: 'customers-all',
      entityId: customer.id,
    });
  }

  const navLeaves = flattenNavLeaves(navTree);
  const seenRoutes = new Set<NavRouteId>();
  for (const { node, trail } of navLeaves) {
    if (seenRoutes.has(node.id)) continue;
    seenRoutes.add(node.id);
    items.push({
      id: `route:${node.id}`,
      type: 'section',
      title: node.label,
      subtitle: trail.length > 0 ? trail.join(' / ') : t('navigationTitle'),
      keywords: [node.id, node.label, ...trail],
      routeId: node.id,
    });
  }

  for (const alias of COMPONENT_SECTION_ALIASES) {
    items.push({
      id: `section:${alias.id}`,
      type: 'section',
      title: t(alias.titleKey),
      subtitle: `${t('navComponents')} / ${t(alias.categoryKey)}`,
      keywords: [alias.id, t(alias.titleKey), t(alias.categoryKey), ...alias.extraKeywords],
      routeId: alias.routeId,
      anchorId: alias.anchorId,
    });
  }

  return items;
}

const GROUP_ORDER: CommandItemType[] = ['order', 'customer', 'section'];

export function searchCommandPalette(
  items: CommandPaletteItem[],
  query: string,
  categoryFilter: CommandCategoryFilter = 'all',
  limitPerGroup = 6
): CommandSearchOutput {
  const filteredPool =
    categoryFilter === 'all'
      ? items
      : items.filter((item) => item.type === categoryFilter);

  const trimmed = query.trim();

  if (!trimmed) {
    const groups: CommandResultGroup[] = [];
    const flatItems: RankedCommandItem[] = [];

    for (const type of GROUP_ORDER) {
      if (categoryFilter !== 'all' && categoryFilter !== type) continue;
      const slice = filteredPool
        .filter((i) => i.type === type)
        .slice(0, limitPerGroup)
        .map<RankedCommandItem>((item) => ({
          item,
          score: 1,
          titleIndices: [],
          subtitleIndices: [],
        }));
      if (slice.length > 0) {
        groups.push({ type, items: slice });
        flatItems.push(...slice);
      }
    }

    return {
      groups,
      flatItems,
      totalCount: flatItems.length,
    };
  }

  // Support multi-term queries (e.g., "marcus northstar" or "8490 flagged")
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const rankedByGroup: Record<CommandItemType, RankedCommandItem[]> = {
    order: [],
    customer: [],
    section: [],
  };

  for (const item of filteredPool) {
    let totalScore = 0;
    let allTokensMatched = true;
    const titleIndicesSet = new Set<number>();
    const subtitleIndicesSet = new Set<number>();

    for (const token of tokens) {
      const titleHit = fuzzyMatchScore(token, item.title);
      const subtitleHit = fuzzyMatchScore(token, item.subtitle);

      let bestKeywordScore = 0;
      for (const kw of item.keywords) {
        const kwHit = fuzzyMatchScore(token, kw);
        if (kwHit.matched && kwHit.score > bestKeywordScore) {
          bestKeywordScore = kwHit.score;
        }
      }

      if (!titleHit.matched && !subtitleHit.matched && bestKeywordScore === 0) {
        allTokensMatched = false;
        break;
      }

      const weightedTitle = titleHit.matched ? Math.round(titleHit.score * 1.4) : 0;
      const weightedSub = subtitleHit.matched ? Math.round(subtitleHit.score * 1.05) : 0;
      const weightedKw = Math.round(bestKeywordScore * 0.9);

      totalScore += Math.max(weightedTitle, weightedSub, weightedKw);

      if (titleHit.matched) {
        for (const idx of titleHit.indices) titleIndicesSet.add(idx);
      }
      if (subtitleHit.matched) {
        for (const idx of subtitleHit.indices) subtitleIndicesSet.add(idx);
      }
    }

    if (allTokensMatched) {
      rankedByGroup[item.type].push({
        item,
        score: totalScore,
        titleIndices: Array.from(titleIndicesSet).sort((a, b) => a - b),
        subtitleIndices: Array.from(subtitleIndicesSet).sort((a, b) => a - b),
      });
    }
  }

  const groups: CommandResultGroup[] = [];
  const flatItems: RankedCommandItem[] = [];

  for (const type of GROUP_ORDER) {
    const sorted = rankedByGroup[type]
      .sort((a, b) => b.score - a.score)
      .slice(0, limitPerGroup);
    if (sorted.length > 0) {
      groups.push({ type, items: sorted });
      flatItems.push(...sorted);
    }
  }

  return {
    groups,
    flatItems,
    totalCount: flatItems.length,
  };
}
