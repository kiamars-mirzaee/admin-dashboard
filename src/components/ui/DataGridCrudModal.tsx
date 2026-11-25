import React, { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import type { GridCrudFieldSchema, GridOrderRow } from '../../types/dataGrid';
import { Button } from './Button';
import { DatePicker } from './DatePicker';
import { DateTimePicker } from './DateTimePicker';
import { Modal } from './Modal';

export interface DataGridCrudModalProps {
  open: boolean;
  onClose: () => void;
  fields: GridCrudFieldSchema[];
  editingRow: GridOrderRow | null;
  submitting?: boolean;
  onSubmit: (payload: Record<string, unknown>) => Promise<void> | void;
}

export function DataGridCrudModal({
  open,
  onClose,
  fields,
  editingRow,
  submitting = false,
  onSubmit,
}: DataGridCrudModalProps) {
  const { t } = useI18n();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};
    for (const f of fields) {
      if (editingRow) {
        const raw = (editingRow as unknown as Record<string, unknown>)[f.key];
        initial[f.key] = raw !== undefined && raw !== null ? String(raw) : '';
      } else if (f.type === 'select' && f.options?.[0]) {
        initial[f.key] = f.options[0].value;
      } else if (f.key === 'date') {
        initial[f.key] = '2026-11-23';
      } else if (f.key === 'cutoverAt') {
        initial[f.key] = '2026-11-23T14:30';
      } else if (f.key === 'seatsCount') {
        initial[f.key] = '5';
      } else if (f.key === 'amount') {
        initial[f.key] = '1500';
      } else {
        initial[f.key] = '';
      }
    }
    setValues(initial);
    setErrors({});
  }, [open, editingRow, fields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const f of fields) {
      const val = (values[f.key] ?? '').trim();
      if (f.required && !val) {
        nextErrors[f.key] = `${f.label} is required`;
      } else if (f.type === 'email' && val && !val.includes('@')) {
        nextErrors[f.key] = 'Enter a valid email address';
      } else if (f.type === 'number' && val) {
        const n = Number(val);
        if (!Number.isFinite(n) || (f.min !== undefined && n < f.min)) {
          nextErrors[f.key] = `${f.label} must be >= ${f.min ?? 0}`;
        }
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      payload[f.key] =
        f.type === 'number' ? Number(values[f.key] ?? 0) : (values[f.key] ?? '').trim();
    }
    await onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        editingRow
          ? t('gridEditRecord', { id: editingRow.id })
          : t('gridCreateRecord')
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="grid-crud-form"
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {editingRow ? t('gridSaveRecord') : t('gridCreateRecord')}
          </Button>
        </>
      }
    >
      <form id="grid-crud-form" onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {fields.map((field) => {
            const val = values[field.key] ?? '';
            const err = errors[field.key];
            const isFullWidth = field.type === 'textarea';

            if (field.type === 'date') {
              return (
                <div key={field.key}>
                  <DatePicker
                    label={field.label}
                    value={val}
                    onChange={(nextDate) =>
                      setValues((prev) => ({ ...prev, [field.key]: nextDate }))
                    }
                  />
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </div>
              );
            }

            if (field.type === 'datetime') {
              return (
                <div key={field.key}>
                  <DateTimePicker
                    label={field.label}
                    value={val}
                    onChange={(nextDt) =>
                      setValues((prev) => ({ ...prev, [field.key]: nextDt }))
                    }
                  />
                  {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                </div>
              );
            }

            return (
              <div key={field.key} className={isFullWidth ? 'sm:col-span-2' : ''}>
                <label
                  htmlFor={`crud-${field.key}`}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ms-1">*</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    id={`crud-${field.key}`}
                    value={val}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {(field.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={`crud-${field.key}`}
                    rows={2}
                    value={val}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                ) : (
                  <input
                    id={`crud-${field.key}`}
                    type={field.type}
                    dir={field.type === 'number' || field.type === 'email' ? 'ltr' : undefined}
                    min={field.min}
                    step={field.step}
                    value={val}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                )}
                {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
              </div>
            );
          })}
        </div>
      </form>
    </Modal>
  );
}
