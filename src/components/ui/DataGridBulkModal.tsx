import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, Layers, Play } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { GridBulkActionSchema, GridBulkScope } from '../../types/dataGrid';
import { AdaptiveDrawer } from './AdaptiveDrawer';
import { Button } from './Button';

export interface DataGridBulkModalProps {
  open: boolean;
  onClose: () => void;
  actions: GridBulkActionSchema[];
  counts: {
    selected: number;
    currentPage: number;
    currentFilter: number;
    allRows: number;
  };
  initialActionId?: string;
  initialScope?: GridBulkScope;
  onSubmitBulk: (args: {
    action: GridBulkActionSchema;
    scope: GridBulkScope;
    targetCount: number;
    payload: Record<string, string>;
  }) => void;
}

export function DataGridBulkModal(props: DataGridBulkModalProps) {
  if (!props.open) return null;
  return <DataGridBulkModalContent {...props} />;
}

function DataGridBulkModalContent({
  open,
  onClose,
  actions,
  counts,
  initialActionId,
  initialScope,
  onSubmitBulk,
}: DataGridBulkModalProps) {
  const { t } = useI18n();

  const defaultScope: GridBulkScope =
    initialScope ?? (counts.selected > 0 ? 'selected' : 'current-filter');
  const firstAction =
    actions.find((a) => a.id === initialActionId) ?? actions[0];

  const [scope, setScope] = useState<GridBulkScope>(defaultScope);
  const [actionId, setActionId] = useState<string>(
    firstAction?.id ?? 'export-csv'
  );
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const field of firstAction?.formFields ?? []) {
      if (field.type === 'select' && field.options?.[0]) {
        defaults[field.key] = field.options[0].value;
      } else {
        defaults[field.key] = '';
      }
    }
    return defaults;
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setScope(initialScope ?? (counts.selected > 0 ? 'selected' : 'current-filter'));
    const nextAction =
      actions.find((a) => a.id === initialActionId) ?? actions[0];
    if (nextAction) {
      setActionId(nextAction.id);
      const defaults: Record<string, string> = {};
      for (const field of nextAction.formFields ?? []) {
        if (field.type === 'select' && field.options?.[0]) {
          defaults[field.key] = field.options[0].value;
        } else {
          defaults[field.key] = '';
        }
      }
      setFormValues(defaults);
    }
    setErrorMsg(null);
  }, [initialActionId, initialScope, counts.selected, actions]);

  const selectedAction = useMemo(
    () => actions.find((a) => a.id === actionId) ?? actions[0],
    [actions, actionId]
  );

  const handleActionSelect = (next: GridBulkActionSchema) => {
    setActionId(next.id);
    setErrorMsg(null);
    const defaults: Record<string, string> = {};
    for (const field of next.formFields ?? []) {
      if (field.type === 'select' && field.options?.[0]) {
        defaults[field.key] = field.options[0].value;
      } else {
        defaults[field.key] = '';
      }
    }
    setFormValues(defaults);
    if (!next.supportedScopes.includes(scope)) {
      setScope(next.supportedScopes.includes('current-filter') ? 'current-filter' : next.supportedScopes[0]);
    }
  };

  const scopeOptions: {
    id: GridBulkScope;
    label: string;
    count: number;
  }[] = [
    {
      id: 'selected',
      label: t('gridScopeSelected', { count: counts.selected }),
      count: counts.selected,
    },
    {
      id: 'current-page',
      label: t('gridScopePage', { count: counts.currentPage }),
      count: counts.currentPage,
    },
    {
      id: 'current-filter',
      label: t('gridScopeFilter', { count: counts.currentFilter }),
      count: counts.currentFilter,
    },
    {
      id: 'all-rows',
      label: t('gridScopeAll', { count: counts.allRows }),
      count: counts.allRows,
    },
  ];

  const activeTargetCount =
    scopeOptions.find((s) => s.id === scope)?.count ?? 0;

  const handleSubmit = () => {
    if (!selectedAction) return;
    if (activeTargetCount <= 0) {
      setErrorMsg('Target scope has 0 matching rows.');
      return;
    }
    for (const field of selectedAction.formFields ?? []) {
      if (field.required && !(formValues[field.key] ?? '').trim()) {
        setErrorMsg(`${field.label} is required.`);
        return;
      }
    }
    onSubmitBulk({
      action: selectedAction,
      scope,
      targetCount: activeTargetCount,
      payload: formValues,
    });
    onClose();
  };

  if (!selectedAction) return null;

  return (
    <AdaptiveDrawer
      open={open}
      onClose={onClose}
      title={t('gridBulkTitle')}
      subtitle={t('gridBulkSubtitle')}
      size="md"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" size="md" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant={selectedAction.critical ? 'danger' : 'primary'}
            size="md"
            leftIcon={
              selectedAction.kind === 'export' ? (
                <Download className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )
            }
            disabled={activeTargetCount <= 0}
            onClick={handleSubmit}
          >
            {selectedAction.critical ? t('gridApproveBtn') : t('gridBulkExecuteBtn')} ({activeTargetCount})
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Step 1: Target Row Scope */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {t('gridScopeLabel')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {scopeOptions.map((opt) => {
              const supported = selectedAction.supportedScopes.includes(opt.id);
              const disabled = !supported || opt.count === 0;
              const active = scope === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setScope(opt.id)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl border text-start flex items-center justify-between gap-2 ${
                    disabled
                      ? 'opacity-45 cursor-not-allowed bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                      : active
                        ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-600 text-slate-900 dark:text-white cursor-pointer'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
                  }`}
                >
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      active
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Action Selection */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {t('gridBulkActionLabel')}
          </span>
          <div className="space-y-1.5">
            {actions.map((act) => {
              const active = act.id === selectedAction.id;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => handleActionSelect(act)}
                  className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-start flex items-start justify-between gap-3 cursor-pointer ${
                    active
                      ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-600 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <Layers
                        className={`w-4 h-4 shrink-0 ${
                          active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{act.label}</span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 ${
                        active
                          ? 'text-slate-600 dark:text-slate-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {act.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {act.critical && (
                      <AlertTriangle
                        className="w-3.5 h-3.5 text-red-600 dark:text-red-400"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        active
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Action-Specific Form Fields */}
        {selectedAction.formFields && selectedAction.formFields.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            {selectedAction.formFields.map((field) => (
              <div key={field.key}>
                <label
                  htmlFor={`bulk-field-${field.key}`}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ms-1">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    id={`bulk-field-${field.key}`}
                    value={formValues[field.key] ?? ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {(field.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`bulk-field-${field.key}`}
                    type="text"
                    value={formValues[field.key] ?? ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder ?? ''}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {selectedAction.critical && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{t('gridApprovalBadge')}</span>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            {errorMsg}
          </p>
        )}
      </div>
    </AdaptiveDrawer>
  );
}
