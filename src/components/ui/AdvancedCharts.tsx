import { useMemo, useState } from 'react';

/* ─── 1. FunnelChart ───────────────────────────────────────────────────────── */
export interface FunnelStage {
  id: string;
  label: string;
  value: number;
  color?: string;
}

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div className="space-y-2.5" data-testid="funnel-chart">
      {stages.map((stage, idx) => {
        const pct = Math.round((stage.value / max) * 100);
        const prev = idx > 0 ? stages[idx - 1].value : stage.value;
        const stepConv = prev > 0 ? Math.round((stage.value / prev) * 100) : 100;
        const isActive = activeId === stage.id;
        return (
          <div
            key={stage.id}
            onMouseEnter={() => setActiveId(stage.id)}
            onMouseLeave={() => setActiveId(null)}
            className={`p-2.5 rounded-xl border transition-colors ${
              isActive
                ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-900 dark:text-white">
                {idx + 1}. {stage.label}
              </span>
              <span dir="ltr" className="font-mono text-slate-600 dark:text-slate-300">
                {stage.value.toLocaleString()} ({pct}%{idx > 0 ? ` · ${stepConv}% step` : ''})
              </span>
            </div>
            <div className="w-full h-5 rounded-lg bg-slate-200/70 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
              <div
                className="h-full rounded-lg transition-all duration-300"
                style={{
                  width: `${Math.max(8, pct)}%`,
                  backgroundColor: stage.color ?? '#2563EB',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── 2. ScatterChart ──────────────────────────────────────────────────────── */
export interface ScatterPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  size?: number;
  group?: string;
}

export function ScatterChart({
  points,
  xLabel = 'Latency (ms)',
  yLabel = 'Order Value ($)',
}: {
  points: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
}) {
  const [hovered, setHovered] = useState<ScatterPoint | null>(null);
  const width = 420;
  const height = 220;
  const pad = 34;

  const maxX = Math.max(10, ...points.map((p) => p.x));
  const maxY = Math.max(10, ...points.map((p) => p.y));

  return (
    <div className="space-y-2" data-testid="scatter-chart">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {xLabel} vs {yLabel}
        </span>
        <span dir="ltr" className="font-mono text-slate-800 dark:text-slate-200">
          {hovered ? `${hovered.label}: (${hovered.x}, ${hovered.y})` : `${points.length} samples`}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52 overflow-visible">
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const y = height - pad - t * (height - pad * 2);
          return (
            <line
              key={t}
              x1={pad}
              x2={width - 12}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeDasharray="3 3"
            />
          );
        })}
        <line
          x1={pad}
          x2={width - 12}
          y1={height - pad}
          y2={height - pad}
          stroke="currentColor"
          className="text-slate-300 dark:text-slate-700"
        />
        <line
          x1={pad}
          x2={pad}
          y1={12}
          y2={height - pad}
          stroke="currentColor"
          className="text-slate-300 dark:text-slate-700"
        />
        {points.map((pt) => {
          const cx = pad + (pt.x / maxX) * (width - pad - 20);
          const cy = height - pad - (pt.y / maxY) * (height - pad * 2);
          const r = pt.size ?? 6;
          const active = hovered?.id === pt.id;
          return (
            <circle
              key={pt.id}
              cx={cx}
              cy={cy}
              r={active ? r + 2.5 : r}
              className="fill-blue-600/80 dark:fill-blue-400/80 stroke-white dark:stroke-slate-900 cursor-pointer transition-all"
              strokeWidth={2}
              onMouseEnter={() => setHovered(pt)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>{`${pt.label}: x=${pt.x}, y=${pt.y}`}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── 3. TreemapChart ──────────────────────────────────────────────────────── */
export interface TreemapNode {
  id: string;
  label: string;
  value: number;
  tone?: 'blue' | 'emerald' | 'amber' | 'violet' | 'slate';
}

const TREEMAP_TONES: Record<NonNullable<TreemapNode['tone']>, string> = {
  blue: 'bg-blue-600 text-white',
  emerald: 'bg-emerald-600 text-white',
  amber: 'bg-amber-500 text-slate-950',
  violet: 'bg-violet-600 text-white',
  slate: 'bg-slate-700 text-white',
};

export function TreemapChart({ items }: { items: TreemapNode[] }) {
  const total = Math.max(1, items.reduce((s, i) => s + i.value, 0));

  return (
    <div
      data-testid="treemap-chart"
      className="flex flex-wrap gap-1.5 rounded-xl overflow-hidden p-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[180px]"
    >
      {items.map((item) => {
        const share = Math.max(14, Math.round((item.value / total) * 100));
        return (
          <div
            key={item.id}
            style={{ flexGrow: item.value, flexBasis: `${share}%` }}
            className={`rounded-lg p-3 flex flex-col justify-between min-h-[82px] ${
              TREEMAP_TONES[item.tone ?? 'blue']
            }`}
          >
            <span className="text-xs font-semibold leading-tight">{item.label}</span>
            <div dir="ltr" className="font-mono text-[11px] opacity-90 mt-2">
              ${item.value.toLocaleString()} · {Math.round((item.value / total) * 100)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── 4. SVG Barcode Generator ─────────────────────────────────────────────── */
export function Barcode({
  value,
  height = 48,
  showText = true,
}: {
  value: string;
  height?: number;
  showText?: boolean;
}) {
  const bars = useMemo(() => {
    const out: Array<{ x: number; w: number }> = [];
    let x = 4;
    // Start guard bars
    out.push({ x, w: 2 }, { x: x + 4, w: 1 });
    x += 8;
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      const pattern = [(code % 3) + 1, ((code >> 2) % 2) + 1, ((code >> 4) % 3) + 1];
      for (let j = 0; j < pattern.length; j++) {
        const w = pattern[j];
        if (j % 2 === 0) out.push({ x, w });
        x += w + 1.5;
      }
    }
    // End guard bars
    out.push({ x, w: 1 }, { x: x + 3, w: 2 });
    return { list: out, width: x + 9 };
  }, [value]);

  return (
    <div
      dir="ltr"
      data-testid="barcode-svg"
      className="inline-flex flex-col items-center p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900"
    >
      <svg
        width={bars.width}
        height={height}
        viewBox={`0 0 ${bars.width} ${height}`}
        role="img"
        aria-label={`Barcode ${value}`}
      >
        {bars.list.map((b, i) => (
          <rect key={i} x={b.x} y={2} width={b.w} height={height - 4} fill="#0F172A" />
        ))}
      </svg>
      {showText && <span className="font-mono text-[11px] tracking-widest mt-1">{value}</span>}
    </div>
  );
}

/* ─── 5. OrgChart ──────────────────────────────────────────────────────────── */
export interface OrgMemberNode {
  id: string;
  name: string;
  role: string;
  department: string;
  reports?: OrgMemberNode[];
}

export function OrgChart({ root }: { root: OrgMemberNode }) {
  const renderNode = (node: OrgMemberNode, isRoot = false) => (
    <div key={node.id} className="flex flex-col items-center">
      <div
        className={`px-3.5 py-2.5 rounded-xl border text-center min-w-[156px] ${
          isRoot
            ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
        }`}
      >
        <p className="text-xs font-bold">{node.name}</p>
        <p className={`text-[11px] ${isRoot ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
          {node.role}
        </p>
        <span
          className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
            isRoot
              ? 'bg-white/15 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          {node.department}
        </span>
      </div>

      {node.reports && node.reports.length > 0 && (
        <>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
          <div className="flex flex-wrap justify-center gap-4 pt-3 border-t border-slate-300 dark:border-slate-700">
            {node.reports.map((child) => renderNode(child, false))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div data-testid="org-chart" className="overflow-x-auto p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
      {renderNode(root, true)}
    </div>
  );
}
