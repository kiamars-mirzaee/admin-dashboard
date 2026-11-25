import type { NavRouteId } from '../types/admin';
import type { NavNode } from './navTree';
import { findNavPath } from './navTree';

export const FAVORITES_STORAGE_KEY = 'kestrel_quick_favorites_v1';
export const MAX_FAVORITE_PINS = 12;

export type FavoritePinKind = 'view' | 'order' | 'customer';

export interface ViewFavoritePin {
  id: string;
  kind: 'view';
  routeId: NavRouteId;
  label: string;
  addedAt: string;
}

export interface OrderFavoritePin {
  id: string;
  kind: 'order';
  orderId: string;
  label: string;
  sublabel?: string;
  addedAt: string;
}

export interface CustomerFavoritePin {
  id: string;
  kind: 'customer';
  customerId: string;
  label: string;
  sublabel?: string;
  addedAt: string;
}

export type FavoritePin =
  | ViewFavoritePin
  | OrderFavoritePin
  | CustomerFavoritePin;

export function getViewPinId(routeId: NavRouteId): string {
  return `view:${routeId}`;
}

export function getOrderPinId(orderId: string): string {
  return `order:${orderId}`;
}

export function getCustomerPinId(customerId: string): string {
  return `customer:${customerId}`;
}

export function createViewPin(
  routeId: NavRouteId,
  label: string,
  addedAt = new Date().toISOString()
): ViewFavoritePin {
  return {
    id: getViewPinId(routeId),
    kind: 'view',
    routeId,
    label,
    addedAt,
  };
}

export function createOrderPin(
  orderId: string,
  sublabel?: string,
  addedAt = new Date().toISOString()
): OrderFavoritePin {
  return {
    id: getOrderPinId(orderId),
    kind: 'order',
    orderId,
    label: orderId,
    sublabel,
    addedAt,
  };
}

export function createCustomerPin(
  customerId: string,
  name: string,
  company?: string,
  addedAt = new Date().toISOString()
): CustomerFavoritePin {
  return {
    id: getCustomerPinId(customerId),
    kind: 'customer',
    customerId,
    label: name,
    sublabel: company,
    addedAt,
  };
}

export const DEFAULT_QUICK_FAVORITES: FavoritePin[] = [
  createViewPin('orders-flagged', 'Flagged review', '2026-11-22T08:00:00.000Z'),
  createOrderPin('ORD-8490', 'Gridline Mobility', '2026-11-22T08:01:00.000Z'),
  createCustomerPin('CUS-101', 'Marcus Chen', 'Northstar Labs', '2026-11-22T08:02:00.000Z'),
];

export function isPinned(pins: readonly FavoritePin[], pinId: string): boolean {
  return pins.some((pin) => pin.id === pinId);
}

export interface ToggleFavoriteResult {
  pins: FavoritePin[];
  action: 'added' | 'removed' | 'limit_reached';
}

export function toggleFavoritePin(
  pins: readonly FavoritePin[],
  candidate: FavoritePin,
  maxPins: number = MAX_FAVORITE_PINS
): ToggleFavoriteResult {
  if (isPinned(pins, candidate.id)) {
    return {
      pins: pins.filter((p) => p.id !== candidate.id),
      action: 'removed',
    };
  }
  if (pins.length >= maxPins) {
    return {
      pins: [...pins],
      action: 'limit_reached',
    };
  }
  return {
    pins: [...pins, candidate],
    action: 'added',
  };
}

export function removeFavoritePin(
  pins: readonly FavoritePin[],
  pinId: string
): FavoritePin[] {
  return pins.filter((pin) => pin.id !== pinId);
}

export function reorderFavoritePin(
  pins: readonly FavoritePin[],
  pinId: string,
  direction: 'prev' | 'next'
): FavoritePin[] {
  const index = pins.findIndex((p) => p.id === pinId);
  if (index === -1) return [...pins];
  const targetIndex = direction === 'prev' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= pins.length) return [...pins];
  const copy = [...pins];
  const [moved] = copy.splice(index, 1);
  copy.splice(targetIndex, 0, moved);
  return copy;
}

