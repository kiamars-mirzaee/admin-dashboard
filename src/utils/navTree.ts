import type { NavRouteId, NavSection } from '../types/admin';
import type { TranslationKey } from '../i18n/translations';
import { translate } from './i18n';

export type NavIconKey =
  | 'overview'
  | 'commerce'
  | 'orders'
  | 'customers'
  | 'components'
  | 'flagged'
  | 'pending'
  | 'enterprise'
  | 'risk'
  | 'layers'
  | 'chart'
  | 'table'
  | 'storage'
  | 'kanban'
  | 'reports'
  | 'audit'
  | 'shield'
  | 'settings'
  | 'key'
  | 'error'
  | 'fileEdit'
  | 'fileText'
  | 'tasks'
  | 'help'
  | 'operations';

export interface NavNode {
  id: NavRouteId;
  label: string;
  icon?: NavIconKey;
  badgeCount?: number;
  children?: NavNode[];
}

export function buildAdminNavTree(
  counts: {
    flaggedOrders: number;
    pendingOrders: number;
    atRiskCustomers: number;
  },
  t: (key: TranslationKey) => string = (key) => translate('en', key)
): NavNode[] {
  return [
    {
      id: 'overview',
      label: t('navOverview'),
      icon: 'overview',
    },
    {
      id: 'commerce',
      label: t('navCommerce'),
      icon: 'commerce',
      children: [
        {
          id: 'orders-group',
          label: t('navOrders'),
          icon: 'orders',
          badgeCount: counts.flaggedOrders > 0 ? counts.flaggedOrders : undefined,
          children: [
            {
              id: 'orders-all',
              label: t('navOrdersAll'),
            },
            {
              id: 'orders-flagged',
              label: t('navOrdersFlagged'),
              icon: 'flagged',
              badgeCount: counts.flaggedOrders > 0 ? counts.flaggedOrders : undefined,
            },
            {
              id: 'orders-pending',
              label: t('navOrdersPending'),
              icon: 'pending',
              badgeCount: counts.pendingOrders > 0 ? counts.pendingOrders : undefined,
            },
            {
              id: 'kanban',
              label: t('navKanban'),
              icon: 'kanban',
            },
            {
              id: 'order-detail',
              label: t('navOrderDetail'),
              icon: 'fileText',
            },
            {
              id: 'order-editor',
              label: t('navOrderEditor'),
              icon: 'fileEdit',
            },
          ],
        },
        {
          id: 'customers-group',
          label: t('navCustomers'),
          icon: 'customers',
          children: [
            {
              id: 'customers-all',
              label: t('navCustomersAll'),
            },
            {
              id: 'customers-enterprise',
              label: t('navCustomersEnterprise'),
              icon: 'enterprise',
            },
            {
              id: 'customers-risk',
              label: t('navCustomersRisk'),
              icon: 'risk',
              badgeCount:
                counts.atRiskCustomers > 0 ? counts.atRiskCustomers : undefined,
            },
          ],
        },
      ],
    },
    {
      id: 'reports',
      label: t('navReports'),
      icon: 'reports',
    },
    {
      id: 'audit-log',
      label: t('navAuditLog'),
      icon: 'audit',
    },
    {
      id: 'storage',
      label: t('navStorage'),
      icon: 'storage',
    },
    {
      id: 'admin-group',
      label: t('navAdminGroup'),
      icon: 'shield',
      children: [
        {
          id: 'access-control',
          label: t('navAccessControl'),
          icon: 'shield',
        },
        {
          id: 'settings',
          label: t('navSettings'),
          icon: 'settings',
        },
        {
          id: 'operations-hub',
          label: t('navOperationsHub'),
          icon: 'operations',
        },
        {
          id: 'auth-flows',
          label: t('navAuthFlows'),
          icon: 'key',
        },
        {
          id: 'error-403',
          label: t('navError403'),
          icon: 'error',
        },
        {
          id: 'error-404',
          label: t('navError404'),
          icon: 'error',
        },
        {
          id: 'error-500',
          label: t('navError500'),
          icon: 'error',
        },
        {
          id: 'error-maintenance',
          label: t('navErrorMaintenance'),
          icon: 'error',
        },
        {
          id: 'error-offline',
          label: t('navErrorOffline'),
          icon: 'error',
        },
      ],
    },
    {
      id: 'tasks-queue',
      label: t('navTasksQueue'),
      icon: 'tasks',
    },
    {
      id: 'help-support',
      label: t('navHelpSupport'),
      icon: 'help',
    },
    {
      id: 'ui-system',
      label: t('navUiSystem'),
      icon: 'components',
      children: [
        {
          id: 'components-all',
          label: t('navComponentsAll'),
        },
        {
          id: 'components-inputs',
          label: t('navComponentsInputs'),
          icon: 'layers',
        },
        {
          id: 'components-workflows',
          label: t('navComponentsWorkflows'),
          icon: 'layers',
        },
        {
          id: 'components-overlays',
          label: t('navComponentsOverlays'),
          icon: 'layers',
        },
        {
          id: 'components-charts',
          label: t('navComponentsCharts'),
          icon: 'chart',
        },
        {
          id: 'components-states',
          label: t('navComponentsStates'),
          icon: 'table',
        },
      ],
    },
  ];
}

export function findNavPath(
  nodes: NavNode[],
  targetId: NavRouteId
): NavNode[] {
  for (const node of nodes) {
    if (node.id === targetId) {
      return [node];
    }
    if (node.children && node.children.length > 0) {
      const childPath = findNavPath(node.children, targetId);
      if (childPath.length > 0) {
        return [node, ...childPath];
      }
    }
  }
  return [];
}

export function getAncestorIds(
  nodes: NavNode[],
  targetId: NavRouteId
): Set<NavRouteId> {
  const path = findNavPath(nodes, targetId);
  if (path.length <= 1) return new Set();
  return new Set(path.slice(0, -1).map((n) => n.id));
}

export function isNodeActiveOrAncestor(
  node: NavNode,
  activeId: NavRouteId
): boolean {
  if (node.id === activeId) return true;
  if (!node.children) return false;
  return node.children.some((child) => isNodeActiveOrAncestor(child, activeId));
}

export function getSectionForRoute(routeId: NavRouteId): NavSection {
  if (routeId === 'overview') return 'overview';
  if (routeId === 'storage') return 'storage';
  if (routeId === 'tasks-queue') return 'tasks';
  if (routeId === 'help-support') return 'help';
  if (routeId === 'kanban') return 'kanban';
  if (routeId === 'reports') return 'reports';
  if (routeId === 'audit-log') return 'audit';
  if (routeId === 'access-control' || routeId === 'admin-group') return 'access';
  if (routeId === 'settings') return 'settings';
  if (routeId === 'operations-hub') return 'operations';
  if (routeId === 'auth-flows') return 'auth';
  if (routeId.startsWith('error-')) return 'errors';
  if (routeId.startsWith('orders') || routeId.startsWith('order-') || routeId === 'commerce') {
    return 'orders';
  }
  if (routeId.startsWith('customers')) return 'customers';
  return 'components';
}

export function filterNavTree(nodes: NavNode[], query: string): NavNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const result: NavNode[] = [];
  for (const node of nodes) {
    const labelMatches = node.label.toLowerCase().includes(q);
    if (labelMatches) {
      result.push(node);
      continue;
    }
    if (node.children && node.children.length > 0) {
      const matchingChildren = filterNavTree(node.children, q);
      if (matchingChildren.length > 0) {
        result.push({
          ...node,
          children: matchingChildren,
        });
      }
    }
  }
  return result;
}
