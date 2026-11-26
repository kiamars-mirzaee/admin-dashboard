import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  History,
  Mail,
  Paperclip,
  Plus,
  RotateCcw,
  Tag,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from './Button';

/* ─── 1. Popconfirm ────────────────────────────────────────────────────────── */
export function Popconfirm({
  title = 'Confirm action?',
  confirmLabel = 'Confirm',
  onConfirm,
  children,
}: {
  title?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block" data-testid="popconfirm">
      <span onClick={() => setOpen((o) => !o)} className="inline-block">
        {children}
      </span>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 start-0 z-40 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-3 space-y-2.5 text-xs">
            <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
            <div className="flex justify-end gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  onConfirm();
                  setOpen(false);
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── 2. Mobile Bottom Sheet ───────────────────────────────────────────────── */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid="bottom-sheet"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl"
      >
        <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto" />
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bottom sheet"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

/* ─── 3. Approval Flow / Workflow Stepper ──────────────────────────────────── */
export interface ApprovalStage {
  id: string;
  role: string;
  assignee: string;
  status: 'approved' | 'pending' | 'rejected';
  note?: string;
}

export function ApprovalFlow({
  initialStages,
  onAction,
}: {
  initialStages: ApprovalStage[];
  onAction?: (stageId: string, decision: 'approved' | 'rejected') => void;
}) {
  const [stages, setStages] = useState(initialStages);

  const decide = (id: string, decision: 'approved' | 'rejected') => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: decision } : s))
    );
    onAction?.(id, decision);
  };

  return (
    <div className="space-y-2.5" data-testid="approval-flow">
      {stages.map((stage, idx) => (
        <div
          key={stage.id}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-xs"
        >
          <div className="flex items-center gap-2.5">
            {stage.status === 'approved' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : stage.status === 'rejected' ? (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {idx + 1}. {stage.role} — <span className="font-normal">{stage.assignee}</span>
              </p>
              {stage.note && <p className="text-[11px] text-slate-500">{stage.note}</p>}
            </div>
          </div>

          {stage.status === 'pending' ? (
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={() => decide(stage.id, 'rejected')}>
                Reject
              </Button>
              <Button size="sm" variant="primary" onClick={() => decide(stage.id, 'approved')}>
                Approve
              </Button>
            </div>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                stage.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
              }`}
            >
              {stage.status}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── 4. Version History with Restore ──────────────────────────────────────── */
export interface VersionEntry {
  id: string;
  version: string;
  author: string;
  timestamp: string;
  summary: string;
}

export function VersionHistory({
  versions,
  onRestore,
}: {
  versions: VersionEntry[];
  onRestore?: (version: VersionEntry) => void;
}) {
  const [activeId, setActiveId] = useState(versions[0]?.id ?? '');

  return (
    <div className="space-y-2" data-testid="version-history">
      {versions.map((v) => {
        const isCurrent = v.id === activeId;
        return (
          <div
            key={v.id}
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              isCurrent
                ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <History className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {v.version} · {v.author}
                  {isCurrent && (
                    <span className="ms-2 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px]">
                      Active
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{v.summary}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span dir="ltr" className="font-mono text-[11px] text-slate-400">
                {v.timestamp}
              </span>
              {!isCurrent && (
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<RotateCcw className="w-3 h-3" />}
                  onClick={() => {
                    setActiveId(v.id);
                    onRestore?.(v);
                  }}
                >
                  Restore
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── 5. Trash / Soft-Delete Recovery ──────────────────────────────────────── */
export interface TrashItem {
  id: string;
  title: string;
  entityType: string;
  deletedAt: string;
}

export function TrashRecovery({
  initialItems,
  onRestore,
}: {
  initialItems: TrashItem[];
  onRestore?: (item: TrashItem) => void;
}) {
  const [items, setItems] = useState(initialItems);

  return (
    <div className="space-y-2" data-testid="trash-recovery">
      {items.length === 0 ? (
        <p className="text-xs text-slate-500 py-4 text-center">Trash bin is empty.</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between gap-2 text-xs"
          >
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
              <p className="text-[11px] text-slate-500">
                {item.entityType} · Deleted {item.deletedAt}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<RotateCcw className="w-3 h-3" />}
                onClick={() => {
                  setItems((prev) => prev.filter((x) => x.id !== item.id));
                  onRestore?.(item);
                }}
              >
                Restore
              </Button>
              <Popconfirm
                title={`Permanently purge ${item.id}?`}
                confirmLabel="Purge"
                onConfirm={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
              >
                <Button size="sm" variant="ghost" leftIcon={<Trash2 className="w-3 h-3 text-rose-500" />}>
                  Purge
                </Button>
              </Popconfirm>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ─── 6. AttachmentsList & TagCategoryManager ──────────────────────────────── */
export function AttachmentsList() {
  const [files, setFiles] = useState([
    { id: 'att-1', name: 'sepa-mandate-ORD-8490.pdf', size: '420 KB' },
    { id: 'att-2', name: 'wire-proof-iban.png', size: '1.1 MB' },
  ]);

  return (
    <div className="space-y-2" data-testid="attachments-list">
      {files.map((f) => (
        <div
          key={f.id}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between gap-2 text-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span dir="ltr" className="font-mono truncate text-slate-800 dark:text-slate-200">
              {f.name}
            </span>
            <span className="text-slate-400 shrink-0">{f.size}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button" aria-label={`Download ${f.name}`} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer">
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Remove ${f.name}`}
              onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TagCategoryManager() {
  const [tags, setTags] = useState([
    { id: 't1', name: 'SEPA Instant', color: '#2563EB' },
    { id: 't2', name: 'High Value', color: '#D97706' },
    { id: 't3', name: 'SOC2 Verified', color: '#059669' },
  ]);
  const [draft, setDraft] = useState('');

  return (
    <div className="space-y-2.5" data-testid="tag-category-manager">
      <div className="flex items-center gap-2">
        <input
          dir="auto"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="New category or tag..."
          className="flex-1 min-h-[36px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
        />
        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => {
            const clean = draft.trim();
            if (!clean) return;
            setTags((prev) => [...prev, { id: `t-${Date.now()}`, name: clean, color: '#6366F1' }]);
            setDraft('');
          }}
        >
          Add Tag
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
          >
            <Tag className="w-3 h-3" style={{ color: t.color }} />
            <span>{t.name}</span>
            <button
              type="button"
              onClick={() => setTags((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-slate-400 hover:text-rose-600 cursor-pointer"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── 7. Email / Notification Template Editor ──────────────────────────────── */
export function TemplateEditor() {
  const [subject, setSubject] = useState('Settlement Alert for {{order_id}} — {{company}}');
  const [body, setBody] = useState(
    'Hello {{customer_name}},\nYour order {{order_id}} ({{amount}}) is currently {{status}}.'
  );

  const previewBody = body
    .replaceAll('{{customer_name}}', 'Devon Alverez')
    .replaceAll('{{order_id}}', 'ORD-8490')
    .replaceAll('{{amount}}', '$3,290')
    .replaceAll('{{status}}', 'Flagged for Review');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="template-editor">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-600" /> Template Editor
          </span>
          <div className="flex gap-1">
            {['{{order_id}}', '{{company}}', '{{amount}}'].map((tok) => (
              <button
                key={tok}
                type="button"
                onClick={() => setBody((b) => `${b} ${tok}`)}
                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] cursor-pointer"
              >
                {tok}
              </button>
            ))}
          </div>
        </div>
        <input
          dir="auto"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full min-h-[36px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium"
        />
        <textarea
          dir="auto"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-xs"
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 p-3.5 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <FileText className="w-3.5 h-3.5" /> Live Rendered Preview
        </div>
        <p className="font-bold text-slate-900 dark:text-white">
          {subject.replaceAll('{{order_id}}', 'ORD-8490').replaceAll('{{company}}', 'Gridline Mobility')}
        </p>
        <pre className="whitespace-pre-wrap font-sans text-slate-600 dark:text-slate-300 leading-relaxed">
          {previewBody}
        </pre>
      </div>
    </div>
  );
}
