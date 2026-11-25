import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  Download,
  FileDown,
  Layers,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { OrderChannel, OrderStatus, SortDirection } from '../../types/admin';
import type {
  GridActionSchema,
  GridBulkActionSchema,
  GridBulkScope,
  GridColumnSchema,
  GridFilterValues,
  GridOrderRow,
  GridSchemaResponse,
} from '../../types/dataGrid';
import { exportDataGridToPdf } from '../../services/pdfExportService';
import { countActiveGridFilters } from '../../utils/dataGridEngine';
import { buildPrintableColumns } from '../../utils/printExport';
import { formatCurrency } from '../../utils/tableLogic';
import { DataGridPrintModal } from '../print/DataGridPrintModal';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { DataGridBulkModal } from './DataGridBulkModal';
import { DataGridColumnSettings } from './DataGridColumnSettings';
import { DataGridCrudModal } from './DataGridCrudModal';
import { DataGridFilterSheet } from './DataGridFilterSheet';
import { DataGridRowActionsMenu } from './DataGridRowActionsMenu';
import { EmptyState } from './EmptyState';
import { ConfirmModal } from './Modal';
import { useNotifications } from './NotificationSystem';
import { SegmentedControl } from './SegmentedControl';
import { TableSkeleton } from './Skeleton';
import { StatusIndicator } from './StatusIndicator';

export interface AutoDataGridProps {
  endpoint?: string;
  initialFilters?: GridFilterValues;
  externalRefreshKey?: number;
  onInspectRow?: (row: GridOrderRow) => void;
  onDataMutated?: () => void;
}

interface PendingApprovalState {
  title: string;
  message: string;
  confirmLabel: string;
  onApprove: () => Promise<void>;
}

