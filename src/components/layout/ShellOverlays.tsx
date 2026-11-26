import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Eye,
  Megaphone,
  MessageSquarePlus,
  RefreshCw,
  Send,
  Sparkles,
  WifiOff,
  X,
} from 'lucide-react';
import { useInterval } from '../../hooks/index';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ProgressBar } from '../ui/Progress';

/* ─── 1. Accessibility SkipLink ────────────────────────────────────────────── */
export function SkipLink({ targetId = 'main-content', label = 'Skip to main content' }: { targetId?: string; label?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-slate-900 focus:text-white focus:text-xs focus:font-semibold focus:shadow-lg focus:ring-2 focus:ring-blue-500"
    >
      {label}
    </a>
  );
}

/* ─── 2. Announcement Bar ──────────────────────────────────────────────────── */
export function AnnouncementBar({
  id = 'v1-release',
  badge = 'v1.0.0',
  message = 'Kestrel Admin v1.0 is live with Jalali analytics, RBAC matrix, and JSONViewer.',
  ctaLabel,
  onCtaClick,
}: {
  id?: string;
  badge?: string;
  message?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}) {
  const storageKey = `kestrel_announcement_dismissed:${id}`;
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(storageKey) === '1';
  });

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Global announcement"
      className="bg-slate-900 dark:bg-blue-950/90 text-white px-4 py-2 text-xs flex items-center justify-between gap-3 border-b border-slate-800"
      data-testid="announcement-bar"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Megaphone className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
        <span className="px-1.5 py-0.5 rounded bg-blue-600/30 border border-blue-400/40 text-[10px] font-mono font-semibold text-blue-200 shrink-0">
          {badge}
        </span>
        <span className="truncate text-slate-200">{message}</span>
        {ctaLabel && onCtaClick && (
          <button
            type="button"
            onClick={onCtaClick}
            className="underline underline-offset-2 text-blue-300 hover:text-white font-medium shrink-0 cursor-pointer"
          >
            {ctaLabel}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          setDismissed(true);
          try {
            window.localStorage.setItem(storageKey, '1');
          } catch {
            // ignore
          }
        }}
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ─── 3. Impersonation Banner ──────────────────────────────────────────────── */
export function ImpersonationBanner({
  targetUser,
  targetRole,
  onExit,
}: {
  targetUser: string | null;
  targetRole?: string;
  onExit: () => void;
}) {
  if (!targetUser) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="impersonation-banner"
      className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-medium flex flex-wrap items-center justify-between gap-2 border-b border-amber-600/30"
    >
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>
          Impersonating <strong>{targetUser}</strong>
          {targetRole ? ` (${targetRole})` : ''}. Actions are logged under dual-audit custody.
        </span>
      </div>
      <button
        type="button"
        onClick={onExit}
        className="px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[11px] font-semibold hover:bg-slate-800 cursor-pointer"
      >
        Exit impersonation
      </button>
    </div>
  );
}

/* ─── 4. Workspace / Tenant Switcher ───────────────────────────────────────── */
export interface WorkspaceTenant {
  id: string;
  name: string;
  plan: string;
  region: string;
}

export const DEFAULT_WORKSPACES: WorkspaceTenant[] = [
  { id: 'ws-eu', name: 'Kestrel EU Clearing', plan: 'Enterprise', region: 'eu-west-1' },
  { id: 'ws-mena', name: 'Kestrel MENA Treasury', plan: 'Enterprise', region: 'me-south-1' },
  { id: 'ws-sandbox', name: 'Staging Sandbox', plan: 'Developer', region: 'us-east-1' },
];

