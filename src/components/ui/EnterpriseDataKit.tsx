import React, { useMemo, useState } from 'react';
import {
  BookmarkCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  GripVertical,
  Pause,
  Play,
  Terminal,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useClipboard } from '../../hooks/index';
import { isoToJalaliString } from '../../utils/jalali';
import {
  computeJsonDiff,
  matchesNormalizedQuery,
  sortByPersianField,
} from '../../utils/persianRtl';
import { Avatar } from './Avatar';
import { ProgressBar } from './Progress';

/* ─── 1. Bi-directional <bdi> & EllipsisText ───────────────────────────────── */
export function BdiText({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <bdi className={className}>{children}</bdi>;
}

export function EllipsisText({
  text,
  maxWidthClass = 'max-w-[180px]',
}: {
  text: string;
  maxWidthClass?: string;
}) {
  return (
    <span
      title={text}
      className={`inline-block truncate align-bottom ${maxWidthClass}`}
    >
      <bdi>{text}</bdi>
    </span>
  );
}

/* ─── 2. Reusable Table Cell Renderers ─────────────────────────────────────── */
export function CurrencyCell({ amount, currency = 'USD' }: { amount: number; currency?: string }) {
  return (
    <span dir="ltr" className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
      {currency === 'USD' ? '$' : `${currency} `}
      {amount.toLocaleString()}
    </span>
  );
}

export function DateCell({ isoDate, jalali = false }: { isoDate: string; jalali?: boolean }) {
  const formatted = useMemo(() => {
    if (!jalali) return isoDate;
    return isoToJalaliString(isoDate) || isoDate;
  }, [isoDate, jalali]);

  return (
    <span dir="ltr" className="font-mono text-xs text-slate-600 dark:text-slate-300">
      {formatted}
    </span>
  );
}

export function BooleanCell({ value, trueLabel = 'Yes', falseLabel = 'No' }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
        value
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      {value ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{value ? trueLabel : falseLabel}</span>
    </span>
  );
}

export function AvatarCell({ name, subtitle }: { name: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar name={name} size="sm" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
          <bdi>{name}</bdi>
        </p>
        {subtitle && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <bdi>{subtitle}</bdi>
          </p>
        )}
      </div>
    </div>
  );
}

export function ProgressCell({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1">
        <ProgressBar value={value} tone={value >= 80 ? 'success' : value < 35 ? 'warning' : 'default'} />
      </div>
      <span dir="ltr" className="font-mono text-[11px] text-slate-500 w-8 text-end">
        {value}%
      </span>
    </div>
  );
}

export function LinkCell({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      onClick={(e) => e.preventDefault()}
      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
    >
      <bdi>{label}</bdi>
      <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
    </a>
  );
}