export function AutoDataGrid({
  endpoint = '/api/orders',
  initialFilters,
  externalRefreshKey = 0,
  onInspectRow,
  onDataMutated,
}: AutoDataGridProps) {
  const { t, tStatus, tChannel, dir } = useI18n();
  const { addToast } = useNotifications();

  const [schema, setSchema] = useState<GridSchemaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<GridFilterValues>(initialFilters ?? {});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[] | null>(null);

  // Overlays & Modals
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkInitialAction, setBulkInitialAction] = useState<string | undefined>(undefined);
  const [bulkInitialScope, setBulkInitialScope] = useState<GridBulkScope | undefined>(undefined);
  const [crudOpen, setCrudOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<GridOrderRow | null>(null);
  const [crudSubmitting, setCrudSubmitting] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PendingApprovalState | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [internalRefresh, setInternalRefresh] = useState(0);

  // Sync external initialFilters presets (e.g. sidebar Flagged / Pending routes)
  useEffect(() => {
    if (initialFilters !== undefined) {
      setFilters(initialFilters);
      setPage(1);
    }
  }, [initialFilters]);

  // Debounce search input slightly for smooth typing
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 140);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchGrid = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('sortField', sortField);
      params.set('sortDirection', sortDirection);
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      if (Object.keys(filters).length > 0) {
        params.set('filters', JSON.stringify(filters));
      }

      const sep = endpoint.includes('?') ? '&' : '?';
      const res = await fetch(`${endpoint}${sep}${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as GridSchemaResponse;
      setSchema(data);

      // Initialize persisted column visibility once from localStorage or backend defaults
      setVisibleColumnKeys((prev) => {
        if (prev !== null) return prev;
        try {
          const saved = localStorage.getItem(`kestrel_grid_cols_${data.resource}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed as string[];
            }
          }
        } catch {
          // ignore storage errors
        }
        return data.defaultVisibleColumns;
      });
    } catch {
      addToast({
        title: 'Failed to load data grid',
        description: `Could not reach ${endpoint}`,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [
    endpoint,
    page,
    pageSize,
    sortField,
    sortDirection,
    debouncedSearch,
    filters,
    addToast,
  ]);

  useEffect(() => {
    void fetchGrid();
  }, [fetchGrid, internalRefresh, externalRefreshKey]);

  const handleVisibleColumnsChange = (nextKeys: string[]) => {
    setVisibleColumnKeys(nextKeys);
    if (schema?.resource) {
      try {
        localStorage.setItem(
          `kestrel_grid_cols_${schema.resource}`,
          JSON.stringify(nextKeys)
        );
      } catch {
        // ignore storage errors
      }
    }
  };

  const activeColumns = useMemo(() => {
    if (!schema) return [];
    const vis = new Set(visibleColumnKeys ?? schema.defaultVisibleColumns);
    return schema.columns.filter((col) => col.locked || vis.has(col.key));
  }, [schema, visibleColumnKeys]);

  const printableColumns = useMemo(() => {
    if (!schema) return [];
    return buildPrintableColumns(
      schema.columns,
      visibleColumnKeys ?? schema.defaultVisibleColumns
    );
  }, [schema, visibleColumnKeys]);

  const rows = schema?.rows ?? [];
  const pagination = schema?.pagination ?? {
    page: 1,
    pageSize,
    totalItems: 0,
    totalPages: 1,
    allMatchingCount: 0,
    totalDatasetCount: 0,
  };

  const allPageSelected =
    rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectPage = () => {
    const pageIds = rows.map((r) => r.id);
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSort = (field: string) => {
    setSortDirection((prevDir) =>
      sortField === field && prevDir === 'desc' ? 'asc' : 'desc'
    );
    setSortField(field);
    setPage(1);
  };

  const quickStatuses = Array.isArray(filters.statuses)
    ? (filters.statuses as string[])
    : [];
  const quickStatusValue = quickStatuses.length === 1 ? quickStatuses[0] : 'all';

  const handleQuickStatus = (next: string) => {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      statuses: next === 'all' ? [] : [next],
    }));
  };

  const activeFilterCount = useMemo(
    () => countActiveGridFilters(filters, search),
    [filters, search]
  );

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (search.trim()) chips.push({ key: 'search', label: `"${search.trim()}"` });
    if (typeof filters.commaCodes === 'string' && filters.commaCodes.trim()) {
      chips.push({ key: 'commaCodes', label: `IDs: ${filters.commaCodes.trim()}` });
    }
    if (
      filters.seatsExact !== undefined &&
      filters.seatsExact !== null &&
      String(filters.seatsExact).trim() !== ''
    ) {
      chips.push({ key: 'seatsExact', label: `Seats: ${filters.seatsExact}` });
    }
    const amt = (filters.amountRange ?? {}) as { min?: string; max?: string };
    if (amt.min || amt.max) {
      chips.push({
        key: 'amountRange',
        label: `Amount: ${amt.min || '0'} – ${amt.max || '∞'}`,
      });
    }
    const dr = (filters.dateRange ?? {}) as { startDate?: string; endDate?: string };
    if (dr.startDate || dr.endDate) {
      chips.push({
        key: 'dateRange',
        label: `Date: ${dr.startDate || '...'} → ${dr.endDate || '...'}`,
      });
    }
    const dt = (filters.cutoverRange ?? {}) as { start?: string; end?: string };
    if (dt.start || dt.end) {
      chips.push({
        key: 'cutoverRange',
        label: `Cutover: ${dt.start || '...'} → ${dt.end || '...'}`,
      });
    }
    for (const s of quickStatuses) {
      chips.push({ key: `status:${s}`, label: `${t('colStatus')}: ${tStatus(s as OrderStatus)}` });
    }
    const channels = Array.isArray(filters.channels) ? (filters.channels as string[]) : [];
    for (const ch of channels) {
      chips.push({ key: `channel:${ch}`, label: `${t('channelLabel')}: ${tChannel(ch as OrderChannel)}` });
    }
    const companies = Array.isArray(filters.companies) ? (filters.companies as string[]) : [];
    for (const co of companies) {
      chips.push({ key: `company:${co}`, label: co });
    }
    const regions = Array.isArray(filters.regions) ? (filters.regions as string[]) : [];
    for (const reg of regions) {
      chips.push({ key: `region:${reg}`, label: reg });
    }
    return chips;
  }, [filters, search, quickStatuses, t, tStatus, tChannel]);

  const removeChip = (key: string) => {
    setPage(1);
    if (key === 'search') {
      setSearch('');
      setDebouncedSearch('');
      return;
    }
    setFilters((prev) => {
      const next = { ...prev };
      if (key === 'commaCodes') delete next.commaCodes;
      else if (key === 'seatsExact') delete next.seatsExact;
      else if (key === 'amountRange') delete next.amountRange;
      else if (key === 'dateRange') delete next.dateRange;
      else if (key === 'cutoverRange') delete next.cutoverRange;
      else if (key.startsWith('status:')) {
        const val = key.slice(7);
        next.statuses = ((next.statuses as string[]) ?? []).filter((s) => s !== val);
      } else if (key.startsWith('channel:')) {
        const val = key.slice(8);
        next.channels = ((next.channels as string[]) ?? []).filter((c) => c !== val);
      } else if (key.startsWith('company:')) {
        const val = key.slice(8);
        next.companies = ((next.companies as string[]) ?? []).filter((c) => c !== val);
      } else if (key.startsWith('region:')) {
        const val = key.slice(7);
        next.regions = ((next.regions as string[]) ?? []).filter((r) => r !== val);
      }
      return next;
    });
  };

  const triggerBackendExport = async (scope: GridBulkScope, targetCount: number) => {
    const params = new URLSearchParams();
    params.set('scope', scope);
    if (scope === 'selected' && selectedIds.length > 0) {
      params.set('ids', selectedIds.join(','));
    }
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    params.set('sortField', sortField);
    params.set('sortDirection', sortDirection);
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (Object.keys(filters).length > 0) params.set('filters', JSON.stringify(filters));
    if (visibleColumnKeys && visibleColumnKeys.length > 0) {
      params.set('columns', visibleColumnKeys.join(','));
    }

    const res = await fetch(`${endpoint}/export?${params.toString()}`);
    if (!res.ok) {
      addToast({ title: 'Export failed', variant: 'error' });
      return;
    }
    const csvText = await res.text();
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kestrel-orders-${scope}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({
      title: 'CSV export ready',
      description: `Exported ${targetCount} record(s) (${scope}).`,
      variant: 'success',
    });
  };

  const executeSingleRowAction = async (
    action: GridActionSchema,
    row: GridOrderRow
  ) => {
    if (action.actionType === 'inspect') {
      onInspectRow?.(row);
      return;
    }
    if (action.actionType === 'edit') {
      setEditingRow(row);
      setCrudOpen(true);
      return;
    }

    const perform = async () => {
      if (action.actionType === 'delete') {
        const res = await fetch(`${endpoint}/${encodeURIComponent(row.id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setSelectedIds((prev) => prev.filter((id) => id !== row.id));
          addToast({
            title: `Deleted ${row.id}`,
            description: 'Record removed from backend ledger.',
            variant: 'warning',
          });
          setInternalRefresh((n) => n + 1);
          onDataMutated?.();
        }
        return;
      }

      if (action.actionType === 'duplicate') {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duplicateFromId: row.id }),
        });
        if (res.ok) {
          const data = (await res.json()) as { row: GridOrderRow };
          addToast({
            title: `Duplicated ${row.id} → ${data.row.id}`,
            variant: 'success',
          });
          setInternalRefresh((n) => n + 1);
          onDataMutated?.();
        }
        return;
      }

      if (action.actionType === 'patch' && action.patchPayload) {
        const res = await fetch(`${endpoint}/${encodeURIComponent(row.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.patchPayload),
        });
        if (res.ok) {
          addToast({
            title: `Updated ${row.id}`,
            description: action.label,
            variant: 'success',
          });
          setInternalRefresh((n) => n + 1);
          onDataMutated?.();
        }
      }
    };

    if (action.critical) {
      setPendingApproval({
        title: action.confirmTitle ?? t('gridApprovalTitle'),
        message: `${action.confirmMessage ?? ''} (${row.id} · ${row.customerName})`,
        confirmLabel: t('gridApproveBtn'),
        onApprove: perform,
      });
    } else {
      await perform();
    }
  };

  const executeBulkAction = async (args: {
    action: GridBulkActionSchema;
    scope: GridBulkScope;
    targetCount: number;
    payload: Record<string, string>;
  }) => {
    const { action, scope, targetCount, payload } = args;
    if (action.kind === 'export') {
      await triggerBackendExport(scope, targetCount);
      return;
    }

    const performBulk = async () => {
      const res = await fetch(`${endpoint}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: action.id,
          scope,
          selectedIds,
          search: debouncedSearch,
          filters,
          sortField,
          sortDirection,
          page,
          pageSize,
          payload,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        addToast({
          title: err.error ?? 'Bulk action failed',
          variant: 'error',
        });
        return;
      }
      const data = (await res.json()) as { affectedCount: number };
      if (scope === 'selected' || action.kind === 'delete') {
        setSelectedIds([]);
      }
      addToast({
        title: t('gridBulkAppliedToast', {
          action: action.label,
          count: data.affectedCount,
        }),
        variant: action.critical ? 'warning' : 'success',
      });
      setInternalRefresh((n) => n + 1);
      onDataMutated?.();
    };

    if (action.critical) {
      const scopeLabel =
        scope === 'selected'
          ? t('gridScopeSelected', { count: targetCount })
          : scope === 'current-page'
            ? t('gridScopePage', { count: targetCount })
            : scope === 'current-filter'
              ? t('gridScopeFilter', { count: targetCount })
              : t('gridScopeAll', { count: targetCount });

      setPendingApproval({
        title: action.confirmTitle ?? t('gridApprovalTitle'),
        message: `${action.confirmMessage ?? ''} (${t('gridApprovalTargetSummary', {
          scope: scopeLabel,
          count: targetCount,
        })})`,
        confirmLabel: t('gridApproveBtn'),
        onApprove: performBulk,
      });
    } else {
      await performBulk();
    }
  };

  const handleCrudSubmit = async (payload: Record<string, unknown>) => {
    setCrudSubmitting(true);
    try {
      const isEdit = Boolean(editingRow);
      const url = isEdit
        ? `${endpoint}/${encodeURIComponent(editingRow!.id)}`
        : endpoint;
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        addToast({
          title: err.error ?? 'Failed to save record',
          variant: 'error',
        });
        return;
      }
      const data = (await res.json()) as { row: GridOrderRow };
      setCrudOpen(false);
      setEditingRow(null);
      addToast({
        title: isEdit ? `Updated ${data.row.id}` : `Created ${data.row.id}`,
        description: `${data.row.customerName} (${data.row.company})`,
        variant: 'success',
      });
      setInternalRefresh((n) => n + 1);
      onDataMutated?.();
    } finally {
      setCrudSubmitting(false);
    }
  };

  const renderCellContent = (col: GridColumnSchema, row: GridOrderRow) => {
    switch (col.type) {
      case 'id':
        return (
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={selectedIds.includes(row.id)}
              onChange={() => toggleSelectRow(row.id)}
              aria-label={t('gridSelectRow', { id: row.id })}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 cursor-pointer shrink-0"
            />
            <button
              type="button"
              dir="ltr"
              onClick={() => onInspectRow?.(row)}
              className="font-mono text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer whitespace-nowrap"
            >
              {row.id}
            </button>
          </div>
        );
      case 'avatar-text':
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar src={row.customerAvatar} name={row.customerName} size="sm" />
            <div className="min-w-0">
              <div className="font-medium text-slate-900 dark:text-white truncate">
                {row.customerName}
              </div>
              {col.secondaryKey && (
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {String((row as unknown as Record<string, unknown>)[col.secondaryKey] ?? '')}
                </div>
              )}
            </div>
          </div>
        );
      case 'status':
        return <StatusIndicator status={row.status} />;
      case 'currency':
        return (
          <span dir="ltr" className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
            {formatCurrency(row.amount)}
          </span>
        );
      case 'number':
        return (
          <span dir="ltr" className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">
            {Number((row as unknown as Record<string, unknown>)[col.key] ?? 0).toLocaleString()}
          </span>
        );
      case 'date':
      case 'datetime':
        return (
          <span dir="ltr" className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {String((row as unknown as Record<string, unknown>)[col.key] ?? '—').replace('T', ' · ')}
          </span>
        );
      case 'text':
      default: {
        const raw = (row as unknown as Record<string, unknown>)[col.key];
        const text =
          col.key === 'channel'
            ? tChannel(row.channel)
            : raw !== undefined && raw !== null
              ? String(raw)
              : '—';
        return (
          <span className="text-sm text-slate-700 dark:text-slate-200 truncate block max-w-[220px]">
            {text}
          </span>
        );
      }
    }
  };

  const visibleOptionalKeys = useMemo(() => {
    const keys = visibleColumnKeys ?? schema?.defaultVisibleColumns ?? [];
    return new Set(keys);
  }, [visibleColumnKeys, schema]);

  const startRange =
    pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endRange = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalItems
  );

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('ordersTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {t('ordersShowing', {
              visible: pagination.allMatchingCount,
              total: pagination.totalDatasetCount,
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => setInternalRefresh((n) => n + 1)}
          >
            {t('refresh')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Columns3 className="w-3.5 h-3.5" />}
            onClick={() => setColumnsOpen(true)}
          >
            {t('gridColumnsBtn')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Layers className="w-3.5 h-3.5" />}
            onClick={() => {
              setBulkInitialAction(undefined);
              setBulkInitialScope(selectedIds.length > 0 ? 'selected' : 'all-rows');
              setBulkModalOpen(true);
            }}
          >
            {t('gridBulkBtn')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            disabled={pagination.totalDatasetCount === 0}
            onClick={() =>
              void triggerBackendExport('all-rows', pagination.totalDatasetCount)
            }
          >
            {t('gridExportAll')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            disabled={pagination.allMatchingCount === 0}
            onClick={() => setPrintOpen(true)}
            data-testid="grid-print-btn"
          >
            {t('printBtn')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={
              exportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )
            }
            disabled={rows.length === 0 || exportingPdf}
            onClick={async () => {
              setExportingPdf(true);
              try {
                const targetRows =
                  selectedIds.length > 0
                    ? rows.filter((r) => selectedIds.includes(r.id))
                    : rows;
                const exportRows = targetRows.length > 0 ? targetRows : rows;
                const scopeLabel =
                  selectedIds.length > 0
                    ? t('printScopeSelected', { count: exportRows.length })
                    : t('printScopePage', { count: exportRows.length });
                const res = await exportDataGridToPdf(
                  {
                    rows: exportRows,
                    columns: printableColumns,
                    filterChips: activeFilterChips,
                    scopeLabel,
                  },
                  {
                    brandName: t('brandName'),
                    title: t('printGridDocTitle'),
                    noFiltersLabel: t('printNoFilters'),
                    activeFiltersLabel: t('printActiveFilters'),
                    generatedLabel: t('printGeneratedAt'),
                    recordsLabel: t('printSummaryCount'),
                    grossVolumeLabel: t('kpiGrossVolume'),
                    settledLabel: t('kpiSettledRevenue'),
                    averageOrderLabel: t('kpiAverageOrder'),
                    totalLabel: t('printSummaryTotal'),
                    rtl: dir === 'rtl',
                    statusLabel: tStatus,
                    channelLabel: tChannel,
                  }
                );
                addToast({
                  title: t('pdfExportSuccessToast', { filename: res.filename }),
                  variant: 'success',
                });
              } catch {
                addToast({ title: t('pdfExportErrorToast'), variant: 'error' });
              } finally {
                setExportingPdf(false);
              }
            }}
            data-testid="grid-export-pdf-btn"
          >
            {exportingPdf ? t('pdfExporting') : t('pdfExportBtn')}
          </Button>
          {schema?.crud.allowCreate && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                setEditingRow(null);
                setCrudOpen(true);
              }}
            >
              {t('gridAddRecord')}
            </Button>
          )}
        </div>
      </div>

      {/* Search + Advanced Filter Sheet Trigger */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchOrdersPlaceholder')}
            aria-label={t('searchOrdersPlaceholder')}
            className="w-full min-h-[44px] ps-10 pe-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={activeFilterCount > 0 ? 'primary' : 'secondary'}
            size="md"
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            onClick={() => setFilterSheetOpen(true)}
            className="w-full md:w-auto"
          >
            {activeFilterCount > 0
              ? t('filtersCount', { count: activeFilterCount })
              : t('advancedFilters')}
          </Button>
        </div>
      </div>

      {/* Quick Status Tabs */}
      {schema && (
        <div className="flex items-center justify-between gap-3">
          <SegmentedControl
            ariaLabel={t('colStatus')}
            value={quickStatusValue}
            onChange={handleQuickStatus}
            options={[
              { value: 'all', label: t('all'), count: schema.statusCounts.all ?? 0 },
              {
                value: 'Completed',
                label: tStatus('Completed'),
                count: schema.statusCounts.Completed ?? 0,
              },
              {
                value: 'Processing',
                label: tStatus('Processing'),
                count: schema.statusCounts.Processing ?? 0,
              },
              {
                value: 'Pending',
                label: tStatus('Pending'),
                count: schema.statusCounts.Pending ?? 0,
              },
              {
                value: 'Flagged',
                label: tStatus('Flagged'),
                count: schema.statusCounts.Flagged ?? 0,
              },
            ]}
          />
        </div>
      )}

      {/* Active Filter Chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => removeChip(chip.key)}
              aria-label={`Remove filter ${chip.label}`}
              className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>{chip.label}</span>
              <X className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setDebouncedSearch('');
              setFilters({});
              setPage(1);
            }}
            className="min-h-[34px] px-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            {t('clearAll')}
          </button>
        </div>
      )}

      {/* Selection Context Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 px-1">
            <span className="text-xs sm:text-sm font-semibold tabular-nums">
              {t('selectedCount', { count: selectedIds.length })}
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
            >
              {t('clearAll')}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => void triggerBackendExport('selected', selectedIds.length)}
            >
              {t('exportShort')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Layers className="w-3.5 h-3.5" />}
              onClick={() => {
                setBulkInitialAction('bulk-status');
                setBulkInitialScope('selected');
                setBulkModalOpen(true);
              }}
            >
              {t('gridBulkBtn')}
            </Button>
          </div>
        </div>
      )}

      {/* Main Table / Mobile Cards */}
      {loading && !schema ? (
        <TableSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Search className="w-5 h-5" />}
          title={t('noMatchingOrders')}
          description={t('noMatchingOrdersDesc')}
          actionLabel={t('clearAllFilters')}
          onAction={() => {
            setSearch('');
            setDebouncedSearch('');
            setFilters({});
            setPage(1);
          }}
        />
      ) : (
        <>
          {/* Mobile View (< md): Tactile Row Cards */}
          <div className="md:hidden space-y-3" data-testid="mobile-card-list">
            <div className="flex items-center justify-between px-1">
              <label className="inline-flex items-center gap-2.5 min-h-[44px] text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectPage}
                  aria-label={t('selectAllOnPage', { count: rows.length })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
                <span>{t('selectAllOnPage', { count: rows.length })}</span>
              </label>
            </div>

            {rows.map((row) => {
              const isSelected = selectedIds.includes(row.id);
              return (
                <article
                  key={row.id}
                  data-testid="mobile-row-card"
                  className={`rounded-2xl bg-white dark:bg-slate-900 border transition-colors p-4 ${
                    isSelected
                      ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-1 shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.id)}
                        aria-label={t('gridSelectRow', { id: row.id })}
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={row.customerAvatar} name={row.customerName} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {row.customerName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {row.company}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {visibleOptionalKeys.has('amount') && (
                            <span
                              dir="ltr"
                              className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white"
                            >
                              {formatCurrency(row.amount)}
                            </span>
                          )}
                          {schema && (
                            <DataGridRowActionsMenu
                              row={row}
                              actions={schema.rowActions}
                              onExecuteAction={(action, r) =>
                                void executeSingleRowAction(action, r)
                              }
                            />
                          )}
                        </div>
                      </div>

                      {visibleOptionalKeys.has('planOrItem') && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
                          {row.planOrItem}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <button
                            type="button"
                            dir="ltr"
                            onClick={() => onInspectRow?.(row)}
                            className="font-mono font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 cursor-pointer"
                          >
                            {row.id}
                          </button>
                          {visibleOptionalKeys.has('seatsCount') && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>
                                {row.seatsCount} {t('gridSeatsShort')}
                              </span>
                            </>
                          )}
                          {visibleOptionalKeys.has('date') && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span dir="ltr" className="font-mono">
                                {row.date}
                              </span>
                            </>
                          )}
                          {visibleOptionalKeys.has('cutoverAt') && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span dir="ltr" className="font-mono">
                                {row.cutoverAt.replace('T', ' ')}
                              </span>
                            </>
                          )}
                          {visibleOptionalKeys.has('region') && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{row.region}</span>
                            </>
                          )}
                        </div>
                        {visibleOptionalKeys.has('status') && (
                          <StatusIndicator status={row.status} />
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop View (md+): Sticky First (ID) + Sticky Last (Actions) Horizontal Scrollable Table */}
          <div
            className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
            data-testid="desktop-data-table"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-start">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    {activeColumns.map((col) => {
                      const isStickyStart = col.sticky === 'start';
                      const isStickyEnd = col.sticky === 'end';
                      const stickyClass = isStickyStart
                        ? 'sticky start-0 z-30 bg-slate-50 dark:bg-slate-900 border-e border-slate-200/90 dark:border-slate-800 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.12)]'
                        : isStickyEnd
                          ? 'sticky end-0 z-30 bg-slate-50 dark:bg-slate-900 border-s border-slate-200/90 dark:border-slate-800 shadow-[-4px_0_8px_-6px_rgba(15,23,42,0.12)]'
                          : '';
                      const isSorted = col.sortable && sortField === col.key;

                      return (
                        <th
                          key={col.key}
                          style={col.widthPx ? { minWidth: col.widthPx } : undefined}
                          className={`px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap ${
                            col.align === 'right' ? 'text-end' : 'text-start'
                          } ${stickyClass}`}
                        >
                          {isStickyStart ? (
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={allPageSelected}
                                onChange={toggleSelectPage}
                                aria-label={t('selectAllOnPage', { count: rows.length })}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 cursor-pointer"
                              />
                              {col.sortable ? (
                                <button
                                  type="button"
                                  onClick={() => handleSort(col.key)}
                                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                >
                                  <span>{col.label}</span>
                                  {isSorted ? (
                                    sortDirection === 'asc' ? (
                                      <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                                    ) : (
                                      <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                                    )
                                  ) : (
                                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>
                              ) : (
                                <span>{col.label}</span>
                              )}
                            </div>
                          ) : col.sortable ? (
                            <button
                              type="button"
                              onClick={() => handleSort(col.key)}
                              className={`inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded ${
                                col.align === 'right' ? 'flex-row-reverse' : ''
                              }`}
                            >
                              <span>{col.label}</span>
                              {isSorted ? (
                                sortDirection === 'asc' ? (
                                  <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                          ) : (
                            col.label
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {rows.map((row) => {
                    const isSelected = selectedIds.includes(row.id);
                    const stickyRowBg = isSelected
                      ? 'bg-[#eff6ff] dark:bg-slate-800'
                      : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800';

                    return (
                      <tr
                        key={row.id}
                        className={`group transition-colors ${
                          isSelected
                            ? 'bg-[#eff6ff] dark:bg-slate-800'
                            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {activeColumns.map((col) => {
                          const isStickyStart = col.sticky === 'start';
                          const isStickyEnd = col.sticky === 'end';
                          const stickyClass = isStickyStart
                            ? `sticky start-0 z-20 ${stickyRowBg} border-e border-slate-200/90 dark:border-slate-800 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.12)]`
                            : isStickyEnd
                              ? `sticky end-0 z-20 ${stickyRowBg} border-s border-slate-200/90 dark:border-slate-800 shadow-[-4px_0_8px_-6px_rgba(15,23,42,0.12)]`
                              : '';

                          return (
                            <td
                              key={col.key}
                              className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-200 ${
                                col.align === 'right' ? 'text-end' : 'text-start'
                              } ${stickyClass}`}
                            >
                              {isStickyEnd && schema ? (
                                <DataGridRowActionsMenu
                                  row={row}
                                  actions={schema.rowActions}
                                  onExecuteAction={(action, r) =>
                                    void executeSingleRowAction(action, r)
                                  }
                                />
                              ) : (
                                renderCellContent(col, row)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Server-Driven Pagination Bar */}
      {pagination.totalItems > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <span>
              {t('showingRange', {
                start: startRange,
                end: endRange,
                total: pagination.totalItems,
              })}
            </span>
            <span aria-hidden="true">·</span>
            <label htmlFor="grid-page-size-select" className="sr-only">
              {t('perPage', { size: pageSize })}
            </label>
            <select
              id="grid-page-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value={5}>{t('perPage', { size: 5 })}</option>
              <option value={6}>{t('perPage', { size: 6 })}</option>
              <option value={10}>{t('perPage', { size: 10 })}</option>
              <option value={20}>{t('perPage', { size: 20 })}</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('previous')}
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                (pNum) => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setPage(pNum)}
                    aria-current={pNum === pagination.page ? 'page' : undefined}
                    className={`min-w-[34px] h-8 px-2 rounded-lg text-xs font-mono tabular-nums cursor-pointer transition-colors ${
                      pNum === pagination.page
                        ? 'bg-slate-900 text-white dark:bg-blue-600'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pNum}
                  </button>
                )
              )}
            </div>

            <span className="sm:hidden px-2 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
              {t('pageOf', {
                page: pagination.page,
                total: pagination.totalPages,
              })}
            </span>

            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}

      {/* Backend-Automated Drawers & Modals */}
      {schema && (
        <>
          <DataGridColumnSettings
            open={columnsOpen}
            onClose={() => setColumnsOpen(false)}
            columns={schema.columns}
            visibleKeys={visibleColumnKeys ?? schema.defaultVisibleColumns}
            defaultVisibleKeys={schema.defaultVisibleColumns}
            onChangeVisibleKeys={handleVisibleColumnsChange}
          />

          <DataGridFilterSheet
            open={filterSheetOpen}
            onClose={() => setFilterSheetOpen(false)}
            schemas={schema.filters}
            value={filters}
            onApply={(next) => {
              setFilters(next);
              setPage(1);
            }}
            onReset={() => {
              setFilters({});
              setSearch('');
              setDebouncedSearch('');
              setPage(1);
            }}
            matchingCount={pagination.allMatchingCount}
          />

          <DataGridBulkModal
            open={bulkModalOpen}
            onClose={() => setBulkModalOpen(false)}
            actions={schema.bulkActions}
            counts={{
              selected: selectedIds.length,
              currentPage: rows.length,
              currentFilter: pagination.allMatchingCount,
              allRows: pagination.totalDatasetCount,
            }}
            initialActionId={bulkInitialAction}
            initialScope={bulkInitialScope}
            onSubmitBulk={(args) => void executeBulkAction(args)}
          />

          <DataGridCrudModal
            open={crudOpen}
            onClose={() => {
              setCrudOpen(false);
              setEditingRow(null);
            }}
            fields={schema.crud.fields}
            editingRow={editingRow}
            submitting={crudSubmitting}
            onSubmit={handleCrudSubmit}
          />

          <DataGridPrintModal
            open={printOpen}
            onClose={() => setPrintOpen(false)}
            endpoint={endpoint}
            columns={printableColumns}
            pageRows={rows}
            selectedIds={selectedIds}
            allMatchingCount={pagination.allMatchingCount}
            search={debouncedSearch}
            filters={filters}
            sortField={sortField}
            sortDirection={sortDirection}
            filterChips={activeFilterChips}
          />
        </>
      )}

      {/* Critical Action Operator Approval Gate */}
      <ConfirmModal
        open={Boolean(pendingApproval)}
        onClose={() => setPendingApproval(null)}
        onConfirm={() => {
          if (pendingApproval) {
            void pendingApproval.onApprove();
          }
        }}
        title={pendingApproval?.title ?? t('gridApprovalTitle')}
        message={pendingApproval?.message ?? ''}
        confirmLabel={pendingApproval?.confirmLabel ?? t('gridApproveBtn')}
        cancelLabel={t('cancel')}
        destructive
      />
    </div>
  );
}
