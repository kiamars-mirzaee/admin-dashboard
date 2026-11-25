import { useEffect, useState } from 'react';
import { FileDown, Loader2, Printer } from 'lucide-react';
import type { SortDirection } from '../../types/admin';
import type {
  GridColumnSchema,
  GridFilterValues,
  GridOrderRow,
  GridSchemaResponse,
} from '../../types/dataGrid';
import { useI18n } from '../../i18n/I18nContext';
import { exportDataGridToPdf } from '../../services/pdfExportService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useNotifications } from '../ui/NotificationSystem';
import { SegmentedControl } from '../ui/SegmentedControl';
import { DataGridPrintSheet } from './DataGridPrintSheet';
import { PrintPortal } from './PrintPortal';

export type GridPrintScope = 'page' | 'matching' | 'selected';

export interface DataGridPrintModalProps {
  open: boolean;
  onClose: () => void;
  endpoint: string;
  columns: GridColumnSchema[];
  pageRows: GridOrderRow[];
  selectedIds: string[];
  allMatchingCount: number;
  search: string;
  filters: GridFilterValues;
  sortField: string;
  sortDirection: SortDirection;
  filterChips: Array<{ key: string; label: string }>;
}

export function DataGridPrintModal({
  open,
  onClose,
  endpoint,
  columns,
  pageRows,
  selectedIds,
  allMatchingCount,
  search,
  filters,
  sortField,
  sortDirection,
  filterChips,
}: DataGridPrintModalProps) {
  const { t, tStatus, tChannel, dir } = useI18n();
  const { addToast } = useNotifications();
  const [scope, setScope] = useState<GridPrintScope>(
    selectedIds.length > 0 ? 'selected' : 'page'
  );
  const [allMatchingRows, setAllMatchingRows] = useState<GridOrderRow[] | null>(
    null
  );
  const [loadingMatching, setLoadingMatching] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (!open) {
      setAllMatchingRows(null);
      return;
    }
    setScope(selectedIds.length > 0 ? 'selected' : 'page');
  }, [open, selectedIds.length]);

  useEffect(() => {
    if (!open) return;
    if (scope !== 'matching' && scope !== 'selected') return;
    if (allMatchingRows !== null) return;

    let cancelled = false;
    setLoadingMatching(true);

    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('pageSize', String(Math.max(200, allMatchingCount || 50)));
    params.set('sortField', sortField);
    params.set('sortDirection', sortDirection);
    if (search.trim()) params.set('search', search.trim());
    if (Object.keys(filters).length > 0) {
      params.set('filters', JSON.stringify(filters));
    }

    const sep = endpoint.includes('?') ? '&' : '?';
    void fetch(`${endpoint}${sep}${params.toString()}`)
      .then((r) => r.json())
      .then((data: GridSchemaResponse) => {
        if (!cancelled && Array.isArray(data.rows)) {
          setAllMatchingRows(data.rows);
        }
      })
      .catch(() => {
        if (!cancelled) setAllMatchingRows(pageRows);
      })
      .finally(() => {
        if (!cancelled) setLoadingMatching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    scope,
    allMatchingRows,
    allMatchingCount,
    endpoint,
    sortField,
    sortDirection,
    search,
    filters,
    pageRows,
  ]);

  const resolvedRows = (() => {
    if (scope === 'matching') {
      return allMatchingRows ?? pageRows;
    }
    if (scope === 'selected') {
      const idSet = new Set(selectedIds);
      const source = allMatchingRows ?? pageRows;
      const matched = source.filter((r) => idSet.has(r.id));
      return matched.length > 0 ? matched : pageRows.filter((r) => idSet.has(r.id));
    }
    return pageRows;
  })();

  const scopeLabel =
    scope === 'selected'
      ? t('printScopeSelected', { count: selectedIds.length })
      : scope === 'matching'
        ? t('printScopeMatching', { count: allMatchingCount })
        : t('printScopePage', { count: pageRows.length });

  const scopeOptions: Array<{ value: GridPrintScope; label: string }> = [
    ...(selectedIds.length > 0
      ? [
          {
            value: 'selected' as const,
            label: t('printScopeSelected', { count: selectedIds.length }),
          },
        ]
      : []),
    {
      value: 'page',
      label: t('printScopePage', { count: pageRows.length }),
    },
    {
      value: 'matching',
      label: t('printScopeMatching', { count: allMatchingCount }),
    },
  ];

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      const res = await exportDataGridToPdf(
        {
          rows: resolvedRows,
          columns,
          filterChips,
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
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`${t('printViewTitle')} · ${t('printGridDocTitle')}`}
        description={t('printPaperHint')}
        size="2xl"
        footer={
          <div className="w-full flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('printPaperHint')}
            </span>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
              <Button variant="secondary" size="md" onClick={onClose}>
                {t('close')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={
                  exportingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )
                }
                disabled={loadingMatching || resolvedRows.length === 0 || exportingPdf}
                onClick={() => void handleDownloadPdf()}
                data-testid="modal-grid-download-pdf-btn"
              >
                {exportingPdf ? t('pdfExporting') : t('pdfExportBtn')}
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Printer className="w-4 h-4" />}
                disabled={loadingMatching || resolvedRows.length === 0}
                onClick={() => window.print()}
                data-testid="confirm-print-grid-btn"
              >
                {t('printSavePdfBtn')}
              </Button>
            </div>
          </div>
        }
      >
        {/* Print Scope Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <SegmentedControl
            ariaLabel={t('gridScopeLabel')}
            value={scope}
            onChange={setScope}
            options={scopeOptions}
          />
          {loadingMatching && (
            <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>{t('printLoadingRows')}</span>
            </div>
          )}
        </div>

        {/* Paper Desk Preview */}
        <div className="bg-slate-100 dark:bg-slate-950 p-3 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <DataGridPrintSheet
            rows={resolvedRows}
            columns={columns}
            filterChips={filterChips}
            scopeLabel={scopeLabel}
          />
        </div>
      </Modal>

      <PrintPortal active={open}>
        <DataGridPrintSheet
          rows={resolvedRows}
          columns={columns}
          filterChips={filterChips}
          scopeLabel={scopeLabel}
        />
      </PrintPortal>
    </>
  );
}