export function isFavoritePinActive(
  pin: FavoritePin,
  context: {
    activeRoute: NavRouteId;
    inspectedOrderId: string | null;
    inspectedCustomerId: string | null;
  }
): boolean {
  if (pin.kind === 'order') {
    return context.inspectedOrderId === pin.orderId;
  }
  if (pin.kind === 'customer') {
    return context.inspectedCustomerId === pin.customerId;
  }
  return (
    context.activeRoute === pin.routeId &&
    !context.inspectedOrderId &&
    !context.inspectedCustomerId
  );
}

export function resolveViewPinLabel(
  routeId: NavRouteId,
  navTree: NavNode[],
  fallback: string
): string {
  const path = findNavPath(navTree, routeId);
  const leaf = path[path.length - 1];
  return leaf?.label ?? fallback;
}

const VALID_ROUTE_IDS = new Set<NavRouteId>([
  'overview',
  'commerce',
  'orders-group',
  'orders-all',
  'orders-flagged',
  'orders-pending',
  'customers-group',
  'customers-all',
  'customers-enterprise',
  'customers-risk',
  'ui-system',
  'components-all',
  'components-inputs',
  'components-workflows',
  'components-overlays',
  'components-charts',
  'components-states',
]);

export function sanitizeStoredFavorites(raw: unknown): FavoritePin[] | null {
  if (!Array.isArray(raw)) return null;

  const seen = new Set<string>();
  const sanitized: FavoritePin[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const kind = record.kind;
    const addedAt =
      typeof record.addedAt === 'string' && record.addedAt.length > 0
        ? record.addedAt
        : '2026-11-22T08:00:00.000Z';

    if (
      kind === 'view' &&
      typeof record.routeId === 'string' &&
      VALID_ROUTE_IDS.has(record.routeId as NavRouteId) &&
      typeof record.label === 'string' &&
      record.label.trim().length > 0
    ) {
      const routeId = record.routeId as NavRouteId;
      const id = getViewPinId(routeId);
      if (seen.has(id)) continue;
      seen.add(id);
      sanitized.push({
        id,
        kind: 'view',
        routeId,
        label: record.label.trim(),
        addedAt,
      });
    } else if (
      kind === 'order' &&
      typeof record.orderId === 'string' &&
      record.orderId.trim().length > 0
    ) {
      const orderId = record.orderId.trim();
      const id = getOrderPinId(orderId);
      if (seen.has(id)) continue;
      seen.add(id);
      sanitized.push({
        id,
        kind: 'order',
        orderId,
        label:
          typeof record.label === 'string' && record.label.trim().length > 0
            ? record.label.trim()
            : orderId,
        sublabel:
          typeof record.sublabel === 'string' && record.sublabel.trim().length > 0
            ? record.sublabel.trim()
            : undefined,
        addedAt,
      });
    } else if (
      kind === 'customer' &&
      typeof record.customerId === 'string' &&
      record.customerId.trim().length > 0 &&
      typeof record.label === 'string' &&
      record.label.trim().length > 0
    ) {
      const customerId = record.customerId.trim();
      const id = getCustomerPinId(customerId);
      if (seen.has(id)) continue;
      seen.add(id);
      sanitized.push({
        id,
        kind: 'customer',
        customerId,
        label: record.label.trim(),
        sublabel:
          typeof record.sublabel === 'string' && record.sublabel.trim().length > 0
            ? record.sublabel.trim()
            : undefined,
        addedAt,
      });
    }

    if (sanitized.length >= MAX_FAVORITE_PINS) break;
  }

  return sanitized;
}

export function pruneDeletedOrderPins(
  pins: readonly FavoritePin[],
  validOrderIds: Iterable<string>
): FavoritePin[] {
  const validSet = new Set(validOrderIds);
  return pins.filter((pin) => {
    if (pin.kind !== 'order') return true;
    return validSet.has(pin.orderId);
  });
}
