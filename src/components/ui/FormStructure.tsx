import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { Input, NativeSelect, Textarea } from './ExtendedInputs';
import { SwitchToggle } from './FormControls';

export { FormFieldShell as FormField } from './ExtendedInputs';

/* FormSection / FieldSet */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <legend className="text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </legend>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

/* FormActions (with optional Sticky save bar) */
export function FormActions({
  primaryLabel = 'Save changes',
  cancelLabel = 'Cancel',
  onPrimary,
  onCancel,
  loading = false,
  sticky = false,
  leftNote,
}: {
  primaryLabel?: string;
  cancelLabel?: string;
  onPrimary?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  sticky?: boolean;
  leftNote?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md ${
        sticky ? 'sticky bottom-16 lg:bottom-4 z-20 shadow-lg' : ''
      }`}
    >
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {leftNote ?? ''}
      </span>
      <div className="flex items-center gap-2 ms-auto">
        {onCancel && (
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button
          type={onPrimary ? 'button' : 'submit'}
          variant="primary"
          size="sm"
          loading={loading}
          onClick={onPrimary}
        >
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}

/* Repeater / FieldArray */
export interface RepeaterLineItem {
  id: string;
  label: string;
  qty: string;
  unitPrice: string;
}

export function Repeater({
  label,
  items,
  onChange,
}: {
  label: string;
  items: RepeaterLineItem[];
  onChange: (next: RepeaterLineItem[]) => void;
}) {
  const addRow = () => {
    onChange([
      ...items,
      { id: `row-${Date.now()}`, label: '', qty: '1', unitPrice: '250' },
    ]);
  };

  const updateRow = (id: string, patch: Partial<RepeaterLineItem>) => {
    onChange(items.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    if (items.length <= 1) return;
    onChange(items.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </span>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={addRow}
        >
          Add line
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="grid grid-cols-1 sm:grid-cols-[1fr_84px_110px_40px] gap-2 items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
          >
            <input
              type="text"
              aria-label={`Line ${idx + 1} description`}
              value={item.label}
              onChange={(e) => updateRow(item.id, { label: e.target.value })}
              placeholder="SKU or service item..."
              className="min-h-[38px] px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="number"
              dir="ltr"
              min={1}
              aria-label={`Line ${idx + 1} quantity`}
              value={item.qty}
              onChange={(e) => updateRow(item.id, { qty: e.target.value })}
              className="min-h-[38px] px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white"
            />
            <input
              type="number"
              dir="ltr"
              min={0}
              aria-label={`Line ${idx + 1} price`}
              value={item.unitPrice}
              onChange={(e) => updateRow(item.id, { unitPrice: e.target.value })}
              className="min-h-[38px] px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white"
            />
            <button
              type="button"
              disabled={items.length <= 1}
              onClick={() => removeRow(item.id)}
              aria-label={`Remove line ${idx + 1}`}
              className="min-h-[38px] min-w-[38px] rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Schema-Driven FormBuilder */
export interface FormSchemaField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'textarea' | 'switch';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string | boolean;
}

export function FormBuilder({
  schema,
  submitLabel = 'Submit schema form',
  onSubmit,
}: {
  schema: FormSchemaField[];
  submitLabel?: string;
  onSubmit: (values: Record<string, string | boolean>) => void;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const init: Record<string, string | boolean> = {};
    schema.forEach((f) => {
      init[f.name] = f.defaultValue ?? (f.type === 'switch' ? false : '');
    });
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    schema.forEach((f) => {
      const val = values[f.name];
      if (f.required && (val === '' || val === undefined)) {
        nextErrors[f.name] = `${f.label} is required`;
      } else if (f.type === 'email' && typeof val === 'string' && val && !val.includes('@')) {
        nextErrors[f.name] = 'Enter a valid email address';
      }
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {schema.map((field) => {
          const val = values[field.name];
          const setVal = (next: string | boolean) =>
            setValues((prev) => ({ ...prev, [field.name]: next }));

          if (field.type === 'select') {
            return (
              <NativeSelect
                key={field.name}
                label={field.label}
                value={String(val ?? '')}
                onChange={setVal}
                options={field.options ?? []}
              />
            );
          }
          if (field.type === 'textarea') {
            return (
              <div key={field.name} className="sm:col-span-2">
                <Textarea
                  label={field.label}
                  value={String(val ?? '')}
                  onChange={setVal}
                  placeholder={field.placeholder}
                  error={errors[field.name]}
                />
              </div>
            );
          }
          if (field.type === 'switch') {
            return (
              <div key={field.name} className="sm:col-span-2">
                <SwitchToggle
                  label={field.label}
                  checked={Boolean(val)}
                  onChange={setVal}
                />
              </div>
            );
          }
          return (
            <Input
              key={field.name}
              label={field.label}
              type={field.type === 'email' ? 'email' : 'text'}
              value={String(val ?? '')}
              onChange={setVal}
              required={field.required}
              placeholder={field.placeholder}
              error={errors[field.name]}
            />
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="sm">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