export function TagCell({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

/* ─── 3. DiffViewer (Audit Log / Version History) ──────────────────────────── */
export function DiffViewer({
  before,
  after,
  title = 'Snapshot Diff',
}: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  title?: string;
}) {
  const [mode, setMode] = useState<'split' | 'unified'>('split');
  const entries = useMemo(() => computeJsonDiff(before, after), [before, after]);

  return (
    <div
      data-testid="diff-viewer"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden text-xs"
    >
      <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-800 dark:text-slate-200">{title}</span>
        <div className="flex items-center gap-1">
          {(['split', 'unified'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize cursor-pointer ${
                mode === m
                  ? 'bg-slate-900 text-white dark:bg-blue-600'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div dir="ltr" className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
        {entries.map((row) => {
          const prevTxt = row.before === undefined ? '—' : JSON.stringify(row.before);
          const nextTxt = row.after === undefined ? '—' : JSON.stringify(row.after);
          if (mode === 'unified') {
            return (
              <div key={row.key} className="px-3.5 py-1.5 space-y-0.5">
                <div className="text-[11px] font-semibold text-slate-500">{row.key}</div>
                {row.status === 'unchanged' ? (
                  <div className="text-slate-600 dark:text-slate-400">  {prevTxt}</div>
                ) : (
                  <>
                    {row.status !== 'added' && (
                      <div className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                        - {prevTxt}
                      </div>
                    )}
                    {row.status !== 'removed' && (
                      <div className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        + {nextTxt}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          }

          return (
            <div key={row.key} className="grid grid-cols-12 items-stretch">
              <div className="col-span-3 px-3 py-1.5 bg-slate-50/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold truncate border-r border-slate-100 dark:border-slate-800">
                {row.key}
              </div>
              <div
                className={`col-span-4 px-3 py-1.5 truncate border-r border-slate-100 dark:border-slate-800 ${
                  row.status === 'changed' || row.status === 'removed'
                    ? 'bg-rose-50/80 dark:bg-rose-950/35 text-rose-700 dark:text-rose-300'
                    : 'text-slate-500'
                }`}
              >
                {prevTxt}
              </div>
              <div
                className={`col-span-5 px-3 py-1.5 truncate ${
                  row.status === 'changed' || row.status === 'added'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/35 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {nextTxt}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── 4. Log / Console Viewer ──────────────────────────────────────────────── */
export interface LogLine {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
}

export function LogViewer({ logs }: { logs: LogLine[] }) {
  const [level, setLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [query, setQuery] = useState('');
  const { copied, copy } = useClipboard();

  const filtered = useMemo(
    () =>
      logs.filter(
        (l) =>
          (level === 'all' || l.level === level) &&
          matchesNormalizedQuery(`${l.service} ${l.message}`, query)
      ),
    [logs, level, query]
  );

  return (
    <div
      data-testid="log-viewer"
      className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 overflow-hidden text-xs"
    >
      <div className="px-3.5 py-2.5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-slate-300">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>kestrel-worker.log</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            dir="auto"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter logs..."
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {(['all', 'info', 'warn', 'error'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevel(lvl)}
              className={`px-2 py-1 rounded text-[11px] uppercase font-mono cursor-pointer ${
                level === lvl ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              void copy(filtered.map((l) => `[${l.timestamp}] ${l.level.toUpperCase()} ${l.service}: ${l.message}`).join('\n'))
            }
            className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div dir="ltr" className="p-3 font-mono text-[11px] space-y-1 max-h-56 overflow-y-auto">
        {filtered.map((line) => (
          <div key={line.id} className="flex items-start gap-2 leading-5">
            <span className="text-slate-500 shrink-0">{line.timestamp}</span>
            <span
              className={`px-1.5 rounded uppercase text-[10px] shrink-0 ${
                line.level === 'error'
                  ? 'bg-rose-500/20 text-rose-300'
                  : line.level === 'warn'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-sky-500/20 text-sky-300'
              }`}
            >
              {line.level}
            </span>
            <span className="text-violet-300 shrink-0">[{line.service}]</span>
            <span className="text-slate-200 break-words">{line.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 5. PDF Preview Card & Media Player ───────────────────────────────────── */
export function PDFPreviewCard({
  filename = 'Q4-EMEA-Settlement-Audit.pdf',
  pages = 6,
  size = '1.8 MB',
  onDownload,
}: {
  filename?: string;
  pages?: number;
  size?: string;
  onDownload?: () => void;
}) {
  const [page, setPage] = useState(1);

  return (
    <div
      data-testid="pdf-viewer-card"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden"
    >
      <div className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
          <span dir="ltr" className="font-mono font-semibold truncate text-slate-900 dark:text-white">
            {filename}
          </span>
          <span className="text-slate-400 shrink-0">{size}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
          >
            Prev
          </button>
          <span dir="ltr" className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
            {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="px-2.5 py-0.5 rounded bg-slate-900 dark:bg-blue-600 text-white font-medium cursor-pointer"
            >
              Download
            </button>
          )}
        </div>
      </div>

      <div className="p-4 flex justify-center">
        <div className="w-full max-w-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Kestrel Compliance Export</span>
            <span>Page {page}</span>
          </div>
          <p className="font-bold text-slate-900 dark:text-white">
            Executive Settlement Verification — Section {page}
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Reconciled SEPA Instant and wire settlement ledger records across EU-West and MENA clearing nodes with SHA-256 signature verification.
          </p>
        </div>
      </div>
    </div>
  );
}

export function MediaPlayer({
  title = 'Support Call Recording — ORD-8490.mp3',
  durationLabel = '02:14',
}: {
  title?: string;
  durationLabel?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(36);

  return (
    <div
      data-testid="media-player"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-900 dark:text-white truncate">{title}</span>
        <span dir="ltr" className="font-mono text-slate-500">
          00:48 / {durationLabel}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause playback' : 'Play recording'}
          className="w-9 h-9 rounded-full bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center cursor-pointer shrink-0"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ms-0.5" />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          aria-label="Seek audio position"
          onChange={(e) => setProgress(Number(e.target.value))}
          className="flex-1 accent-blue-600 cursor-pointer"
        />
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/* ─── 6. EnterpriseTable (Inline Edit, Group, Tree, Drag Reorder, Master-Detail, Summary, Saved Views, Jalali & FA Sort) ─ */
export interface EnterpriseTableRow {
  id: string;
  region: string;
  account: string;
  owner: string;
  isoDate: string;
  progress: number;
  amount: number;
  verified: boolean;
  tags: string[];
  children?: EnterpriseTableRow[];
}

const INITIAL_ENTERPRISE_ROWS: EnterpriseTableRow[] = [
  {
    id: 'ENT-01',
    region: 'EMEA',
    account: 'Northstar Labs · نورث‌استار',
    owner: 'Marcus Chen',
    isoDate: '2026-11-21',
    progress: 94,
    amount: 4850,
    verified: true,
    tags: ['enterprise', 'sepa'],
    children: [
      {
        id: 'ENT-01-A',
        region: 'EMEA',
        account: 'Sub-node Frankfurt-01',
        owner: 'Elena Rostova',
        isoDate: '2026-11-20',
        progress: 100,
        amount: 2150,
        verified: true,
        tags: ['sub-ledger'],
      },
    ],
  },
  {
    id: 'ENT-02',
    region: 'MENA',
    account: 'گروه فناوری کیان · Kian Tech',
    owner: 'Sara Mohammadi',
    isoDate: '2026-11-19',
    progress: 72,
    amount: 3290,
    verified: true,
    tags: ['rtl', 'jalali'],
  },
  {
    id: 'ENT-03',
    region: 'EMEA',
    account: 'آرمان لجستیک · Arman Logistics',
    owner: 'Devon Alverez',
    isoDate: '2026-11-18',
    progress: 48,
    amount: 1620,
    verified: false,
    tags: ['review'],
  },
];

export function EnterpriseTable() {
  const [rows, setRows] = useState<EnterpriseTableRow[]>(INITIAL_ENTERPRISE_ROWS);
  const [savedView, setSavedView] = useState<'all' | 'verified' | 'jalali'>('all');
  const [groupByRegion, setGroupByRegion] = useState(false);
  const [expandedTreeIds, setExpandedTreeIds] = useState<Set<string>>(new Set(['ENT-01']));
  const [detailRowId, setDetailRowId] = useState<string | null>(null);
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [sortFaAsc, setSortFaAsc] = useState(false);

  const visibleRows = useMemo(() => {
    let base = rows;
    if (savedView === 'verified') base = base.filter((r) => r.verified);
    if (sortFaAsc) base = sortByPersianField(base, (r) => r.account, 'asc');
    return base;
  }, [rows, savedView, sortFaAsc]);

  const totalAmount = visibleRows.reduce((s, r) => s + r.amount, 0);
  const avgProgress = visibleRows.length
    ? Math.round(visibleRows.reduce((s, r) => s + r.progress, 0) / visibleRows.length)
    : 0;

  const commitInlineEdit = (id: string) => {
    const parsed = Number(editDraft);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, amount: parsed } : r)));
    }
    setEditingCellId(null);
  };

  const handleDropRow = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setRows((prev) => {
      const fromIdx = prev.findIndex((r) => r.id === dragId);
      const toIdx = prev.findIndex((r) => r.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setDragId(null);
  };

  const groupedRegions = useMemo(() => {
    if (!groupByRegion) return [{ region: 'ALL', list: visibleRows }];
    const map = new Map<string, EnterpriseTableRow[]>();
    for (const r of visibleRows) {
      const bucket = map.get(r.region) ?? [];
      bucket.push(r);
      map.set(r.region, bucket);
    }
    return Array.from(map.entries()).map(([region, list]) => ({ region, list }));
  }, [groupByRegion, visibleRows]);

  return (
    <div className="space-y-3" data-testid="enterprise-table-kit">
      {/* Saved Views & Feature Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'Saved View: All Accounts' },
              { id: 'verified', label: 'Saved View: Verified Only' },
              { id: 'jalali', label: 'Saved View: Jalali Dates' },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSavedView(v.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                savedView === v.id
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{v.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setGroupByRegion((g) => !g)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
              groupByRegion
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Group by Region
          </button>
          <button
            type="button"
            onClick={() => setSortFaAsc((s) => !s)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
              sortFaAsc
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Sort Persian (Intl.Collator)
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-start border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
              <th className="py-2.5 px-3 text-start font-semibold">Order / Tree</th>
              <th className="py-2.5 px-3 text-start font-semibold">Account (&lt;bdi&gt;)</th>
              <th className="py-2.5 px-3 text-start font-semibold">Date</th>
              <th className="py-2.5 px-3 text-start font-semibold">Progress</th>
              <th className="py-2.5 px-3 text-start font-semibold">Verified</th>
              <th className="py-2.5 px-3 text-start font-semibold">Tags</th>
              <th className="py-2.5 px-3 text-end font-semibold">Amount (Click to Edit)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {groupedRegions.map((group) => (
              <React.Fragment key={group.region}>
                {groupByRegion && (
                  <tr className="bg-slate-100/70 dark:bg-slate-800/50">
                    <td colSpan={7} className="py-1.5 px-3 font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                      Region: {group.region} ({group.list.length} records)
                    </td>
                  </tr>
                )}
                {group.list.map((row) => {
                  const hasChildren = Boolean(row.children && row.children.length > 0);
                  const treeExpanded = expandedTreeIds.has(row.id);
                  const detailOpen = detailRowId === row.id;

                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        draggable
                        onDragStart={() => setDragId(row.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDropRow(row.id)}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-slate-400 cursor-grab" aria-hidden="true" />
                            {hasChildren ? (
                              <button
                                type="button"
                                aria-label="Toggle tree children"
                                onClick={() =>
                                  setExpandedTreeIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(row.id)) next.delete(row.id);
                                    else next.add(row.id);
                                    return next;
                                  })
                                }
                                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                              >
                                {treeExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />}
                              </button>
                            ) : (
                              <span className="w-4" />
                            )}
                            <button
                              type="button"
                              onClick={() => setDetailRowId(detailOpen ? null : row.id)}
                              className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              {row.id}
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <AvatarCell name={row.account} subtitle={row.owner} />
                        </td>
                        <td className="py-2.5 px-3">
                          <DateCell isoDate={row.isoDate} jalali={savedView === 'jalali'} />
                        </td>
                        <td className="py-2.5 px-3">
                          <ProgressCell value={row.progress} />
                        </td>
                        <td className="py-2.5 px-3">
                          <BooleanCell value={row.verified} trueLabel="Verified" falseLabel="Pending" />
                        </td>
                        <td className="py-2.5 px-3">
                          <TagCell tags={row.tags} />
                        </td>
                        <td className="py-2.5 px-3 text-end">
                          {editingCellId === row.id ? (
                            <input
                              type="number"
                              autoFocus
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              onBlur={() => commitInlineEdit(row.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitInlineEdit(row.id);
                                if (e.key === 'Escape') setEditingCellId(null);
                              }}
                              className="w-24 px-2 py-1 rounded border border-blue-500 bg-white dark:bg-slate-950 font-mono text-end"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCellId(row.id);
                                setEditDraft(String(row.amount));
                              }}
                              title="Click to inline edit amount"
                              className="px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                            >
                              <CurrencyCell amount={row.amount} />
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Tree Table Nested Child Rows */}
                      {hasChildren &&
                        treeExpanded &&
                        row.children!.map((child) => (
                          <tr key={child.id} className="bg-slate-50/60 dark:bg-slate-950/50">
                            <td className="py-2 px-3 ps-10 font-mono text-slate-500">↳ {child.id}</td>
                            <td className="py-2 px-3">
                              <EllipsisText text={child.account} />
                            </td>
                            <td className="py-2 px-3">
                              <DateCell isoDate={child.isoDate} jalali={savedView === 'jalali'} />
                            </td>
                            <td className="py-2 px-3">
                              <ProgressCell value={child.progress} />
                            </td>
                            <td className="py-2 px-3">
                              <BooleanCell value={child.verified} />
                            </td>
                            <td className="py-2 px-3">
                              <TagCell tags={child.tags} />
                            </td>
                            <td className="py-2 px-3 text-end">
                              <CurrencyCell amount={child.amount} />
                            </td>
                          </tr>
                        ))}

                      {/* Master-Detail Expandable Row */}
                      {detailOpen && (
                        <tr className="bg-blue-50/40 dark:bg-blue-950/20">
                          <td colSpan={7} className="p-3.5 text-xs text-slate-700 dark:text-slate-300">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span>
                                <strong>Master-Detail Inspector:</strong> {row.account} · Owner:{' '}
                                <LinkCell label={row.owner} href="#owner" />
                              </span>
                              <button
                                type="button"
                                onClick={() => setDetailRowId(null)}
                                className="text-blue-600 dark:text-blue-400 underline cursor-pointer"
                              >
                                Close detail
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold">
              <td colSpan={3} className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                Summary Footer ({visibleRows.length} rows)
              </td>
              <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                Avg {avgProgress}%
              </td>
              <td colSpan={2} />
              <td className="py-2.5 px-3 text-end">
                <CurrencyCell amount={totalAmount} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
