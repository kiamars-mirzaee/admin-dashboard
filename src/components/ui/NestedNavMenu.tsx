import { useEffect, useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  BarChart3,
  Blocks,
  Briefcase,
  Building2,
  ChevronRight,
  Clock,
  FileEdit,
  FileText,
  FolderOpen,
  HelpCircle,
  History,
  Kanban,
  KeyRound,
  Layers,
  LayoutDashboard,
  LineChart,
  ListChecks,
  ReceiptText,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Table2,
  Users,
} from 'lucide-react';
import type { NavRouteId } from '../../types/admin';
import { useI18n } from '../../i18n/I18nContext';
import {
  type NavIconKey,
  type NavNode,
  filterNavTree,
  getAncestorIds,
  isNodeActiveOrAncestor,
} from '../../utils/navTree';

function renderNavIcon(icon?: NavIconKey) {
  if (!icon) return null;
  const cls = 'w-4 h-4 shrink-0';
  switch (icon) {
    case 'overview':
      return <LayoutDashboard className={cls} aria-hidden="true" />;
    case 'commerce':
      return <Briefcase className={cls} aria-hidden="true" />;
    case 'orders':
      return <ReceiptText className={cls} aria-hidden="true" />;
    case 'customers':
      return <Users className={cls} aria-hidden="true" />;
    case 'components':
      return <Blocks className={cls} aria-hidden="true" />;
    case 'flagged':
      return <ShieldAlert className={cls} aria-hidden="true" />;
    case 'pending':
      return <Clock className={cls} aria-hidden="true" />;
    case 'enterprise':
      return <Building2 className={cls} aria-hidden="true" />;
    case 'risk':
      return <AlertTriangle className={cls} aria-hidden="true" />;
    case 'layers':
      return <Layers className={cls} aria-hidden="true" />;
    case 'chart':
      return <BarChart3 className={cls} aria-hidden="true" />;
    case 'table':
      return <Table2 className={cls} aria-hidden="true" />;
    case 'storage':
      return <FolderOpen className={cls} aria-hidden="true" />;
    case 'kanban':
      return <Kanban className={cls} aria-hidden="true" />;
    case 'reports':
      return <LineChart className={cls} aria-hidden="true" />;
    case 'audit':
      return <History className={cls} aria-hidden="true" />;
    case 'shield':
      return <ShieldCheck className={cls} aria-hidden="true" />;
    case 'settings':
      return <Settings className={cls} aria-hidden="true" />;
    case 'key':
      return <KeyRound className={cls} aria-hidden="true" />;
    case 'error':
      return <AlertOctagon className={cls} aria-hidden="true" />;
    case 'fileEdit':
      return <FileEdit className={cls} aria-hidden="true" />;
    case 'fileText':
      return <FileText className={cls} aria-hidden="true" />;
    case 'tasks':
      return <ListChecks className={cls} aria-hidden="true" />;
    case 'help':
      return <HelpCircle className={cls} aria-hidden="true" />;
    case 'operations':
      return <Server className={cls} aria-hidden="true" />;
  }
}

export interface NestedNavMenuProps {
  nodes: NavNode[];
  activeRoute: NavRouteId;
  onSelectRoute: (routeId: NavRouteId) => void;
  searchable?: boolean;
}

export function NestedNavMenu({
  nodes,
  activeRoute,
  onSelectRoute,
  searchable = false,
}: NestedNavMenuProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<NavRouteId>>(() => {
    const initial = getAncestorIds(nodes, activeRoute);
    initial.add('commerce');
    return initial;
  });

  useEffect(() => {
    const ancestors = getAncestorIds(nodes, activeRoute);
    if (ancestors.size === 0) return;
    setExpandedIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of ancestors) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [nodes, activeRoute]);

  const visibleNodes = useMemo(
    () => filterNavTree(nodes, query),
    [nodes, query]
  );

  const toggleGroup = (id: NavRouteId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderNodes = (items: NavNode[], depth: number) => {
    return (
      <ul
        className={
          depth > 0
            ? 'mt-1 ms-3.5 ps-2.5 border-s border-slate-200 dark:border-slate-800 space-y-1'
            : 'space-y-1'
        }
      >
        {items.map((node) => {
          const hasChildren = Boolean(node.children && node.children.length > 0);
          const isExactActive = node.id === activeRoute;
          const hasActiveDescendant =
            hasChildren &&
            !isExactActive &&
            isNodeActiveOrAncestor(node, activeRoute);
          const isExpanded =
            query.trim().length > 0 || expandedIds.has(node.id);

          return (
            <li key={node.id}>
              <button
                type="button"
                onClick={() => {
                  if (hasChildren) {
                    toggleGroup(node.id);
                  } else {
                    onSelectRoute(node.id);
                  }
                }}
                aria-expanded={hasChildren ? isExpanded : undefined}
                aria-current={isExactActive ? 'page' : undefined}
                className={`w-full min-h-[42px] md:min-h-[38px] px-3 py-1.5 rounded-xl flex items-center justify-between gap-2 text-sm transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isExactActive
                    ? 'bg-slate-900 text-white font-medium dark:bg-blue-600 dark:text-white shadow-sm'
                    : hasActiveDescendant
                      ? 'bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800/80 dark:text-white'
                      : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  {node.icon ? (
                    renderNavIcon(node.icon)
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isExactActive
                          ? 'bg-white'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate">{node.label}</span>
                </span>

                <span className="flex items-center gap-1.5 shrink-0">
                  {typeof node.badgeCount === 'number' && node.badgeCount > 0 && (
                    <span
                      className={`text-xs font-mono tabular-nums ${
                        isExactActive
                          ? 'text-white/90'
                          : 'text-red-600 dark:text-red-400 font-semibold'
                      }`}
                    >
                      {node.badgeCount}
                    </span>
                  )}
                  {hasChildren && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        isExpanded ? 'rotate-90' : 'rtl:rotate-180'
                      } ${
                        isExactActive
                          ? 'text-white/80'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </span>
              </button>

              {hasChildren && isExpanded && renderNodes(node.children!, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative">
          <Search
            className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('filterMenuPlaceholder')}
            aria-label={t('filterMenuPlaceholder')}
            className="w-full min-h-[38px] ps-8 pe-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus-visible:ring-blue-600"
          />
        </div>
      )}

      {visibleNodes.length === 0 ? (
        <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
          {t('noMatchingMenu')}
        </p>
      ) : (
        renderNodes(visibleNodes, 0)
      )}
    </div>
  );
}
