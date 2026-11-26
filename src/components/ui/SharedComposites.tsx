import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  Pencil,
  ShieldAlert,
  Sparkles,
  Upload,
} from 'lucide-react';
import type {
  PermissionAction,
  PermissionMatrixState,
  PermissionResource,
  RoleId,
} from '../../types/admin';
import { ADMIN_PROFILE } from '../../data/seedData';
import { createInitialPermissionMatrix } from '../../utils/adminSuite';
import {
  parseCsvForImport,
  validateImportedRows,
  type ImportValidationResult,
} from '../../utils/formatters';
import { useClipboard } from '../../hooks/index';
import { Button } from './Button';
import { Modal } from './Modal';
import { TypedConfirmDialog } from './OverlayExtras';
import { Stepper } from './LayoutPrimitives';

// ─── 1. CopyButton ─────────────────────────────────────────────────────────────

export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  size = 'sm',
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  size?: 'sm' | 'md';
}) {
  const { copied, copy } = useClipboard(1600);
  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      onClick={() => void copy(value)}
      leftIcon={
        copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
        ) : (
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
        )
      }
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}

// ─── 2. InlineEdit ─────────────────────────────────────────────────────────────

export function InlineEdit({
  value,
  onSave,
  placeholder = 'Click to edit...',
  ariaLabel = 'Inline editable text',
}: {
  value: string;
  onSave: (nextValue: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onSave(trimmed);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        type="text"
        aria-label={ariaLabel}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="min-h-[34px] px-2.5 rounded-lg bg-white dark:bg-slate-950 border border-blue-500 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white cursor-pointer transition-colors"
    >
      <span>{value || placeholder}</span>
      <Pencil
        className="w-3.5 h-3.5 text-slate-400 opacity-70 group-hover:opacity-100"
        aria-hidden="true"
      />
    </button>
  );
}

// ─── 3. ConfirmButton ──────────────────────────────────────────────────────────

export function ConfirmButton({
  label,
  title,
  message,
  requiredPhrase,
  destructive = true,
  onConfirm,
  size = 'sm',
}: {
  label: string;
  title: string;
  message: string;
  requiredPhrase?: string;
  destructive?: boolean;
  onConfirm: () => void;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant={destructive ? 'danger' : 'secondary'}
        size={size}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <TypedConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        title={title}
        message={message}
        destructive={destructive}
        requiredPhrase={requiredPhrase}
      />
    </>
  );
}

// ─── 4. ImportWizard (CSV Upload -> Column Mapping -> Validation Preview) ───────

const SAMPLE_ORDERS_CSV = [
  'customerName,customerEmail,company,amount,status',
  'Aria Farhadi,aria@aurora.io,Aurora Pay,14200,Completed',
  'David Park,dpark@helix.dev,Helix Labs,6800,Processing',
  'Invalid User,not-an-email,Broken Corp,-40,Pending',
].join('\n');

export interface ImportWizardProps {
  open: boolean;
  onClose: () => void;
  onImportValidRows: (rows: ImportValidationResult['validRows']) => void;
}

export function ImportWizard({
  open,
  onClose,
  onImportValidRows,
}: ImportWizardProps) {
  const [step, setStep] = useState(0);
  const [csvText, setCsvText] = useState(SAMPLE_ORDERS_CSV);
  const [mapping, setMapping] = useState({
    customerName: 'customerName',
    customerEmail: 'customerEmail',
    amount: 'amount',
    company: 'company',
    planOrItem: 'planOrItem',
  });

  const parsed = useMemo(() => parseCsvForImport(csvText), [csvText]);

  const validation: ImportValidationResult = useMemo(() => {
    return validateImportedRows(parsed.rows, mapping);
  }, [parsed.rows, mapping]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCsvText(reader.result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="CSV Import Wizard"
      description="Upload ledger CSV, align columns, and review validation checks before importing."
      size="lg"
      footer={
        <>
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button
              variant="primary"
              disabled={parsed.headers.length === 0}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={validation.validRows.length === 0}
              onClick={() => {
                onImportValidRows(validation.validRows);
                setStep(0);
                onClose();
              }}
            >
              Import {validation.validRows.length} valid rows
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <Stepper
          activeIndex={step}
          onStepClick={(idx) => setStep(idx)}
          steps={[
            { id: 'upload', title: '1. Upload CSV', description: 'Select file or paste' },
            { id: 'map', title: '2. Map Columns', description: 'Match schema fields' },
            { id: 'review', title: '3. Validate', description: 'Inspect row errors' },
          ]}
        />

        {step === 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Choose .csv file</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCsvText(SAMPLE_ORDERS_CSV)}
              >
                Reset sample CSV
              </Button>
            </div>
            <textarea
              dir="ltr"
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detected {parsed.headers.length} columns and {parsed.rows.length} rows.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['customerName', 'customerEmail', 'company', 'amount'] as const).map(
              (targetField) => (
                <div key={targetField} className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Target: <code className="font-mono">{targetField}</code>
                  </label>
                  <select
                    value={mapping[targetField] ?? ''}
                    onChange={(e) =>
                      setMapping((prev) => ({
                        ...prev,
                        [targetField]: e.target.value,
                      }))
                    }
                    className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">— Ignore —</option>
                    {parsed.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              )
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Valid rows ready
                </p>
                <p dir="ltr" className="font-mono text-lg font-bold text-emerald-800 dark:text-emerald-200">
                  {validation.validRows.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                <p className="text-xs text-red-700 dark:text-red-300">
                  Rows with issues
                </p>
                <p dir="ltr" className="font-mono text-lg font-bold text-red-800 dark:text-red-200">
                  {validation.errors.length}
                </p>
              </div>
            </div>

            {validation.errors.length > 0 && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50/40 dark:bg-red-950/20 p-3 space-y-1.5">
                {validation.errors.map((err, idx) => (
                  <p
                    key={idx}
                    className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      Row {err.rowIndex}: {err.message}
                    </span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── 5. ExportDialog ───────────────────────────────────────────────────────────

export function ExportDialog({
  open,
  onClose,
  onExport,
}: {
  open: boolean;
  onClose: () => void;
  onExport: (opts: { format: 'csv' | 'json' | 'pdf'; scope: 'filtered' | 'all' }) => void;
}) {
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [scope, setScope] = useState<'filtered' | 'all'>('filtered');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export Dataset"
      description="Choose output format and record scope for download."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => {
              onExport({ format, scope });
              onClose();
            }}
          >
            Download {format.toUpperCase()}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            Output format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['csv', 'json', 'pdf'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormat(fmt)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                  format === fmt
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            Scope
          </label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as 'filtered' | 'all')}
            className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
          >
            <option value="filtered">Current filtered view</option>
            <option value="all">Full dataset</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

// ─── 6. RBAC Permission Context (<Can>, <ProtectedRoute>, usePermission, useAuth)

interface PermissionContextValue {
  roleId: RoleId;
  setRoleId: (role: RoleId) => void;
  matrix: PermissionMatrixState;
  setMatrix: React.Dispatch<React.SetStateAction<PermissionMatrixState>>;
  can: (resource: PermissionResource, action: PermissionAction) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [roleId, setRoleId] = useState<RoleId>('super_admin');
  const [matrix, setMatrix] = useState<PermissionMatrixState>(
    createInitialPermissionMatrix
  );

  const can = (resource: PermissionResource, action: PermissionAction) => {
    return Boolean(matrix[roleId]?.[resource]?.[action]);
  };

  return (
    <PermissionContext.Provider
      value={{ roleId, setRoleId, matrix, setMatrix, can }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    return {
      roleId: 'super_admin' as RoleId,
      setRoleId: () => undefined,
      can: () => true,
    };
  }
  return {
    roleId: ctx.roleId,
    setRoleId: ctx.setRoleId,
    can: ctx.can,
  };
}

export function useAuth() {
  const { roleId, setRoleId } = usePermission();
  return {
    user: ADMIN_PROFILE,
    roleId,
    setRoleId,
    isAuthenticated: true,
  };
}

export function Can({
  resource,
  action,
  fallback = null,
  children,
}: {
  resource: PermissionResource;
  action: PermissionAction;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { can } = usePermission();
  return <>{can(resource, action) ? children : fallback}</>;
}

export function ProtectedRoute({
  resource,
  action = 'view',
  children,
}: {
  resource: PermissionResource;
  action?: PermissionAction;
  children: React.ReactNode;
}) {
  const { can, roleId } = usePermission();
  if (!can(resource, action)) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/25 p-5 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="text-xs">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Restricted for role <code className="font-mono">{roleId}</code>
          </p>
          <p className="text-amber-700 dark:text-amber-300 mt-0.5">
            Missing <code className="font-mono">{resource}:{action}</code> permission.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

// ─── 7. VersionBadge & ChangeLogModal ──────────────────────────────────────────

export interface ChangelogRelease {
  version: string;
  date: string;
  highlights: string[];
}

export const KESTREL_CHANGELOG: ChangelogRelease[] = [
  {
    version: 'v2.6.0',
    date: '2026-11-26',
    highlights: [
      'Complete 9-layer Admin Architecture with Radar & Gauge charts, SplitView, ContextMenu, and CSV Import Wizard',
      'Full RTL + Dark Mode parity across 4 languages (EN, FA, AR, ES)',
      'AutoDataGrid density switcher, drag-to-resize columns, and Promise-based useConfirm hook',
    ],
  },
  {
    version: 'v2.5.0',
    date: '2026-11-18',
    highlights: [
      'Tree & Folder File Storage browser with reusable Modal File Picker',
      'Time-series analytics charts with dynamic filtering and Print/PDF ledger exports',
    ],
  },
];

export function VersionBadge({
  version = 'v2.6.0',
  onClick,
}: {
  version?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      dir="ltr"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
    >
      <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" aria-hidden="true" />
      <span>{version}</span>
    </button>
  );
}

export function ChangeLogModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Platform Release Notes"
      description="Recent architectural updates and component additions."
      size="md"
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4">
        {KESTREL_CHANGELOG.map((rel) => (
          <div
            key={rel.version}
            className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                dir="ltr"
                className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400"
              >
                {rel.version}
              </span>
              <span
                dir="ltr"
                className="font-mono text-[11px] text-slate-500 dark:text-slate-400"
              >
                {rel.date}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc ps-4">
              {rel.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
