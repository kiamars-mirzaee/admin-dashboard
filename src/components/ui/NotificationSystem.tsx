import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Info,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import type {
  NotificationCategory,
  NotificationItem,
  ToastMessage,
} from '../../types/admin';
import { INITIAL_NOTIFICATIONS } from '../../data/seedData';
import { AdaptiveDrawer } from './AdaptiveDrawer';
import { Button } from './Button';
import { SegmentedControl } from './SegmentedControl';
import { EmptyState } from './EmptyState';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  toasts: ToastMessage[];
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  pushNotification: (
    item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>
  ) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 4));
      window.setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  const pushNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
      const id = `NTF-${Date.now().toString().slice(-4)}`;
      const next: NotificationItem = {
        ...item,
        id,
        timestamp: 'Just now',
        read: false,
      };
      setNotifications((prev) => [next, ...prev]);
      addToast({
        title: item.title,
        description: item.message,
        variant: item.severity,
      });
    },
    [addToast]
  );

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      toasts,
      drawerOpen,
      setDrawerOpen,
      addToast,
      dismissToast,
      pushNotification,
      markRead,
      markAllRead,
      dismissNotification,
    }),
    [
      notifications,
      unreadCount,
      toasts,
      drawerOpen,
      addToast,
      dismissToast,
      pushNotification,
      markRead,
      markAllRead,
      dismissNotification,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
}

import { useI18n } from '../../i18n/I18nContext';

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  const iconFor = (variant: ToastMessage['variant']) => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'error':
        return <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />;
    }
  };

  return (
    <div
      aria-live="polite"
      aria-label="Live notifications"
      className="fixed z-50 top-16 start-3 end-3 sm:top-auto sm:bottom-5 sm:start-auto sm:end-5 sm:w-96 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-3.5 flex items-start gap-3"
        >
          <div className="pt-0.5">{iconFor(t.variant)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {t.title}
            </p>
            {t.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {t.description}
              </p>
            )}
            {t.actionLabel && t.onAction && (
              <button
                type="button"
                onClick={() => {
                  t.onAction?.();
                  onDismiss(t.id);
                }}
                className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {t.actionLabel}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label={`Dismiss ${t.title}`}
            className="min-h-[32px] min-w-[32px] -me-1 -mt-1 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function NotificationDrawer({
  onInspectOrder,
}: {
  onInspectOrder?: (orderId: string) => void;
}) {
  const { t } = useI18n();
  const {
    notifications,
    unreadCount,
    drawerOpen,
    setDrawerOpen,
    markRead,
    markAllRead,
    dismissNotification,
    pushNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'alerts')
      return n.severity === 'warning' || n.severity === 'error';
    return true;
  });

  const severityIcon = (item: NotificationItem) => {
    switch (item.severity) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'error':
        return <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const categoryLabel: Record<NotificationCategory, string> = {
    order: t('catOrders'),
    security: t('catRisk'),
    system: t('catSystem'),
    billing: t('catBilling'),
  };

  return (
    <AdaptiveDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      title={t('notificationsTitle')}
      subtitle={t('unreadCountLabel', { count: unreadCount })}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              pushNotification({
                title: 'New high-priority settlement',
                message: 'Manual wire verification queued for $3,800.',
                category: 'billing',
                severity: 'info',
              })
            }
          >
            {t('simulateAlert')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Check className="w-4 h-4" />}
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            {t('markAllRead')}
          </Button>
        </div>
      }
    >
      <SegmentedControl
        ariaLabel={t('notificationsTitle')}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('all'), count: notifications.length },
          { value: 'unread', label: t('tabUnread'), count: unreadCount },
          {
            value: 'alerts',
            label: t('tabAlerts'),
            count: notifications.filter(
              (n) => n.severity === 'warning' || n.severity === 'error'
            ).length,
          },
        ]}
        className="w-full"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-5 h-5" />}
          title={t('allCaughtUp')}
          description={t('noNotificationsMatch')}
          actionLabel={filter !== 'all' ? t('viewAllNotifications') : undefined}
          onAction={() => setFilter('all')}
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`py-3.5 flex items-start gap-3 ${
                !item.read ? 'opacity-100' : 'opacity-75'
              }`}
            >
              <div className="mt-0.5 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                {severityIcon(item)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {item.title}
                  </p>
                  {!item.read && (
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                      {t('badgeNew')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {item.message}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                  <span>{categoryLabel[item.category]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.timestamp}</span>
                  {item.relatedOrderId && onInspectOrder && (
                    <>
                      <span aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          markRead(item.id);
                          setDrawerOpen(false);
                          onInspectOrder(item.relatedOrderId!);
                        }}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                      >
                        {t('openOrderLink', { id: item.relatedOrderId })}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {!item.read && (
                  <button
                    type="button"
                    onClick={() => markRead(item.id)}
                    aria-label={`Mark "${item.title}" as read`}
                    className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismissNotification(item.id)}
                  aria-label={`Dismiss "${item.title}"`}
                  className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdaptiveDrawer>
  );
}
