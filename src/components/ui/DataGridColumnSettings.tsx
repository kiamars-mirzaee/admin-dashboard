import { Lock, RotateCcw } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { GridColumnSchema } from '../../types/dataGrid';
import { AdaptiveDrawer } from './AdaptiveDrawer';
import { Button } from './Button';

export interface DataGridColumnSettingsProps {
  open: boolean;
  onClose: () => void;
  columns: GridColumnSchema[];
  visibleKeys: string[];
  defaultVisibleKeys: string[];
  onChangeVisibleKeys: (keys: string[]) => void;
}

export function DataGridColumnSettings({
  open,
  onClose,
  columns,
  visibleKeys,
  defaultVisibleKeys,
  onChangeVisibleKeys,
}: DataGridColumnSettingsProps) {
  const { t } = useI18n();

  const toggleColumn = (key: string, locked?: boolean) => {
    if (locked) return;
    if (visibleKeys.includes(key)) {
      onChangeVisibleKeys(visibleKeys.filter((k) => k !== key));
    } else {
      onChangeVisibleKeys([...visibleKeys, key]);
    }
  };

  const showAll = () => {
    onChangeVisibleKeys(columns.map((c) => c.key));
  };

  const resetDefaults = () => {
    onChangeVisibleKeys(defaultVisibleKeys);
  };

  return (
    <AdaptiveDrawer
      open={open}
      onClose={onClose}
      title={t('gridColumnsTitle')}
      subtitle={t('gridColumnsDesc')}
      size="sm"
      footer={
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={showAll}>
              {t('gridShowAllCols')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={resetDefaults}
            >
              {t('gridResetCols')}
            </Button>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            {t('dtpDone')}
          </Button>
        </div>
      }
    >
      <div className="space-y-1.5">
        {columns.map((col) => {
          const checked = col.locked || visibleKeys.includes(col.key);
          return (
            <label
              key={col.key}
              className={`min-h-[44px] px-3 py-2 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                col.locked
                  ? 'bg-slate-50 dark:bg-slate-950 border-slate-200/70 dark:border-slate-800/80 opacity-85 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={col.locked}
                  onChange={() => toggleColumn(col.key, col.locked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {col.label}
                </span>
              </span>

              {(col.sticky === 'start' || col.sticky === 'end' || col.locked) && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                  <Lock className="w-3 h-3" aria-hidden="true" />
                  <span>
                    {col.sticky === 'start'
                      ? t('gridPinnedStart')
                      : col.sticky === 'end'
                        ? t('gridPinnedEnd')
                        : 'Pinned'}
                  </span>
                </span>
              )}
            </label>
          );
        })}
      </div>
    </AdaptiveDrawer>
  );
}
