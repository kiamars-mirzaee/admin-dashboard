import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw, Save } from 'lucide-react';
import type {
  OrderChannel,
  OrderFormDraft,
  OrderRecord,
  OrderStatus,
} from '../../types/admin';
import {
  createEmptyOrderDraft,
  draftFromOrder,
  hasUnsavedOrderChanges,
  validateOrderWizardStep,
} from '../../utils/adminSuite';
import { useI18n } from '../../i18n/I18nContext';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import {
  MarkdownEditor,
  SearchableCombobox,
  TagInput,
} from '../ui/FormControls';
import { FormWizard } from '../ui/FormWizard';
import { SegmentedControl } from '../ui/SegmentedControl';

const DRAFT_STORAGE_KEY = 'kestrel_order_page_draft_v1';

export interface OrderFormPageViewProps {
  orders: OrderRecord[];
  editingOrderId?: string | null;
  onDirtyChange: (dirty: boolean) => void;
  onBackToOrders: () => void;
  onCreateOrder: (payload: Omit<OrderRecord, 'id'>) => Promise<void>;
  onUpdateOrder: (
    id: string,
    updates: Partial<OrderRecord>
  ) => Promise<void> | void;
}

export function OrderFormPageView({
  orders,
  editingOrderId,
  onDirtyChange,
  onBackToOrders,
  onCreateOrder,
  onUpdateOrder,
}: OrderFormPageViewProps) {
  const { t, tStatus, tChannel } = useI18n();
  const [selectedEditId, setSelectedEditId] = useState<string>(
    editingOrderId ?? ''
  );
  const [mode, setMode] = useState<'full' | 'wizard'>('full');

  const editingTarget = useMemo(
    () => orders.find((o) => o.id === selectedEditId) ?? null,
    [orders, selectedEditId]
  );

  const baseline = useMemo(
    () =>
      editingTarget
        ? draftFromOrder(editingTarget)
        : createEmptyOrderDraft(),
    [editingTarget]
  );

  const [draft, setDraft] = useState<OrderFormDraft>(baseline);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);
  const [hasSavedDraftBanner, setHasSavedDraftBanner] = useState(false);

  useEffect(() => {
    setDraft(baseline);
    setErrors({});
  }, [baseline]);

  useEffect(() => {
    if (editingOrderId) setSelectedEditId(editingOrderId);
  }, [editingOrderId]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw && !selectedEditId) {
        setHasSavedDraftBanner(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [selectedEditId]);

  const isDirty = useMemo(
    () => hasUnsavedOrderChanges(draft, baseline),
    [draft, baseline]
  );

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  // Auto-save dirty draft every 800ms after edits
  useEffect(() => {
    if (!isDirty || selectedEditId) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        setAutoSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch {
        // ignore storage quota
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draft, isDirty, selectedEditId]);

  const updateField = <K extends keyof OrderFormDraft>(
    key: K,
    value: OrderFormDraft[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const submitDraft = async (source: OrderFormDraft) => {
    const e0 = validateOrderWizardStep(0, source);
    const e1 = validateOrderWizardStep(1, source);
    const combined = { ...e0, ...e1 };
    if (Object.keys(combined).length > 0) {
      setErrors(combined);
      return;
    }

    const payload: Omit<OrderRecord, 'id'> = {
      customerName: source.customerName.trim(),
      customerEmail: source.customerEmail.trim(),
      company: source.company.trim(),
      planOrItem: source.planOrItem.trim(),
      channel: source.channel,
      status: source.status,
      amount: Number(source.amount),
      date: source.date,
      region: source.region.trim() || 'Global',
      paymentMethod: source.paymentMethod.trim() || 'Invoice Net-30',
      notes: source.notes.trim() || undefined,
    };

    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    onDirtyChange(false);

    if (editingTarget) {
      await onUpdateOrder(editingTarget.id, payload);
      onBackToOrders();
    } else {
      await onCreateOrder(payload);
    }
  };

  return (
    <div className="space-y-5" data-testid="order-form-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-180" />}
            onClick={onBackToOrders}
          >
            {t('orderPageBack')}
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t('orderFormPageTitle')}
              </h2>
              {isDirty && (
                <span
                  data-testid="unsaved-changes-badge"
                  className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-[11px] font-semibold text-amber-700 dark:text-amber-300"
                >
                  {t('orderFormUnsavedBadge')}
                </span>
              )}
              {autoSavedAt && (
                <span
                  data-testid="autosave-badge"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {t('orderFormDraftSaved')} ({autoSavedAt})
                  </span>
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t('orderFormPageSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Choose mode: New or Edit existing order"
            value={selectedEditId}
            onChange={(e) => setSelectedEditId(e.target.value)}
            className="min-h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="">+ {t('newOrder')}</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                Edit {o.id} — {o.company}
              </option>
            ))}
          </select>

          <SegmentedControl
            ariaLabel="Form layout mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'full', label: 'Full Form' },
              { value: 'wizard', label: 'Wizard / Stepper' },
            ]}
          />
        </div>
      </div>

      {hasSavedDraftBanner && !selectedEditId && (
        <Alert
          variant="info"
          title={t('orderFormDraftSaved')}
          description="A local draft from an earlier edit session is available."
          actionLabel="Restore saved draft"
          onAction={() => {
            try {
              const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
              if (raw) {
                setDraft(JSON.parse(raw) as OrderFormDraft);
              }
            } catch {
              // ignore
            }
            setHasSavedDraftBanner(false);
          }}
          onDismiss={() => {
            try {
              window.localStorage.removeItem(DRAFT_STORAGE_KEY);
            } catch {
              // ignore
            }
            setHasSavedDraftBanner(false);
          }}
        />
      )}

      {mode === 'wizard' ? (
        <FormWizard
          initialDraft={draft}
          submitLabel={editingTarget ? t('saveChanges') : t('createNewOrder')}
          onComplete={(completed) => void submitDraft(completed)}
        />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitDraft(draft);
          }}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="page-form-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('customerNameLabel')}
              </label>
              <input
                id="page-form-name"
                type="text"
                value={draft.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                placeholder="e.g. Arya Rahimi"
                className={`w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.customerName ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              />
              {errors.customerName && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">{errors.customerName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="page-form-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('emailLabel')}
              </label>
              <input
                id="page-form-email"
                type="email"
                dir="ltr"
                value={draft.customerEmail}
                onChange={(e) => updateField('customerEmail', e.target.value)}
                placeholder="arya@company.com"
                className={`w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.customerEmail ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              />
              {errors.customerEmail && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">{errors.customerEmail}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="page-form-company" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('companyLabel')}
              </label>
              <input
                id="page-form-company"
                type="text"
                value={draft.company}
                onChange={(e) => updateField('company', e.target.value)}
                placeholder="Northstar Labs"
                className={`w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.company ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              />
              {errors.company && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">{errors.company}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="page-form-plan" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('planItemLabel')}
              </label>
              <input
                id="page-form-plan"
                type="text"
                value={draft.planOrItem}
                onChange={(e) => updateField('planOrItem', e.target.value)}
                placeholder="Enterprise Cluster (Annual)"
                className={`w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.planOrItem ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              />
              {errors.planOrItem && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">{errors.planOrItem}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="page-form-amount" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('amountLabel')}
              </label>
              <input
                id="page-form-amount"
                type="number"
                dir="ltr"
                value={draft.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                className={`w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.amount ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              />
              {errors.amount && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">{errors.amount}</p>
              )}
            </div>

            <SearchableCombobox
              label={t('channelLabel')}
              value={draft.channel}
              onChange={(v) => updateField('channel', v as OrderChannel)}
              options={[
                { value: 'Enterprise', label: tChannel('Enterprise') },
                { value: 'Direct', label: tChannel('Direct') },
                { value: 'Partner', label: tChannel('Partner') },
                { value: 'Marketplace', label: tChannel('Marketplace') },
              ]}
            />

            <SearchableCombobox
              label={t('colStatus')}
              value={draft.status}
              onChange={(v) => updateField('status', v as OrderStatus)}
              options={[
                { value: 'Pending', label: tStatus('Pending') },
                { value: 'Processing', label: tStatus('Processing') },
                { value: 'Completed', label: tStatus('Completed') },
                { value: 'Flagged', label: tStatus('Flagged') },
              ]}
            />

            <div className="space-y-1.5">
              <label htmlFor="page-form-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('orderDateLabel')}
              </label>
              <input
                id="page-form-date"
                type="date"
                dir="ltr"
                value={draft.date}
                onChange={(e) => updateField('date', e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <TagInput
            label="Order metadata tags"
            tags={draft.tags}
            onChange={(tags) => updateField('tags', tags)}
            helperText="Tags are auto-saved with your draft."
          />

          <MarkdownEditor
            label={t('opsNotesLabel')}
            value={draft.notes}
            onChange={(val) => updateField('notes', val)}
            helperText="Supports headings (#), lists (-), and quotes (>)."
          />

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              disabled={!isDirty}
              onClick={() => {
                setDraft(baseline);
                setErrors({});
              }}
            >
              {t('settingsResetBtn')}
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Save className="w-4 h-4" />}
              data-testid="order-form-submit-btn"
            >
              {editingTarget ? t('saveChanges') : t('createNewOrder')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
