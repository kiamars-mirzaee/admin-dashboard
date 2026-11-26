import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button, type ButtonProps } from './Button';

/* IconButton */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
  variant?: 'secondary' | 'ghost' | 'primary' | 'danger';
  size?: 'sm' | 'md';
}

export function IconButton({
  label,
  icon,
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: IconButtonProps) {
  const dims = size === 'sm' ? 'min-h-[34px] min-w-[34px]' : 'min-h-[40px] min-w-[40px]';
  const styles =
    variant === 'primary'
      ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500'
      : variant === 'danger'
        ? 'bg-red-600 text-white hover:bg-red-700'
        : variant === 'ghost'
          ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800';

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 ${dims} ${styles} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}

/* ButtonGroup & SplitButton */
export function ButtonGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="group"
      className={`inline-flex items-center rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 [&>button]:rounded-none [&>button]:border-0 ${className}`}
    >
      {children}
    </div>
  );
}

export interface SplitButtonAction {
  id: string;
  label: string;
  onClick: () => void;
}

export function SplitButton({
  label,
  onClick,
  actions,
  variant = 'primary',
  size = 'md',
}: {
  label: string;
  onClick: () => void;
  actions: SplitButtonAction[];
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <div className="inline-flex rounded-xl overflow-hidden shadow-xs">
        <Button
          variant={variant}
          size={size}
          onClick={onClick}
          className="rounded-e-none border-e border-white/15 dark:border-slate-800"
        >
          {label}
        </Button>
        <Button
          variant={variant}
          size={size}
          aria-label={`More options for ${label}`}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="rounded-s-none px-2.5"
        >
          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      </div>
      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full mt-1.5 z-40 min-w-[180px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-1"
        >
          {actions.map((act) => (
            <button
              key={act.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                act.onClick();
              }}
              className="w-full px-3 py-2 rounded-lg text-start text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Link & NavLink */
export function AppLink({
  href = '#',
  active = false,
  children,
  onClick,
  className = '',
}: {
  href?: string;
  active?: boolean;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`text-sm font-medium transition-colors hover:underline underline-offset-4 cursor-pointer ${
        active
          ? 'text-blue-600 dark:text-blue-400 font-semibold'
          : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
      } ${className}`}
    >
      {children}
    </a>
  );
}

/* Typography: Heading, Text, Code, Kbd */
export function Heading({
  level = 2,
  children,
  className = '',
}: {
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}) {
  const cls =
    level === 1
      ? 'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white'
      : level === 2
        ? 'text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white'
        : level === 3
          ? 'text-base sm:text-lg font-semibold text-slate-900 dark:text-white'
          : 'text-sm font-semibold text-slate-900 dark:text-white';
  const Tag = `h${level}` as const;
  return <Tag className={`${cls} ${className}`}>{children}</Tag>;
}

export function Text({
  tone = 'default',
  size = 'sm',
  children,
  className = '',
}: {
  tone?: 'default' | 'muted' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'base';
  children: React.ReactNode;
  className?: string;
}) {
  const toneCls =
    tone === 'muted'
      ? 'text-slate-500 dark:text-slate-400'
      : tone === 'danger'
        ? 'text-red-600 dark:text-red-400'
        : tone === 'success'
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-slate-700 dark:text-slate-200';
  const sizeCls = size === 'xs' ? 'text-xs' : size === 'base' ? 'text-base' : 'text-sm';
  return <p className={`${sizeCls} ${toneCls} leading-relaxed ${className}`}>{children}</p>;
}

export function Code({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code
      dir="ltr"
      className={`px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 ${className}`}
    >
      {children}
    </code>
  );
}

export function Kbd({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      dir="ltr"
      className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-200 shadow-[0_1px_0_rgba(0,0,0,0.08)] ${className}`}
    >
      {children}
    </kbd>
  );
}

/* Divider / Separator */
export function Divider({
  label,
  orientation = 'horizontal',
  className = '',
}: {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}) {
  if (orientation === 'vertical') {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={`inline-block w-px self-stretch bg-slate-200 dark:bg-slate-800 ${className}`}
      />
    );
  }
  if (!label) {
    return <hr className={`border-slate-200 dark:border-slate-800 ${className}`} />;
  }
  return (
    <div role="separator" className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

/* IconWrapper */
export function IconWrapper({
  icon,
  tone = 'neutral',
  size = 'md',
}: {
  icon: React.ReactNode;
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  const toneCls =
    tone === 'primary'
      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900'
      : tone === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
        : tone === 'warning'
          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900'
          : tone === 'danger'
            ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  const dim = size === 'sm' ? 'w-8 h-8 rounded-lg' : size === 'lg' ? 'w-12 h-12 rounded-2xl' : 'w-10 h-10 rounded-xl';
  return (
    <span className={`inline-flex items-center justify-center border shrink-0 ${dim} ${toneCls}`}>
      {icon}
    </span>
  );
}

/* Badge / Chip (Removable & Colored) */
export function Badge({
  children,
  tone = 'neutral',
  onRemove,
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  onRemove?: () => void;
  className?: string;
}) {
  const cls =
    tone === 'info'
      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900'
      : tone === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
        : tone === 'warning'
          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
          : tone === 'danger'
            ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-medium whitespace-nowrap ${cls} ${className}`}
    >
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove item"
          className="rounded hover:bg-black/10 dark:hover:bg-white/10 p-0.5 cursor-pointer"
        >
          <X className="w-3 h-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

export const Chip = Badge;

/* Live Telemetry StatusDot */
export function StatusDot({
  label,
  tone = 'success',
  live = false,
}: {
  label: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
  live?: boolean;
}) {
  const dotCls =
    tone === 'success'
      ? 'bg-emerald-500'
      : tone === 'warning'
        ? 'bg-amber-500'
        : tone === 'danger'
          ? 'bg-red-500'
          : 'bg-slate-400';

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
      <span className="relative flex h-2 w-2">
        {live && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotCls}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotCls}`} />
      </span>
      <span>{label}</span>
    </span>
  );
}

/* Card (Header, Body, Footer) */
export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-3 ${className}`}
    >
      {children}
    </div>
  );
}

/* Accordion / Collapsible */
export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export function Accordion({
  items,
  defaultOpenId,
}: {
  items: AccordionItem[];
  defaultOpenId?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? items[0]?.id ?? null);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
      {items.map((item) => {
        const expanded = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpenId(expanded ? null : item.id)}
              className="w-full px-4 py-3.5 flex items-center justify-between gap-2 text-start text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
            >
              <span>{item.title}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {expanded && (
              <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ScrollArea */
export function ScrollArea({
  children,
  maxHeight = '240px',
  className = '',
}: {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}) {
  return (
    <div
      style={{ maxHeight }}
      className={`overflow-y-auto pe-1 [scrollbar-width:thin] [scrollbar-color:rgb(148_163_184_/_0.45)_transparent] ${className}`}
    >
      {children}
    </div>
  );
}

/* AspectRatio */
export function AspectRatio({
  ratio = 16 / 9,
  children,
  className = '',
}: {
  ratio?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      style={{ aspectRatio: String(ratio) }}
      className={`relative w-full overflow-hidden rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}

/* VisuallyHidden */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
