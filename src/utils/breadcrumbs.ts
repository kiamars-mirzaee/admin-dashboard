import type { NavRouteId } from '../types/admin';
import { type NavNode, findNavPath } from './navTree';

export interface BreadcrumbItem {
  id: string;
  label: string;
  routeId?: NavRouteId;
  isCurrent?: boolean;
  isRoot?: boolean;
  preserveLtr?: boolean;
  onClick?: () => void;
}

export type CollapsedBreadcrumbToken =
  | { kind: 'item'; item: BreadcrumbItem }
  | { kind: 'ellipsis'; hiddenItems: BreadcrumbItem[] };

/**
 * Resolves a parent group node ID to a valid navigable landing route so
 * clicking any ancestor breadcrumb navigates to a real workspace view.
 */
export function resolveGroupTargetRoute(routeId: NavRouteId): NavRouteId {
  switch (routeId) {
    case 'commerce':
    case 'orders-group':
      return 'orders-all';
    case 'customers-group':
      return 'customers-all';
    case 'admin-group':
      return 'access-control';
    case 'ui-system':
      return 'components-all';
    default:
      return routeId;
  }
}

export interface BuildBreadcrumbsOptions {
  navTree: NavNode[];
  activeRoute: NavRouteId;
  rootLabel: string;
  inspectedItemLabel?: string | null;
  onNavigate?: (route: NavRouteId) => void;
  onClearInspectedItem?: () => void;
}

/**
 * Dynamically builds the breadcrumb trail from the active navigation route
 * plus any active deep sub-context (such as an open Order inspection drawer).
 */
export function buildBreadcrumbsForRoute({
  navTree,
  activeRoute,
  rootLabel,
  inspectedItemLabel,
  onNavigate,
  onClearInspectedItem,
}: BuildBreadcrumbsOptions): BreadcrumbItem[] {
  const hasInspectedItem = Boolean(inspectedItemLabel && inspectedItemLabel.trim());
  const isOverviewOnly = activeRoute === 'overview' && !hasInspectedItem;

  const items: BreadcrumbItem[] = [
    {
      id: 'root-overview',
      label: rootLabel,
      routeId: 'overview',
      isRoot: true,
      isCurrent: isOverviewOnly,
      onClick: isOverviewOnly
        ? undefined
        : () => {
            onClearInspectedItem?.();
            onNavigate?.('overview');
          },
    },
  ];

  if (activeRoute !== 'overview') {
    const path = findNavPath(navTree, activeRoute);
    path.forEach((node, index) => {
      const isLastNode = index === path.length - 1;
      const isCurrent = isLastNode && !hasInspectedItem;
      const targetRoute = resolveGroupTargetRoute(node.id);

      items.push({
        id: node.id,
        label: node.label,
        routeId: targetRoute,
        isCurrent,
        onClick: isCurrent
          ? undefined
          : () => {
              if (isLastNode && hasInspectedItem) {
                onClearInspectedItem?.();
              } else {
                onClearInspectedItem?.();
                onNavigate?.(targetRoute);
              }
            },
      });
    });
  }

  if (hasInspectedItem && inspectedItemLabel) {
    items.push({
      id: `detail-${inspectedItemLabel}`,
      label: inspectedItemLabel,
      isCurrent: true,
      preserveLtr: true,
    });
  }

  return items;
}

/**
 * Collapses intermediate breadcrumb items into an interactive ellipsis bucket
 * when the trail exceeds `maxVisible` items, keeping root and trailing context visible.
 */
export function collapseBreadcrumbs(
  items: BreadcrumbItem[],
  maxVisible = 4
): CollapsedBreadcrumbToken[] {
  if (maxVisible < 3 || items.length <= maxVisible) {
    return items.map((item) => ({ kind: 'item', item }));
  }

  const tailCount = maxVisible - 2; // root + ellipsis + tailCount == maxVisible
  const first = items[0];
  const hiddenItems = items.slice(1, items.length - tailCount);
  const tail = items.slice(items.length - tailCount);

  return [
    { kind: 'item', item: first },
    { kind: 'ellipsis', hiddenItems },
    ...tail.map((item): CollapsedBreadcrumbToken => ({ kind: 'item', item })),
  ];
}
