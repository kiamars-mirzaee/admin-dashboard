import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Eraser,
  Globe,
  MapPin,
  RefreshCw,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useFormPersist } from '../../hooks/index';
import {
  describeCronExpression,
  evaluateConditionalField,
  matchesNormalizedQuery,
  normalizeDigits,
} from '../../utils/persianRtl';

/* ─── 1. Transfer / Dual List ──────────────────────────────────────────────── */
export interface TransferItem {
  id: string;
  label: string;
}

export function TransferList({
  items,
  initialAssignedIds = [],
}: {
  items: TransferItem[];
  initialAssignedIds?: string[];
}) {
  const [assigned, setAssigned] = useState<string[]>(initialAssignedIds);
  const [leftQuery, setLeftQuery] = useState('');
  const [rightQuery, setRightQuery] = useState('');

  const availableList = items.filter(
    (i) => !assigned.includes(i.id) && matchesNormalizedQuery(i.label, leftQuery)
  );
  const assignedList = items.filter(
    (i) => assigned.includes(i.id) && matchesNormalizedQuery(i.label, rightQuery)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center" data-testid="transfer-list">
      <div className="md:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 space-y-2">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Available Permissions ({availableList.length})
        </p>
        <input
          dir="auto"
          type="search"
          value={leftQuery}
          onChange={(e) => setLeftQuery(e.target.value)}
          placeholder="Filter available..."
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
        />
        <div className="space-y-1 max-h-36 overflow-y-auto">
          {availableList.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAssigned((prev) => [...prev, item.id])}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-start hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
            >
              <span>{item.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
            </button>
          ))}
        </div>
      </div>

      <div className="md:col-span-1 flex md:flex-col items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => setAssigned(items.map((i) => i.id))}
          aria-label="Move all right"
          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          &gt;&gt;
        </button>
        <button
          type="button"
          onClick={() => setAssigned([])}
          aria-label="Move all left"
          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          &lt;&lt;
        </button>
      </div>

      <div className="md:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 space-y-2">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Assigned ({assignedList.length})
        </p>
        <input
          dir="auto"
          type="search"
          value={rightQuery}
          onChange={(e) => setRightQuery(e.target.value)}
          placeholder="Filter assigned..."
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
        />
        <div className="space-y-1 max-h-36 overflow-y-auto">
          {assignedList.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAssigned((prev) => prev.filter((x) => x !== item.id))}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-start bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-500 rtl:rotate-180" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── 2. Cascader (Province -> City) & TreeSelect ──────────────────────────── */
const CASCADER_DATA: Record<string, string[]> = {
  Tehran: ['Tehran Central', 'Shemiranat', 'Rey'],
  Isfahan: ['Isfahan', 'Kashan', 'Najafabad'],
  Fars: ['Shiraz', 'Marvdasht'],
  Bavaria: ['Munich', 'Nuremberg'],
};

