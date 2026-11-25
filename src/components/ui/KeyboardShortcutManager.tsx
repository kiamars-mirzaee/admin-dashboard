import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Keyboard } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import {
  GLOBAL_SHORTCUTS,
  isCommandPaletteChord,
  isEditableTarget,
  normalizeKeyEvent,
  resolveShortcutSequence,
  type ShortcutDefinition,
  type ShortcutId,
} from '../../utils/shortcuts';
import { Modal } from './Modal';
import { Button } from './Button';

interface ShortcutContextValue {
  pendingPrefix: string | null;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  shortcuts: ShortcutDefinition[];
  triggerShortcut: (id: ShortcutId) => void;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

export function useShortcuts(): ShortcutContextValue {
  const ctx = useContext(ShortcutContext);
  if (!ctx) {
    throw new Error('useShortcuts must be used within ShortcutProvider');
  }
  return ctx;
}

export interface ShortcutProviderProps {
  onTriggerShortcut: (id: Exclude<ShortcutId, 'open-help'>) => void;
  children: React.ReactNode;
}

export function ShortcutProvider({
  onTriggerShortcut,
  children,
}: ShortcutProviderProps) {
  const { t } = useI18n();
  const [pendingPrefix, setPendingPrefix] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const pendingPrefixRef = useRef<string | null>(null);
  const clearTimerRef = useRef<number | null>(null);

  const clearPendingPrefix = useCallback(() => {
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    pendingPrefixRef.current = null;
    setPendingPrefix(null);
  }, []);

  const armPendingPrefix = useCallback(
    (prefix: string) => {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
      }
      pendingPrefixRef.current = prefix;
      setPendingPrefix(prefix);
      clearTimerRef.current = window.setTimeout(() => {
        pendingPrefixRef.current = null;
        setPendingPrefix(null);
        clearTimerRef.current = null;
      }, 1300);
    },
    []
  );

  const triggerShortcut = useCallback(
    (id: ShortcutId) => {
      clearPendingPrefix();
      if (id === 'open-help') {
        setHelpOpen((prev) => !prev);
        return;
      }
      if (id !== 'toggle-theme') {
        setHelpOpen(false);
      }
      onTriggerShortcut(id);
    },
    [clearPendingPrefix, onTriggerShortcut]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      if (isCommandPaletteChord(event)) {
        event.preventDefault();
        triggerShortcut('open-command-palette');
        return;
      }

      if (
        isEditableTarget(event.target as HTMLElement | null) ||
        isEditableTarget(document.activeElement as HTMLElement | null)
      ) {
        return;
      }

      const normalized = normalizeKeyEvent(event);
      if (!normalized) return;

      const resolution = resolveShortcutSequence(
        pendingPrefixRef.current,
        normalized,
        GLOBAL_SHORTCUTS
      );

      if (resolution.matchedId) {
        event.preventDefault();
        triggerShortcut(resolution.matchedId);
        return;
      }

      if (resolution.nextPrefix) {
        event.preventDefault();
        armPendingPrefix(resolution.nextPrefix);
        return;
      }

      if (pendingPrefixRef.current !== null) {
        clearPendingPrefix();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
      }
    };
  }, [armPendingPrefix, clearPendingPrefix, triggerShortcut]);

  const value = useMemo(
    () => ({
      pendingPrefix,
      helpOpen,
      setHelpOpen,
      shortcuts: GLOBAL_SHORTCUTS,
      triggerShortcut,
    }),
    [pendingPrefix, helpOpen, triggerShortcut]
  );

  return (
    <ShortcutContext.Provider value={value}>
      {children}

      {/* Pending Multi-Key Chord HUD */}
      {pendingPrefix && (
        <div
          role="status"
          aria-live="polite"
          data-testid="shortcut-chord-hud"
          className="fixed bottom-20 lg:bottom-5 start-4 z-50 px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 shadow-xl flex items-center gap-2.5 pointer-events-none"
        >
          <kbd
            dir="ltr"
            className="min-w-[26px] h-6 px-1.5 rounded-md bg-slate-800 dark:bg-slate-900 border border-slate-600 font-mono text-xs font-bold uppercase flex items-center justify-center text-white"
          >
            {pendingPrefix}
          </kbd>
          <span className="text-xs font-medium text-slate-200">
            {t('shortcutsPressPrefix')}…
          </span>
        </div>
      )}

      <KeyboardShortcutsModal />
    </ShortcutContext.Provider>
  );
}

function KeyCapSequence({ keys }: { keys: string[] }) {
  const { t } = useI18n();
  return (
    <span dir="ltr" className="inline-flex items-center gap-1 shrink-0">
      {keys.map((key, idx) => (
        <React.Fragment key={`${key}-${idx}`}>
          {idx > 0 && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 px-0.5">
              {t('shortcutsThen')}
            </span>
          )}
          <kbd className="min-w-[26px] h-6 px-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-[0_1px_0_0_rgba(15,23,42,0.12)] font-mono text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center justify-center">
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  );
}

export function KeyboardShortcutsModal() {
  const { t } = useI18n();
  const { helpOpen, setHelpOpen, shortcuts, triggerShortcut } = useShortcuts();

  const navigationShortcuts = shortcuts.filter((s) => s.category === 'navigation');
  const actionShortcuts = shortcuts.filter((s) => s.category === 'actions');

  return (
    <Modal
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      title={t('shortcutsTitle')}
      description={t('shortcutsSubtitle')}
      size="md"
      footer={
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{t('shortcutsHintFooter')}</span>
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setHelpOpen(false)}
            className="w-full sm:w-auto"
          >
            {t('close')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('shortcutsGroupNav')}
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {navigationShortcuts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => triggerShortcut(item.id)}
                className="w-full min-h-[44px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-start bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {t(item.labelKey)}
                </span>
                <KeyCapSequence keys={item.displayKeys} />
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('shortcutsGroupActions')}
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {actionShortcuts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => triggerShortcut(item.id)}
                className="w-full min-h-[44px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-start bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {t(item.labelKey)}
                </span>
                <KeyCapSequence keys={item.displayKeys} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}
