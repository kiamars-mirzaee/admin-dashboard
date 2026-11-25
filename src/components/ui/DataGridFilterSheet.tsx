import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import type { GridFilterSchema, GridFilterValues } from '../../types/dataGrid';
import { AdaptiveDrawer } from './AdaptiveDrawer';
import { AsyncMultiSelect } from './AsyncMultiSelect';
import { Button } from './Button';
import { DateRangePicker, type DateRangeValue } from './DateRangePicker';
import { DateTimePicker } from './DateTimePicker';
import { MultiSelect } from './MultiSelect';

export interface DataGridFilterSheetProps {
  open: boolean;
  onClose: () => void;
  schemas: GridFilterSchema[];
  value: GridFilterValues;
  onApply: (next: GridFilterValues) => void;
  onReset: () => void;
  matchingCount: number;
}

export function DataGridFilterSheet({
  open,
  onClose,
  schemas,
  value,
  onApply,
  onReset,
  matchingCount,
}: DataGridFilterSheetProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<GridFilterValues>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const setField = (key: string, nextVal: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: nextVal }));
  };

  return (
    <AdaptiveDrawer
      open={open}
      onClose={onClose}
      title={t('advancedFilters')}
      subtitle={t('filterDrawerSubtitle', { count: matchingCount })}
      size="md"
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setDraft({});
              onReset();
              onClose();
            }}
          >
            {t('resetAll')}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                onApply(draft);
                onClose();
              }}
            >
              {t('dtpDone')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {schemas.map((schema) => {
          const current = draft[schema.key];

          if (schema.type === 'number') {
            return (
              <div key={schema.key}>
                <label
                  htmlFor={`grid-filter-${schema.key}`}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  {schema.label}
                </label>
                <input
                  id={`grid-filter-${schema.key}`}
                  type="number"
                  dir="ltr"
                  min={schema.min}
                  step={schema.step ?? 1}
                  value={current !== undefined && current !== null ? String(current) : ''}
                  onChange={(e) => setField(schema.key, e.target.value)}
                  placeholder={schema.placeholder ?? ''}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            );
          }

          if (schema.type === 'comma-numbers') {
            return (
              <div key={schema.key}>
                <label
                  htmlFor={`grid-filter-${schema.key}`}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  {schema.label}
                </label>
                <input
                  id={`grid-filter-${schema.key}`}
                  type="text"
                  dir="ltr"
                  value={typeof current === 'string' ? current : ''}
                  onChange={(e) => setField(schema.key, e.target.value)}
                  placeholder={schema.placeholder ?? '8492, 8490'}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {t('gridCommaHint')}
                </p>
              </div>
            );
          }

          if (schema.type === 'number-range') {
            const rangeVal = (current ?? {}) as { min?: string; max?: string };
            return (
              <div key={schema.key}>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  {schema.label}
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="number"
                    dir="ltr"
                    min={schema.min}
                    step={schema.step ?? 1}
                    aria-label={`${schema.label} ${t('gridRangeMin')}`}
                    placeholder={t('gridRangeMin')}
                    value={rangeVal.min ?? ''}
                    onChange={(e) =>
                      setField(schema.key, { ...rangeVal, min: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="number"
                    dir="ltr"
                    min={schema.min}
                    step={schema.step ?? 1}
                    aria-label={`${schema.label} ${t('gridRangeMax')}`}
                    placeholder={t('gridRangeMax')}
                    value={rangeVal.max ?? ''}
                    onChange={(e) =>
                      setField(schema.key, { ...rangeVal, max: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            );
          }

          if (schema.type === 'date-range') {
            const rangeVal = (current ?? { startDate: '', endDate: '' }) as DateRangeValue;
            return (
              <DateRangePicker
                key={schema.key}
                label={schema.label}
                value={{
                  startDate: rangeVal.startDate ?? '',
                  endDate: rangeVal.endDate ?? '',
                }}
                onChange={(nextRange) => setField(schema.key, nextRange)}
              />
            );
          }

          if (schema.type === 'datetime-range') {
            const dtVal = (current ?? { start: '', end: '' }) as {
              start?: string;
              end?: string;
            };
            return (
              <div key={schema.key} className="space-y-2">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {schema.label}
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <DateTimePicker
                    label={t('dateFrom')}
                    value={dtVal.start ?? ''}
                    onChange={(nextStart) =>
                      setField(schema.key, { ...dtVal, start: nextStart })
                    }
                  />
                  <DateTimePicker
                    label={t('dateTo')}
                    value={dtVal.end ?? ''}
                    onChange={(nextEnd) =>
                      setField(schema.key, { ...dtVal, end: nextEnd })
                    }
                  />
                </div>
              </div>
            );
          }

          if (schema.type === 'multi-select') {
            const arr = Array.isArray(current) ? (current as string[]) : [];
            return (
              <MultiSelect
                key={schema.key}
                label={schema.label}
                options={schema.options ?? []}
                value={arr}
                onChange={(nextArr) => setField(schema.key, nextArr)}
              />
            );
          }

          if (schema.type === 'multi-select-ajax' && schema.ajaxEndpoint) {
            const arr = Array.isArray(current) ? (current as string[]) : [];
            return (
              <AsyncMultiSelect
                key={schema.key}
                label={schema.label}
                placeholder={schema.placeholder}
                ajaxEndpoint={schema.ajaxEndpoint}
                value={arr}
                onChange={(nextArr) => setField(schema.key, nextArr)}
              />
            );
          }

          return null;
        })}
      </div>
    </AdaptiveDrawer>
  );
}
