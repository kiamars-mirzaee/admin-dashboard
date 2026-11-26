import React, { useMemo, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import { computeGaugeRatio, computeRadarCoordinates } from '../../utils/formatters';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Modal } from './Modal';

/* DescriptionList / DataList */
export interface DescriptionItem {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

export function DescriptionList({
  items,
  columns = 2,
}: {
  items: DescriptionItem[];
  columns?: 1 | 2 | 3;
}) {
  const colsCls =
    columns === 1
      ? 'grid-cols-1'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2';
  return (
    <dl className={`grid ${colsCls} gap-3`}>
      {items.map((item) => (
        <div
          key={item.label}
          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
        >
          <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {item.label}
          </dt>
          <dd
            dir={item.mono ? 'ltr' : undefined}
            className={`mt-1 text-sm font-semibold text-slate-900 dark:text-white ${
              item.mono ? 'font-mono tabular-nums' : ''
            }`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ChartCard (Frame with Title, Time Filter & Export) */
export function ChartCard({
  title,
  subtitle,
  range,
  onRangeChange,
  onExportCsv,
  children,
}: {
  title: string;
  subtitle?: string;
  range?: string;
  onRangeChange?: (next: string) => void;
  onExportCsv?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRangeChange && (
            <select
              aria-label={`${title} window`}
              value={range}
              onChange={(e) => onRangeChange(e.target.value)}
              className="min-h-[34px] px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="7d">7D</option>
              <option value="30d">30D</option>
              <option value="90d">90D</option>
            </select>
          )}
          {onExportCsv && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={onExportCsv}
            >
              Export
            </Button>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

/* RadarChart */
export interface RadarAxis {
  label: string;
  value: number;
}

export function RadarChart({
  axes,
  maxValue = 100,
  size = 240,
}: {
  axes: RadarAxis[];
  maxValue?: number;
  size?: number;
}) {
  const center = size / 2;
  const radius = size * 0.3;
  const points = computeRadarCoordinates(
    axes.map((a) => a.value),
    maxValue,
    center,
    radius
  );
  const polygonStr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const labelPoints = computeRadarCoordinates(
    axes.map(() => maxValue * 1.18),
    maxValue,
    center,
    radius
  );

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar metrics">
        {[0.25, 0.5, 0.75, 1].map((ring) => {
          const ringPts = computeRadarCoordinates(
            axes.map(() => maxValue * ring),
            maxValue,
            center,
            radius
          );
          return (
            <polygon
              key={ring}
              points={ringPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
              fill="none"
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth={1}
            />
          );
        })}
        {axes.map((a, idx) => {
          const edge = computeRadarCoordinates(
            axes.map(() => maxValue),
            maxValue,
            center,
            radius
          )[idx];
          return (
            <g key={a.label}>
              <line
                x1={center}
                y1={center}
                x2={edge.x}
                y2={edge.y}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth={1}
              />
              <text
                x={labelPoints[idx].x}
                y={labelPoints[idx].y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[10px] font-medium"
              >
                {a.label}
              </text>
            </g>
          );
        })}
        <polygon
          points={polygonStr}
          fill="rgba(37, 99, 235, 0.22)"
          stroke="#2563EB"
          strokeWidth={2}
        />
        {points.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r={3.5} fill="#2563EB" />
        ))}
      </svg>
    </div>
  );
}

/* GaugeChart */
export function GaugeChart({
  value,
  min = 0,
  max = 100,
  label,
  unit = '%',
}: {
  value: number;
  min?: number;
  max?: number;
  label: string;
  unit?: string;
}) {
  const ratio = computeGaugeRatio(value, min, max);
  const r = 68;
  const semi = Math.PI * r;
  const dashOffset = semi * (1 - ratio);

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <svg width={180} height={112} viewBox="0 0 180 112" role="img" aria-label={`${label}: ${value}${unit}`}>
        <path
          d="M 22 92 A 68 68 0 0 1 158 92"
          fill="none"
          strokeWidth={14}
          strokeLinecap="round"
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <path
          d="M 22 92 A 68 68 0 0 1 158 92"
          fill="none"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={semi}
          strokeDashoffset={dashOffset}
          className={
            ratio > 0.85
              ? 'stroke-emerald-600 dark:stroke-emerald-400'
              : ratio > 0.5
                ? 'stroke-blue-600 dark:stroke-blue-400'
                : 'stroke-amber-500'
          }
        />
        <text
          x="90"
          y="78"
          textAnchor="middle"
          className="fill-slate-900 dark:fill-white font-mono text-xl font-bold"
        >
          {value}{unit}
        </text>
        <text
          x="90"
          y="98"
          textAnchor="middle"
          className="fill-slate-500 dark:fill-slate-400 text-[11px]"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

/* Reusable Timeline / ActivityFeed */
export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone?: 'info' | 'success' | 'warning';
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative border-s border-slate-200 dark:border-slate-800 ms-3 space-y-5">
      {items.map((item) => {
        const dot =
          item.tone === 'success'
            ? 'bg-emerald-500'
            : item.tone === 'warning'
              ? 'bg-amber-500'
              : 'bg-blue-600';
        return (
          <li key={item.id} className="ms-5">
            <span className={`absolute -start-[5px] mt-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${dot}`} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
              <span dir="ltr" className="font-mono text-[11px] text-slate-400">
                {item.timestamp}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
          </li>
        );
      })}
    </ol>
  );
}

/* Interactive Monthly / Weekly CalendarView */
export interface CalendarEventItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  tone?: 'info' | 'success' | 'warning';
}

export function CalendarView({ events }: { events: CalendarEventItem[] }) {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDay, setSelectedDay] = useState<string>('2026-11-18');
  const days = Array.from({ length: 30 }, (_, idx) => {
    const dayNum = idx + 1;
    const iso = `2026-11-${String(dayNum).padStart(2, '0')}`;
    return { dayNum, iso };
  });

  const visibleDays = viewMode === 'week' ? days.slice(14, 21) : days;
  const selectedEvents = events.filter((e) => e.date === selectedDay);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <CalendarIcon className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span>November 2026</span>
        </div>
        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-2.5 py-1 rounded-md cursor-pointer ${
              viewMode === 'month' ? 'bg-white dark:bg-slate-900 font-semibold shadow-xs' : 'text-slate-500'
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-2.5 py-1 rounded-md cursor-pointer ${
              viewMode === 'week' ? 'bg-white dark:bg-slate-900 font-semibold shadow-xs' : 'text-slate-500'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-slate-400 py-1">
            {d}
          </div>
        ))}
        {visibleDays.map(({ dayNum, iso }) => {
          const dayEvents = events.filter((e) => e.date === iso);
          const active = selectedDay === iso;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelectedDay(iso)}
              className={`min-h-[54px] p-1.5 rounded-xl border text-start flex flex-col justify-between transition-colors cursor-pointer ${
                active
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300'
              }`}
            >
              <span dir="ltr" className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                {dayNum}
              </span>
              {dayEvents.length > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-700 dark:text-blue-300 truncate">
                  {dayEvents.length} item{dayEvents.length > 1 ? 's' : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
        <p dir="ltr" className="font-mono font-semibold text-slate-700 dark:text-slate-200 mb-1">
          {selectedDay}
        </p>
        {selectedEvents.length === 0 ? (
          <p className="text-slate-500">No scheduled settlements on this date.</p>
        ) : (
          <ul className="space-y-1">
            {selectedEvents.map((ev) => (
              <li key={ev.id} className="text-slate-700 dark:text-slate-300">
                • {ev.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* Carousel / ImageGallery / Lightbox */
export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  colorFrom: string;
  colorTo: string;
}

export function ImageGallery({ items }: { items: GalleryItem[] }) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const current = items[index] ?? items[0];
  if (!current) return null;

  return (
    <div className="space-y-3">
      <div
        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-6 min-h-[160px] flex flex-col justify-between text-white"
        style={{ background: `linear-gradient(135deg, ${current.colorFrom}, ${current.colorTo})` }}
      >
        <div className="flex items-center justify-between">
          <span dir="ltr" className="font-mono text-xs bg-black/25 px-2 py-0.5 rounded">
            {index + 1} / {items.length}
          </span>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Open lightbox preview"
            className="p-2 rounded-lg bg-black/25 hover:bg-black/40 cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div>
          <h4 className="text-base font-bold">{current.title}</h4>
          <p className="text-xs text-white/85 mt-0.5">{current.caption}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ChevronLeft className="w-4 h-4 rtl:rotate-180" />}
          onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
        >
          Prev
        </Button>
        <div className="flex items-center gap-1.5">
          {items.map((it, idx) => (
            <button
              key={it.id}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              onClick={() => setIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === index ? 'w-5 bg-blue-600' : 'w-2 bg-slate-300 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          rightIcon={<ChevronRight className="w-4 h-4 rtl:rotate-180" />}
          onClick={() => setIndex((i) => (i + 1) % items.length)}
        >
          Next
        </Button>
      </div>

      <Modal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={current.title}
        size="lg"
      >
        <div
          className="rounded-2xl p-10 min-h-[260px] flex flex-col justify-end text-white"
          style={{ background: `linear-gradient(135deg, ${current.colorFrom}, ${current.colorTo})` }}
        >
          <h3 className="text-xl font-bold">{current.title}</h3>
          <p className="text-sm text-white/90 mt-1">{current.caption}</p>
        </div>
      </Modal>
    </div>
  );
}

/* Code / JSON Viewer */
export { JSONViewer, JsonViewer, type JSONViewerProps } from './JSONViewer';

/* CommentThread */
export interface CommentEntry {
  id: string;
  author: string;
  role: string;
  body: string;
  timestamp: string;
}

export function CommentThread({
  initialComments,
}: {
  initialComments: CommentEntry[];
}) {
  const [comments, setComments] = useState<CommentEntry[]>(initialComments);
  const [draft, setDraft] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: 'Elena Rostova',
        role: 'VP of Operations',
        body: clean,
        timestamp: 'Just now',
      },
    ]);
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {comments.map((c) => (
          <div
            key={c.id}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3"
          >
            <Avatar name={c.author} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {c.author} <span className="font-normal text-slate-500">· {c.role}</span>
                </p>
                <span className="text-[11px] text-slate-400">{c.timestamp}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {c.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <MessageSquare className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write an internal review note..."
            aria-label="Write an internal review note"
            className="w-full min-h-[40px] ps-9 pe-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>
        <Button type="submit" variant="primary" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
          Post
        </Button>
      </form>
    </div>
  );
}

/* Standalone Pagination */
export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav aria-label="Pagination" className="inline-flex items-center gap-1.5">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </Button>
      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onPageChange(num)}
          aria-current={page === num ? 'page' : undefined}
          className={`min-w-[34px] h-[34px] rounded-lg font-mono text-xs font-semibold cursor-pointer ${
            page === num
              ? 'bg-slate-900 text-white dark:bg-blue-600'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {num}
        </button>
      ))}
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}

/* Windowed VirtualList */
export function VirtualList<T>({
  items,
  itemHeight = 44,
  height = 220,
  renderItem,
}: {
  items: T[];
  itemHeight?: number;
  height?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalHeight = items.length * itemHeight;
  const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const visibleCount = Math.ceil(height / itemHeight) + 4;
  const slice = items.slice(startIdx, startIdx + visibleCount);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      className="overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 relative"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {slice.map((item, offset) => {
          const idx = startIdx + offset;
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                top: idx * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
              className="px-3.5 flex items-center border-b border-slate-100 dark:border-slate-800/70"
            >
              {renderItem(item, idx)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
