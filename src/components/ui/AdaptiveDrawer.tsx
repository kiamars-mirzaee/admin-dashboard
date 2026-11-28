import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface AdaptiveDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  disableEscapeClose?: boolean;
}

export function AdaptiveDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  disableEscapeClose = false,
}: AdaptiveDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableEscapeClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, disableEscapeClose]);

  if (!open) return null;

  const widthClass =
    size === 'sm'
      ? 'md:max-w-sm'
      : size === 'lg'
        ? 'md:max-w-xl'
        : 'md:max-w-md';

  const content = (
    <div
      data-print-drawer-root="true"
      className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close overlay"
        data-print-drawer-backdrop="true"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] transition-opacity cursor-default"
      />

      {/* Mobile Bottom Sheet / Desktop Right/Start Slide-Over */}
      <div
        data-print-drawer-panel="true"
        className={`relative z-10 w-full ${widthClass} bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-s border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-none shadow-2xl flex flex-col max-h-[88dvh] md:max-h-full md:h-full transition-transform duration-200`}
      >
        {/* Mobile grab handle */}
        <div data-print-hide="true" className="md:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Sticky Header */}
        <div
          data-print-drawer-header="true"
          className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0"
        >
          <div className="min-w-0 text-start">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            data-print-drawer-close="true"
            aria-label={`Close ${title}`}
            className="min-h-[44px] min-w-[44px] -me-2 -mt-1 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div data-print-drawer-body="true" className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div
            data-print-drawer-footer="true"
            className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/95 shrink-0"
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
}