export function CascaderField({
  label = 'Region Cascader (Province → City)',
}: {
  label?: string;
}) {
  const [province, setProvince] = useState('Tehran');
  const [city, setCity] = useState('Tehran Central');

  return (
    <div className="space-y-1.5" data-testid="cascader-field">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={province}
          onChange={(e) => {
            const p = e.target.value;
            setProvince(p);
            setCity(CASCADER_DATA[p]?.[0] ?? '');
          }}
          className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
        >
          {Object.keys(CASCADER_DATA).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
        >
          {(CASCADER_DATA[province] ?? []).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <p className="text-[11px] text-slate-500 flex items-center gap-1">
        <span>Selected path:</span>
        <span className="font-medium text-slate-800 dark:text-slate-200 inline-flex items-center gap-1">
          {province} <ChevronRight className="w-3 h-3 rtl:rotate-180" /> {city}
        </span>
      </p>
    </div>
  );
}

export interface TreeSelectOption {
  id: string;
  label: string;
  children?: TreeSelectOption[];
}

export function TreeSelectField({
  label = 'Category TreeSelect',
  options,
}: {
  label?: string;
  options: TreeSelectOption[];
}) {
  const [selected, setSelected] = useState<string[]>(['cat-sepa']);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const renderNodes = (list: TreeSelectOption[], depth = 0) =>
    list.map((node) => (
      <div key={node.id} style={{ paddingInlineStart: `${depth * 16}px` }} className="space-y-1">
        <label className="flex items-center gap-2 text-xs py-0.5 cursor-pointer text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={selected.includes(node.id)}
            onChange={() => toggle(node.id)}
            className="rounded border-slate-300 text-blue-600"
          />
          <span>{node.label}</span>
        </label>
        {node.children && renderNodes(node.children, depth + 1)}
      </div>
    ));

  return (
    <div className="space-y-1.5" data-testid="tree-select-field">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</label>
        <span className="text-[11px] text-slate-400">{selected.length} selected</span>
      </div>
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 max-h-36 overflow-y-auto">
        {renderNodes(options)}
      </div>
    </div>
  );
}

/* ─── 3. InputMask & InputGroup (with Persian digit normalization) ─────────── */
export function InputGroupAndMask() {
  const [domain, setDomain] = useState('northstar');
  const [cardMasked, setCardMasked] = useState('6037-9918-4402-1109');

  const formatCard = (raw: string) => {
    const digits = normalizeDigits(raw).replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1-');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="input-group-mask">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
          InputGroup (Prefix &amp; Suffix)
        </label>
        <div dir="ltr" className="flex rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
          <span className="px-3 py-2 bg-slate-100 dark:bg-slate-900 text-xs font-mono text-slate-500 border-r border-slate-200 dark:border-slate-800">
            https://
          </span>
          <input
            dir="auto"
            type="text"
            value={domain}
            onChange={(e) => setDomain(normalizeDigits(e.target.value))}
            className="flex-1 min-w-0 px-3 py-2 text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
          />
          <span className="px-3 py-2 bg-slate-100 dark:bg-slate-900 text-xs font-mono text-slate-500 border-l border-slate-200 dark:border-slate-800">
            .kestrelops.io
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
          InputMask (Auto-normalizes Persian digits ۰-۹ → 0-9)
        </label>
        <input
          dir="ltr"
          type="text"
          value={cardMasked}
          onChange={(e) => setCardMasked(formatCard(e.target.value))}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white"
        />
      </div>
    </div>
  );
}

/* ─── 4. Conditional Fields, Auto-save & Multi-language Content Tabs ───────── */
export function ConditionalAndMultiLangForm() {
  const { values, updateField, lastSavedAt } = useFormPersist<{
    channel: string;
    poNumber: string;
    titleFa: string;
    titleEn: string;
  }>('kestrel_kit_persisted_form', {
    channel: 'Enterprise',
    poNumber: 'PO-2026-881',
    titleFa: 'بسته تسویه فوری اروپا',
    titleEn: 'EU Instant Settlement Bundle',
  });
  const [langTab, setLangTab] = useState<'fa' | 'en'>('fa');

  const showPoField = evaluateConditionalField(
    { dependsOn: 'channel', operator: 'equals', value: 'Enterprise' },
    values
  );

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-4 space-y-4" data-testid="conditional-multilang-form">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-900 dark:text-white">
          Conditional Fields + Bilingual Tabs + Auto-Save (useFormPersist)
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="w-3.5 h-3.5" aria-hidden="true" />
          {lastSavedAt ? `Draft saved at ${lastSavedAt}` : 'Auto-save ready'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Sales Channel (controls PO field visibility)
          </label>
          <select
            value={values.channel}
            onChange={(e) => updateField('channel', e.target.value)}
            className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
          >
            <option value="Enterprise">Enterprise (Requires PO)</option>
            <option value="Direct">Direct (No PO required)</option>
          </select>
        </div>

        {showPoField && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Enterprise Purchase Order #
            </label>
            <input
              dir="ltr"
              type="text"
              value={values.poNumber}
              onChange={(e) => updateField('poNumber', normalizeDigits(e.target.value))}
              className="w-full min-h-[38px] px-3 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-xs font-mono"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Multi-language Content Tabs
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setLangTab('fa')}
              className={`px-2.5 py-1 rounded-md cursor-pointer ${
                langTab === 'fa' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'text-slate-500'
              }`}
            >
              فارسی (FA)
            </button>
            <button
              type="button"
              onClick={() => setLangTab('en')}
              className={`px-2.5 py-1 rounded-md cursor-pointer ${
                langTab === 'en' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'text-slate-500'
              }`}
            >
              English (EN)
            </button>
          </div>
        </div>

        {langTab === 'fa' ? (
          <input
            dir="rtl"
            type="text"
            value={values.titleFa}
            onChange={(e) => updateField('titleFa', e.target.value)}
            className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
          />
        ) : (
          <input
            dir="ltr"
            type="text"
            value={values.titleEn}
            onChange={(e) => updateField('titleEn', e.target.value)}
            className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
          />
        )}
      </div>
    </div>
  );
}

/* ─── 5. IconPicker, CronBuilder & DurationInput ───────────────────────────── */
const ICON_CHOICES = [
  { id: 'shield', label: 'Shield', icon: Shield },
  { id: 'zap', label: 'Zap', icon: Zap },
  { id: 'globe', label: 'Globe', icon: Globe },
  { id: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { id: 'clock', label: 'Clock', icon: Clock },
];

export function IconCronDurationControls() {
  const [selectedIcon, setSelectedIcon] = useState('shield');
  const [cron, setCron] = useState('0 9 * * 1-5');
  const [hours, setHours] = useState(2);
  const [minutes, setMinutes] = useState(30);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="icon-cron-duration">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">IconPicker</label>
        <div className="flex flex-wrap gap-1.5">
          {ICON_CHOICES.map((item) => {
            const Icon = item.icon;
            const active = selectedIcon === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={`Select icon ${item.label}`}
                onClick={() => setSelectedIcon(item.id)}
                className={`p-2 rounded-xl border cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">CronBuilder</label>
        <input
          dir="ltr"
          type="text"
          value={cron}
          onChange={(e) => setCron(normalizeDigits(e.target.value))}
          className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-xs"
        />
        <p className="text-[11px] text-blue-600 dark:text-blue-400">
          {describeCronExpression(cron)}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">DurationInput</label>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 gap-1">
            <input
              dir="ltr"
              type="number"
              min={0}
              max={99}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value) || 0)}
              className="w-10 text-xs font-mono bg-transparent focus:outline-none"
            />
            <span className="text-[11px] text-slate-400">h</span>
          </div>
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 gap-1">
            <input
              dir="ltr"
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value) || 0)}
              className="w-10 text-xs font-mono bg-transparent focus:outline-none"
            />
            <span className="text-[11px] text-slate-400">m</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono" dir="ltr">
            = {hours * 60 + minutes}m
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── 6. MentionInput, LocationPicker, SignaturePad & Captcha ──────────────── */
const MENTION_USERS = ['Elena Rostova', 'Marcus Chen', 'Hana Takahashi', 'Sara Mohammadi'];

export function MentionLocationSignatureCaptcha() {
  const [comment, setComment] = useState('Escalate payout review to @Elena');
  const [coords, setCoords] = useState({ x: 54, y: 42, label: 'Tehran / EU-West Hub' });
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaTarget, setCaptchaTarget] = useState('7K9M');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [signed, setSigned] = useState(false);

  const mentionMatch = comment.match(/@([a-zA-Z]*)$/);
  const suggestions = mentionMatch
    ? MENTION_USERS.filter((u) => u.toLowerCase().includes(mentionMatch[1].toLowerCase()))
    : [];

  const handleDrawMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2563EB';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setSigned(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="mention-location-signature">
      <div className="space-y-3">
        {/* MentionInput */}
        <div className="relative space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            MentionInput (@user)
          </label>
          <input
            dir="auto"
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
          />
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {suggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    setComment((c) => c.replace(/@([a-zA-Z]*)$/, `@${name.split(' ')[0]} `))
                  }
                  className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-medium cursor-pointer"
                >
                  @{name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LocationPicker */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              LocationPicker (Click map to drop pin)
            </span>
            <span dir="ltr" className="font-mono text-[11px] text-slate-500">
              {(35 + coords.y * 0.05).toFixed(3)}°N, {(51 + coords.x * 0.05).toFixed(3)}°E
            </span>
          </div>
          <div
            role="button"
            tabIndex={0}
            aria-label="Pick location coordinates on map"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
              const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
              setCoords({ x, y, label: `Pin (${x}%, ${y}%)` });
            }}
            className="relative h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:14px_14px] bg-slate-50 dark:bg-slate-950 cursor-crosshair overflow-hidden"
          >
            <div
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-full text-blue-600 dark:text-blue-400"
            >
              <MapPin className="w-5 h-5 fill-blue-600/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* SignaturePad */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              SignaturePad {signed ? '· Signed' : '· Draw below'}
            </span>
            <button
              type="button"
              onClick={() => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && canvasRef.current) {
                  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
                setSigned(false);
              }}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <Eraser className="w-3 h-3" /> Clear
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={360}
            height={92}
            onPointerDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ctx = e.currentTarget.getContext('2d');
              if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
              }
              setDrawing(true);
            }}
            onPointerMove={handleDrawMove}
            onPointerUp={() => setDrawing(false)}
            onPointerLeave={() => setDrawing(false)}
            className="w-full h-[92px] rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 touch-none cursor-crosshair"
          />
        </div>

        {/* Captcha */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Verification Captcha
          </label>
          <div className="flex items-center gap-2">
            <div
              dir="ltr"
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono tracking-[0.25em] text-sm font-bold select-none line-through decoration-blue-400"
            >
              {captchaTarget}
            </div>
            <button
              type="button"
              aria-label="Refresh captcha"
              onClick={() => {
                setCaptchaTarget(Math.random().toString(36).slice(2, 6).toUpperCase());
                setCaptchaInput('');
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <input
              dir="ltr"
              type="text"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(normalizeDigits(e.target.value).toUpperCase())}
              placeholder="Enter code"
              className="flex-1 min-h-[36px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono text-xs"
            />
            {captchaInput === captchaTarget && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Verified
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
