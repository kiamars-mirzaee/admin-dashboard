import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  Eye,
  MoreHorizontal,
  RotateCcw,
  Tag,
  Trash2,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { GridActionSchema, GridOrderRow } from '../../types/dataGrid';
import { AdaptiveDrawer } from './AdaptiveDrawer';

export interface DataGridRowActionsMenuProps {
  row: GridOrderRow;
  actions: GridActionSchema[];
  onExecuteAction: (action: GridActionSchema, row: GridOrderRow) => void;
}

function renderActionIcon(icon: GridActionSchema['icon']) {
  const cls = 'w-4 h-4 shrink-0';
  switch (icon) {
    case 'eye':
      return <Eye className={cls} aria-hidden="true" />;
    case 'edit':
      return <Edit3 className={cls} aria-hidden="true" />;
    case 'copy':
      return <Copy className={cls} aria-hidden="true" />;
    case 'trash':
      return <Trash2 className={cls} aria-hidden="true" />;
    case 'tag':
      return <Tag className={cls} aria-hidden="true" />;
    case 'check':
      return <CheckCircle2 className={cls} aria-hidden="true" />;
    case 'clock':
      return <Clock className={cls} aria-hidden="true" />;
    case 'alert':
      return <AlertTriangle className={cls} aria-hidden="true" />;
    case 'rotate':
      return <RotateCcw className={cls} aria-hidden="true" />;
  }
}

function variantClasses(variant?: GridActionSchema['variant']) {
  if (variant === 'danger') {
    return 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40';
  }
  if (variant === 'warning') {
    return 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40';
  }
  if (variant === 'success') {
    return 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40';
  }
  return 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';
}

export function DataGridRowActionsMenu({
  row,
  actions,
  onExecuteAction,
}: DataGridRowActionsMenuProps) {
  const { t, isRtl } = useI18n();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [expandedSubmenuId, setExpandedSubmenuId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; openUp: boolean }>({
    top: 0,
    left: 0,
    openUp: false,
  });

  useEffect(() => {
    if (!desktopOpen) {
      setExpandedSubmenuId(null);
      return;
    }
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setDesktopOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDesktopOpen(false);
    };
    const onScroll = () => setDesktopOpen(false);

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [desktopOpen]);

  const handleOpenClick = () => {
    if (window.innerWidth < 768) {
      setExpandedSubmenuId(null);
      setMobileSheetOpen(true);
      return;
    }

    if (desktopOpen) {
      setDesktopOpen(false);
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 224;
      const estimatedHeight = 280;
      const openUp = rect.bottom + estimatedHeight > window.innerHeight - 16;
      const top = openUp
        ? Math.max(12, rect.top - estimatedHeight)
        : Math.min(window.innerHeight - estimatedHeight, rect.bottom + 6);
      const rawLeft = isRtl ? rect.left : rect.right - menuWidth;
      const left = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, rawLeft));
      setCoords({ top, left, openUp });
    }
    setDesktopOpen(true);
  };

  const renderActionItems = (closeFn: () => void, isMobile: boolean) => (
    <div className="space-y-1">
      {actions.map((action) => {
        const hasChildren =
          action.actionType === 'submenu' && action.children && action.children.length > 0;
        const isExpanded = expandedSubmenuId === action.id;

        if (hasChildren) {
          return (
            <div key={action.id} className="space-y-1">
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() =>
                  setExpandedSubmenuId((prev) => (prev === action.id ? null : action.id))
                }
                className={`w-full ${
                  isMobile ? 'min-h-[44px] px-3 text-sm' : 'min-h-[36px] px-2.5 text-xs'
                } rounded-lg font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${variantClasses(
                  action.variant
                )}`}
              >
                <span className="flex items-center gap-2">
                  {renderActionIcon(action.icon)}
                  <span>{action.label}</span>
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-70 rtl:rotate-180" aria-hidden="true" />
                )}
              </button>

              {isExpanded && (
                <div className="ps-4 ms-2 border-s border-slate-200 dark:border-slate-700 space-y-1">
                  {action.children!.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => {
                        closeFn();
                        onExecuteAction(child, row);
                      }}
                      className={`w-full ${
                        isMobile ? 'min-h-[42px] px-3 text-sm' : 'min-h-[34px] px-2.5 text-xs'
                      } rounded-lg font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${variantClasses(
                        child.variant
                      )}`}
                    >
                      <span className="flex items-center gap-2">
                        {renderActionIcon(child.icon)}
                        <span>{child.label}</span>
                      </span>
                      {child.critical && (
                        <span className="text-[10px] font-semibold opacity-75">!</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => {
              closeFn();
              onExecuteAction(action, row);
            }}
            className={`w-full ${
              isMobile ? 'min-h-[44px] px-3 text-sm' : 'min-h-[36px] px-2.5 text-xs'
            } rounded-lg font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${variantClasses(
              action.variant
            )}`}
          >
            <span className="flex items-center gap-2">
              {renderActionIcon(action.icon)}
              <span>{action.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={desktopOpen || mobileSheetOpen}
        aria-label={`${t('gridActionsMenu')} ${row.id}`}
        onClick={handleOpenClick}
        className="min-h-[36px] min-w-[36px] md:min-h-[34px] md:min-w-[34px] rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
      </button>

      {desktopOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`${t('gridActionsMenu')} ${row.id}`}
          style={{ top: coords.top, left: coords.left }}
          className="fixed z-50 w-56 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
        >
          <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span dir="ltr">{row.id}</span>
            <span className="truncate max-w-[110px] font-sans">{row.customerName}</span>
          </div>
          {renderActionItems(() => setDesktopOpen(false), false)}
        </div>
      )}

      <AdaptiveDrawer
        open={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        title={`${row.id} · ${row.customerName}`}
        subtitle={row.planOrItem}
        size="sm"
      >
        {renderActionItems(() => setMobileSheetOpen(false), true)}
      </AdaptiveDrawer>
    </>
  );
}
