import React, {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Home,
  Info,
  RefreshCw,
  WifiOff,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from './Button';
import { Spinner } from './Progress';

// ─── 1. ErrorBoundary ──────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected UI runtime error',
    };
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ResultPage
          status="error"
          title={this.props.fallbackTitle ?? 'Something went wrong'}
          description={this.state.errorMessage}
          primaryLabel="Reload view"
          onPrimaryAction={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

// ─── 2. Loaders & TopLoadingBar ────────────────────────────────────────────────

export function TopLoadingBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      role="progressbar"
      aria-label="Page loading"
      aria-busy="true"
      className="fixed top-0 inset-x-0 z-[70] h-1 bg-blue-100 dark:bg-slate-800 overflow-hidden"
    >
      <div className="h-full w-1/3 bg-blue-600 dark:bg-blue-400 animate-[pulse_1.1s_ease-in-out_infinite] rounded-e-full" />
    </div>
  );
}

export function PageLoader({ label = 'Loading workspace...' }: { label?: string }) {
  return (
    <div
      className="min-h-[260px] flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8"
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </p>
    </div>
  );
}

export function LoadingOverlay({
  active,
  label = 'Processing...',
  children,
}: {
  active: boolean;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {active && (
        <div
          className="absolute inset-0 z-20 rounded-2xl bg-white/75 dark:bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2.5"
          role="status"
          aria-live="polite"
        >
          <Spinner size="md" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── 3. ResultPage, MaintenancePage, OfflinePage ───────────────────────────────

export interface ResultPageProps {
  status: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  primaryLabel?: string;
  onPrimaryAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  extra?: React.ReactNode;
}

export function ResultPage({
  status,
  title,
  description,
  primaryLabel,
  onPrimaryAction,
  secondaryLabel,
  onSecondaryAction,
  extra,
}: ResultPageProps) {
  const iconConfig = {
    success: {
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900',
    },
    error: {
      icon: <XCircle className="w-7 h-7 text-red-600 dark:text-red-400" aria-hidden="true" />,
      bg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900',
    },
    warning: {
      icon: <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" aria-hidden="true" />,
      bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900',
    },
    info: {
      icon: <Info className="w-7 h-7 text-blue-600 dark:text-blue-400" aria-hidden="true" />,
      bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900',
    },
  }[status];

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-12 flex flex-col items-center text-center">
      <div
        className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${iconConfig.bg}`}
      >
        {iconConfig.icon}
      </div>
      <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed">
        {description}
      </p>
      {extra && <div className="mt-4 w-full max-w-md">{extra}</div>}
      {(primaryLabel || secondaryLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {primaryLabel && onPrimaryAction && (
            <Button variant="primary" onClick={onPrimaryAction}>
              {primaryLabel}
            </Button>
          )}
          {secondaryLabel && onSecondaryAction && (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function MaintenancePage({
  eta = '20 minutes',
  onGoHome,
}: {
  eta?: string;
  onGoHome?: () => void;
}) {
  return (
    <div
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-14 flex flex-col items-center text-center"
      data-testid="error-page-maintenance"
    >
      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 flex items-center justify-center mb-4">
        <Wrench className="w-7 h-7 text-amber-600 dark:text-amber-400" aria-hidden="true" />
      </div>
      <span
        dir="ltr"
        className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md border bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 mb-3"
      >
        503 · MAINTENANCE
      </span>
      <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        Scheduled settlement maintenance
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed">
        Ledger indexing and multi-region vault replication are upgrading. Estimated window: {eta}.
      </p>
      {onGoHome && (
        <div className="mt-6">
          <Button variant="primary" leftIcon={<Home className="w-4 h-4" />} onClick={onGoHome}>
            Back to overview
          </Button>
        </div>
      )}
    </div>
  );
}

export function OfflinePage({
  onRetry,
  onGoHome,
}: {
  onRetry?: () => void;
  onGoHome?: () => void;
}) {
  return (
    <div
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-14 flex flex-col items-center text-center"
      data-testid="error-page-offline"
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4">
        <WifiOff className="w-7 h-7 text-slate-700 dark:text-slate-300" aria-hidden="true" />
      </div>
      <span
        dir="ltr"
        className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 mb-3"
      >
        OFFLINE
      </span>
      <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        Network connection unavailable
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed">
        Local cached records remain readable. Reconnect to synchronize pending mutations and audit events.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        {onRetry && (
          <Button variant="primary" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={onRetry}>
            Retry sync
          </Button>
        )}
        {onGoHome && (
          <Button variant="secondary" leftIcon={<Home className="w-4 h-4" />} onClick={onGoHome}>
            Back to overview
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── 4. AlertDialog & TypedConfirmDialog + Promise useConfirm ──────────────────

export interface TypedConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  requiredPhrase?: string;
}

export function TypedConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm action',
  cancelLabel = 'Cancel',
  destructive = true,
  requiredPhrase,
}: TypedConfirmDialogProps) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const phraseMatched =
    !requiredPhrase || typed.trim() === requiredPhrase.trim();

  const dialog = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              destructive
                ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 text-start">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {requiredPhrase && (
          <div className="space-y-1.5">
            <label className="block text-xs text-slate-600 dark:text-slate-300">
              Type{' '}
              <code
                dir="ltr"
                className="font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {requiredPhrase}
              </code>{' '}
              to enable confirmation
            </label>
            <input
              type="text"
              dir="ltr"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requiredPhrase}
              autoFocus
              className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            size="sm"
            disabled={!phraseMatched}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return dialog;
  return createPortal(dialog, document.body);
}

export const AlertDialog = TypedConfirmDialog;

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  requiredPhrase?: string;
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const handleClose = () => {
    if (pending) {
      pending.resolve(false);
      setPending(null);
    }
  };

  const handleConfirm = () => {
    if (pending) {
      pending.resolve(true);
      setPending(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <TypedConfirmDialog
        open={Boolean(pending)}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={pending?.options.title ?? ''}
        message={pending?.options.message ?? ''}
        confirmLabel={pending?.options.confirmLabel}
        cancelLabel={pending?.options.cancelLabel}
        destructive={pending?.options.destructive ?? true}
        requiredPhrase={pending?.options.requiredPhrase}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return async (opts) => Boolean(opts.title);
  }
  return ctx.confirm;
}

// ─── 5. DirectionDrawer (Left / Right / Bottom) ────────────────────────────────

export interface DirectionDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  placement?: 'left' | 'right' | 'bottom';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DirectionDrawer({
  open,
  onClose,
  title,
  description,
  placement = 'right',
  children,
  footer,
}: DirectionDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const panelClasses =
    placement === 'left'
      ? 'fixed inset-y-0 left-0 w-full max-w-md border-e'
      : placement === 'bottom'
        ? 'fixed inset-x-0 bottom-0 w-full max-h-[80vh] rounded-t-3xl border-t'
        : 'fixed inset-y-0 right-0 w-full max-w-md border-s';

  const content = (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        className={`${panelClasses} z-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col`}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="min-w-0 text-start">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}

// ─── 6. DropdownMenu ───────────────────────────────────────────────────────────

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function DropdownMenu({
  trigger,
  items,
  align = 'end',
}: {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          role="menu"
          className={`absolute top-full mt-1.5 z-40 min-w-[200px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 ${
            align === 'end' ? 'end-0' : 'start-0'
          }`}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`w-full px-3 py-2 text-start text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                item.destructive
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                {item.icon}
                <span className="truncate">{item.label}</span>
              </span>
              {item.shortcut && (
                <kbd
                  dir="ltr"
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                >
                  {item.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 7. ContextMenu (Right-Click) ──────────────────────────────────────────────

export function ContextMenu({
  items,
  children,
  className = '',
}: {
  items: DropdownMenuItem[];
  children: React.ReactNode;
  className?: string;
}) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!coords) return;
    const close = () => setCoords(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCoords(null);
    };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [coords]);

  const menu = coords && (
    <div
      role="menu"
      style={{
        left: `${Math.min(coords.x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 220)}px`,
        top: `${Math.min(coords.y, (typeof window !== 'undefined' ? window.innerHeight : 700) - 220)}px`,
      }}
      className="fixed z-[75] min-w-[200px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-1"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            setCoords(null);
            item.onSelect();
          }}
          className={`w-full px-3 py-2 text-start text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer disabled:opacity-45 ${
            item.destructive
              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            {item.icon}
            <span className="truncate">{item.label}</span>
          </span>
          {item.shortcut && (
            <kbd
              dir="ltr"
              className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500"
            >
              {item.shortcut}
            </kbd>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setCoords({ x: e.clientX, y: e.clientY });
      }}
      className={className}
    >
      {children}
      {menu && typeof document !== 'undefined' ? createPortal(menu, document.body) : menu}
    </div>
  );
}

// ─── 8. HoverCard ──────────────────────────────────────────────────────────────

export function HoverCard({
  trigger,
  content,
  align = 'start',
}: {
  trigger: React.ReactNode;
  content: React.ReactNode;
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const cardId = useId();

  const handleEnter = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(true), 120);
  };

  const handleLeave = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(false), 140);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      aria-describedby={open ? cardId : undefined}
    >
      {trigger}
      {open && (
        <div
          id={cardId}
          role="tooltip"
          className={`absolute top-full mt-2 z-40 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-4 text-start ${
            align === 'end' ? 'end-0' : 'start-0'
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