export function WorkspaceSwitcher({
  workspaces = DEFAULT_WORKSPACES,
  activeId,
  onChange,
  compact = false,
}: {
  workspaces?: WorkspaceTenant[];
  activeId: string;
  onChange: (workspace: WorkspaceTenant) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  return (
    <div className="relative" data-testid="workspace-switcher">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Switch workspace organization"
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-start hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          {!compact && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {current.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {current.plan} · {current.region}
              </p>
            </div>
          )}
        </div>
        {!compact && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute start-0 mt-1.5 w-60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1.5 z-40 space-y-1">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Workspaces &amp; Tenants
            </p>
            {workspaces.map((ws) => {
              const isSelected = ws.id === current.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    onChange(ws);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-start text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate">{ws.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      {ws.plan} · <span dir="ltr">{ws.region}</span>
                    </p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── 5. Offline / Reconnecting Indicator ──────────────────────────────────── */
export function OfflineReconnectingBanner({
  forceOffline = false,
  onRetry,
}: {
  forceOffline?: boolean;
  onRetry?: () => void;
}) {
  const [browserOffline, setBrowserOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const onOff = () => setBrowserOffline(true);
    const onOn = () => setBrowserOffline(false);
    window.addEventListener('offline', onOff);
    window.addEventListener('online', onOn);
    return () => {
      window.removeEventListener('offline', onOff);
      window.removeEventListener('online', onOn);
    };
  }, []);

  if (!browserOffline && !forceOffline) return null;

  return (
    <div
      role="alert"
      data-testid="offline-reconnecting-banner"
      className="bg-rose-600 text-white px-4 py-2 text-xs flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>
          {reconnecting
            ? 'Attempting to reconnect to Kestrel realtime ledger...'
            : 'Network offline — changes are queued locally until connection returns.'}
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          setReconnecting(true);
          window.setTimeout(() => {
            setReconnecting(false);
            onRetry?.();
          }, 900);
        }}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 font-semibold cursor-pointer"
      >
        <RefreshCw className={`w-3 h-3 ${reconnecting ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span>Retry</span>
      </button>
    </div>
  );
}

/* ─── 6. Session Timeout Modal ─────────────────────────────────────────────── */
export function SessionTimeoutModal({
  open,
  initialSeconds = 120,
  onExtend,
  onSignOut,
}: {
  open: boolean;
  initialSeconds?: number;
  onExtend: () => void;
  onSignOut: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (open) setSecondsLeft(initialSeconds);
  }, [open, initialSeconds]);

  useInterval(
    () => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    },
    open ? 1000 : null
  );

  const mins = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <Modal
      open={open}
      onClose={onExtend}
      title="Session Expiring Soon"
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-semibold">Inactivity security lock in {mins}:{secs}</p>
            <p>Extend your session to keep unsaved ledger edits and active filters intact.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
          <Button variant="primary" size="sm" onClick={onExtend}>
            Keep session active
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── 7. Background Task / Upload Manager ──────────────────────────────────── */
export interface BackgroundTaskItem {
  id: string;
  title: string;
  progress: number;
  status: 'running' | 'completed' | 'error';
  detail?: string;
}

export function BackgroundTaskManager({
  tasks,
  onClearCompleted,
}: {
  tasks: BackgroundTaskItem[];
  onClearCompleted?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  if (tasks.length === 0) return null;

  const runningCount = tasks.filter((t) => t.status === 'running').length;

  return (
    <div
      data-testid="background-task-manager"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
    >
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
          <Activity className={`w-4 h-4 ${runningCount > 0 ? 'text-blue-600 animate-pulse' : 'text-emerald-600'}`} />
          <span>Background Tasks ({runningCount} active)</span>
        </div>
        <div className="flex items-center gap-2">
          {onClearCompleted && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Clear done
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-[11px] text-blue-600 dark:text-blue-400 font-medium cursor-pointer"
          >
            {collapsed ? 'Expand' : 'Minimize'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="p-3 space-y-2.5 max-h-64 overflow-y-auto">
          {tasks.map((task) => (
            <div key={task.id} className="space-y-1 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {task.title}
                </span>
                <span dir="ltr" className="font-mono text-[11px] text-slate-500">
                  {task.progress}%
                </span>
              </div>
              <ProgressBar
                value={task.progress}
                tone={
                  task.status === 'error'
                    ? 'error'
                    : task.status === 'completed'
                      ? 'success'
                      : 'default'
                }
              />
              {task.detail && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{task.detail}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── 8. Product Tour / Coachmarks ─────────────────────────────────────────── */
export interface TourStep {
  id: string;
  title: string;
  description: string;
  badge?: string;
}

export function ProductTourModal({
  open,
  onClose,
  steps,
}: {
  open: boolean;
  onClose: () => void;
  steps: TourStep[];
}) {
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    if (open) setStepIdx(0);
  }, [open]);

  if (!open || steps.length === 0) return null;
  const current = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  return (
    <Modal open={open} onClose={onClose} title="Interactive Product Tour" size="sm">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/40 dark:to-slate-900 border border-blue-200/80 dark:border-blue-800/60 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700 dark:text-blue-300">
            <span className="inline-flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" aria-hidden="true" />
              Step {stepIdx + 1} of {steps.length}
            </span>
            {current.badge && (
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px]">
                {current.badge}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{current.title}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {current.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {steps.map((s, idx) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${
                  idx === stepIdx ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {stepIdx > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStepIdx((i) => i - 1)}>
                Back
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => (isLast ? onClose() : setStepIdx((i) => i + 1))}
            >
              {isLast ? 'Finish Tour' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ─── 9. Feedback Widget ───────────────────────────────────────────────────── */
export function FeedbackWidget({
  onSubmit,
}: {
  onSubmit?: (payload: { sentiment: 'up' | 'neutral' | 'down'; note: string }) => void;
}) {
  const [sentiment, setSentiment] = useState<'up' | 'neutral' | 'down'>('up');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div
      data-testid="feedback-widget"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
          <MessageSquarePlus className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span>Operator Feedback</span>
        </div>
        <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
      </div>

      {sent ? (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <span>Thank you! Feedback logged for product review.</span>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setNote('');
            }}
            className="underline cursor-pointer"
          >
            New note
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.({ sentiment, note });
            setSent(true);
          }}
          className="space-y-2.5"
        >
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'up', label: 'Great' },
                { id: 'neutral', label: 'Okay' },
                { id: 'down', label: 'Needs work' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSentiment(opt.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  sentiment === opt.id
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <textarea
            dir="auto"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Share workflow friction or feature requests..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Internal Ops channel
            </span>
            <Button type="submit" size="sm" variant="primary" leftIcon={<Send className="w-3 h-3" />}>
              Send
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
