import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  GripVertical,
  HelpCircle,
  ListChecks,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from './Button';

// ─── 1. Stepper ────────────────────────────────────────────────────────────────

export interface StepItem {
  id: string;
  title: string;
  description?: string;
}

export function Stepper({
  steps,
  activeIndex,
  onStepClick,
  orientation = 'horizontal',
}: {
  steps: StepItem[];
  activeIndex: number;
  onStepClick?: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
}) {
  return (
    <ol
      className={
        orientation === 'vertical'
          ? 'space-y-3'
          : 'grid grid-cols-1 sm:grid-cols-3 gap-3'
      }
    >
      {steps.map((step, idx) => {
        const isDone = idx < activeIndex;
        const isCurrent = idx === activeIndex;
        return (
          <li key={step.id}>
            <button
              type="button"
              disabled={!onStepClick}
              onClick={() => onStepClick?.(idx)}
              className={`w-full p-3 rounded-xl border text-start flex items-center gap-3 transition-colors ${
                onStepClick ? 'cursor-pointer' : 'cursor-default'
              } ${
                isCurrent
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-500'
                  : isDone
                    ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {step.title}
                </span>
                {step.description && (
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {step.description}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ─── 2. BackButton ─────────────────────────────────────────────────────────────

export function BackButton({
  label = 'Back',
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      leftIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-180" />}
    >
      {label}
    </Button>
  );
}

// ─── 3. PageContainer, PageHeader, Section, Panel, Grid, Stack, Flex, StickyFooter

export function PageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`space-y-6 ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
  backButton,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div className="space-y-1 min-w-0">
        {backButton && <div className="mb-1">{backButton}</div>}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 ${className}`}
    >
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export const Panel = Section;

export function Grid({
  cols = 2,
  gap = 4,
  children,
  className = '',
}: {
  cols?: 1 | 2 | 3 | 4;
  gap?: 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols];
  const gapClass = {
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
  }[gap];
  return <div className={`grid ${colsClass} ${gapClass} ${className}`}>{children}</div>;
}

export function Stack({
  gap = 3,
  children,
  className = '',
}: {
  gap?: 2 | 3 | 4 | 6;
  children: React.ReactNode;
  className?: string;
}) {
  const gapClass = {
    2: 'space-y-2',
    3: 'space-y-3',
    4: 'space-y-4',
    6: 'space-y-6',
  }[gap];
  return <div className={`${gapClass} ${className}`}>{children}</div>;
}

export function Flex({
  justify = 'between',
  align = 'center',
  wrap = true,
  gap = 2,
  children,
  className = '',
}: {
  justify?: 'start' | 'center' | 'end' | 'between';
  align?: 'start' | 'center' | 'end' | 'stretch';
  wrap?: boolean;
  gap?: 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}) {
  const jClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  }[justify];
  const aClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }[align];
  const gClass = { 2: 'gap-2', 3: 'gap-3', 4: 'gap-4' }[gap];
  return (
    <div
      className={`flex ${wrap ? 'flex-wrap' : ''} ${jClass} ${aClass} ${gClass} ${className}`}
    >
      {children}
    </div>
  );
}

export function StickyFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`sticky bottom-3 z-20 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      {children}
    </div>
  );
}

// ─── 4. AuthLayout ─────────────────────────────────────────────────────────────

export function AuthLayout({
  brandTitle,
  brandSubtitle,
  highlights,
  children,
}: {
  brandTitle: string;
  brandSubtitle: string;
  highlights?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 lg:grid-cols-[1.05fr_1.25fr]">
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between gap-6">
        <div className="space-y-2">
          <span
            dir="ltr"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-blue-300"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Enterprise Identity
          </span>
          <h3 className="text-xl font-bold tracking-tight">{brandTitle}</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{brandSubtitle}</p>
        </div>

        {highlights && highlights.length > 0 && (
          <ul className="space-y-2 text-xs text-slate-300">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-6 sm:p-8">{children}</div>
    </div>
  );
}

// ─── 5. SplitView (Resizable Panels) ───────────────────────────────────────────

export function SplitView({
  left,
  right,
  initialRatio = 45,
  minRatio = 25,
  maxRatio = 75,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  initialRatio?: number;
  minRatio?: number;
  maxRatio?: number;
}) {
  const [ratio, setRatio] = useState(initialRatio);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const onMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(minRatio, Math.min(maxRatio, Math.round(pct)));
      setRatio(clamped);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="flex flex-col md:flex-row rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden min-h-[220px]"
    >
      <div
        style={{ flexBasis: `${ratio}%` }}
        className="p-4 min-w-0 shrink-0 border-b md:border-b-0 border-slate-200 dark:border-slate-800"
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={ratio}
        aria-valuemin={minRatio}
        aria-valuemax={maxRatio}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setRatio((r) => Math.max(minRatio, r - 4));
          if (e.key === 'ArrowRight') setRatio((r) => Math.min(maxRatio, r + 4));
        }}
        title="Drag or use Arrow keys to resize"
        className="hidden md:flex w-3 shrink-0 cursor-col-resize items-center justify-center bg-slate-50 dark:bg-slate-950 border-x border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
      >
        <GripVertical className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
      </div>

      <div className="flex-1 p-4 min-w-0">{right}</div>
    </div>
  );
}

// ─── 6. QuickActionsFAB ───────────────────────────────────────────────────────

export function QuickActionsFAB({
  onNewOrder,
  onOpenPalette,
  onOpenTasks,
  onOpenHelp,
}: {
  onNewOrder: () => void;
  onOpenPalette: () => void;
  onOpenTasks: () => void;
  onOpenHelp: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 end-5 z-30 print:hidden flex flex-col items-end gap-2">
      {open && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 w-48 space-y-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onNewOrder();
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
            <span>New Order</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpenPalette();
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>Command Palette</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpenTasks();
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
          >
            <ListChecks className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Jobs & Queue</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpenHelp();
            }}
            className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            <span>Help & Docs</span>
          </button>
        </div>
      )}

      <button
        type="button"
        aria-label="Quick actions"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {open ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Plus className="w-5 h-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
