import React, { useEffect, useId, useRef, useState } from 'react';

export interface TooltipProps {
  content: string;
  placement?: 'top' | 'bottom';
  children: React.ReactNode;
}

export function Tooltip({
  content,
  placement = 'top',
  children,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`pointer-events-none absolute start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-40 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap shadow-lg border border-slate-800 dark:border-slate-700 ${
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}

export interface PopoverProps {
  trigger: React.ReactNode;
  title?: string;
  align?: 'start' | 'end';
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  className?: string;
}

export function Popover({
  trigger,
  title,
  align = 'start',
  children,
  className = '',
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <div
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex"
      >
        {trigger}
      </div>

      {open && (
        <div
          role="dialog"
          className={`absolute top-full mt-2 z-40 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3.5 ${
            align === 'end' ? 'end-0' : 'start-0'
          }`}
        >
          {title && (
            <p className="text-xs font-semibold text-slate-900 dark:text-white pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              {title}
            </p>
          )}
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {typeof children === 'function' ? children(() => setOpen(false)) : children}
          </div>
        </div>
      )}
    </div>
  );
}
