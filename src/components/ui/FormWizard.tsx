import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { OrderChannel, OrderFormDraft, OrderStatus } from '../../types/admin';
import {
  createEmptyOrderDraft,
  validateOrderWizardStep,
} from '../../utils/adminSuite';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from './Button';
import { ProgressBar } from './Progress';
import { SearchableCombobox, TagInput } from './FormControls';

export interface FormWizardProps {
  initialDraft?: OrderFormDraft;
  onComplete: (draft: OrderFormDraft) => void;
  submitLabel?: string;
}

const CHANNEL_OPTIONS: Array<{ value: OrderChannel; label: string; description: string }> = [
  { value: 'Enterprise', label: 'Enterprise', description: 'Annual contract & SLA' },
  { value: 'Direct', label: 'Direct', description: 'Self-serve card or ACH' },
  { value: 'Partner', label: 'Partner', description: 'Reseller channel order' },
  { value: 'Marketplace', label: 'Marketplace', description: 'Cloud marketplace billing' },
];

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Flagged', label: 'Flagged' },
];

export function FormWizard({
  initialDraft,
  onComplete,
  submitLabel,
}: FormWizardProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [draft, setDraft] = useState<OrderFormDraft>(
    () => initialDraft ?? createEmptyOrderDraft()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 0, title: 'Account & Contact', caption: 'Customer details' },
    { id: 1, title: 'Plan & Settlement', caption: 'Amount & channel' },
    { id: 2, title: 'Review & Tags', caption: 'Verify & submit' },
  ] as const;

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

  const handleNext = () => {
    const stepErrors = validateOrderWizardStep(step, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : s));
  };

  const handleSubmit = () => {
    const e0 = validateOrderWizardStep(0, draft);
    const e1 = validateOrderWizardStep(1, draft);
    const combined = { ...e0, ...e1 };
    if (Object.keys(combined).length > 0) {
      setErrors(combined);
      setStep(Object.keys(e0).length > 0 ? 0 : 1);
      return;
    }
    onComplete(draft);
  };

  return (
    <div
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-5"
      data-testid="form-wizard"
    >
      {/* Stepper Header */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {steps.map((s, idx) => {
            const done = idx < step;
            const active = idx === step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (idx <= step) setStep(idx as 0 | 1 | 2);
                }}
                className={`p-3 rounded-xl border text-start flex items-center gap-3 transition-colors cursor-pointer ${
                  active
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-500'
                    : done
                      ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                    done
                      ? 'bg-emerald-600 text-white'
                      : active
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {s.title}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {s.caption}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <ProgressBar
          value={step + 1}
          max={3}
          label={`Step ${step + 1} of 3`}
          showValue
        />
      </div>

      {/* Step 0: Customer */}
      {step === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="wiz-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t('customerNameLabel')}
            </label>
            <input
              id="wiz-name"
              type="text"
              value={draft.customerName}
              onChange={(e) => updateField('customerName', e.target.value)}
              placeholder="e.g. Arya Rahimi"
              className={`w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                errors.customerName ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            {errors.customerName ? (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">{errors.customerName}</p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Primary billing contact name.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wiz-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t('emailLabel')}
            </label>
            <input
              id="wiz-email"
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

          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="wiz-company" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t('companyLabel')}
            </label>
            <input
              id="wiz-company"
              type="text"
              value={draft.company}
              onChange={(e) => updateField('company', e.target.value)}
              placeholder="e.g. Kestrel Cloud Co."
              className={`w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                errors.company ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            {errors.company && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">{errors.company}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Plan & Settlement */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="wiz-plan" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t('planItemLabel')}
            </label>
            <input
              id="wiz-plan"
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

          <SearchableCombobox
            label={t('channelLabel')}
            options={CHANNEL_OPTIONS}
            value={draft.channel}
            onChange={(val) => updateField('channel', val as OrderChannel)}
          />

          <SearchableCombobox
            label={t('colStatus')}
            options={STATUS_OPTIONS}
            value={draft.status}
            onChange={(val) => updateField('status', val as OrderStatus)}
          />

          <div className="space-y-1.5">
            <label htmlFor="wiz-amount" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t('amountLabel')}
            </label>
            <input
              id="wiz-amount"
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

          <div className="space-y-1.5">
            <label htmlFor="wiz-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t('orderDateLabel')}
            </label>
            <input
              id="wiz-date"
              type="date"
              dir="ltr"
              value={draft.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      )}

      {/* Step 2: Review & Tags */}
      {step === 2 && (
        <div className="space-y-4">
          <TagInput
            label="Compliance & routing tags"
            tags={draft.tags}
            onChange={(next) => updateField('tags', next)}
            helperText="Press Enter or comma to append tags."
          />

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">{t('colCustomer')}</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {draft.customerName} ({draft.company})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">{t('planItemLabel')}</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {draft.planOrItem}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">{t('channelLabel')}</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {draft.channel} · {draft.status}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">{t('colAmount')}</span>
              <span dir="ltr" className="font-mono font-bold text-slate-900 dark:text-white">
                ${Number(draft.amount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button
          variant="secondary"
          size="md"
          disabled={step === 0}
          leftIcon={<ChevronLeft className="w-4 h-4 rtl:rotate-180" />}
          onClick={() => setStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2) : s))}
        >
          {t('previous')}
        </Button>

        {step < 2 ? (
          <Button
            variant="primary"
            size="md"
            rightIcon={<ChevronRight className="w-4 h-4 rtl:rotate-180" />}
            onClick={handleNext}
            data-testid="wizard-next-btn"
          >
            {t('next')}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            leftIcon={<Check className="w-4 h-4" />}
            onClick={handleSubmit}
            data-testid="wizard-submit-btn"
          >
            {submitLabel ?? t('createNewOrder')}
          </Button>
        )}
      </div>
    </div>
  );
}
