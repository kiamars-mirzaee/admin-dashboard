import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CustomerProfile,
  NavRouteId,
  OrderFilters,
  OrderRecord,
  OrderStatus,
} from './types/admin';
import {
  DEFAULT_ORDER_FILTERS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
} from './data/seedData';
import { buildAdminNavTree, getSectionForRoute } from './utils/navTree';
import { resolveGroupTargetRoute } from './utils/breadcrumbs';
import type { CommandPaletteItem } from './utils/commandPalette';
import {
  DEFAULT_QUICK_FAVORITES,
  FAVORITES_STORAGE_KEY,
  MAX_FAVORITE_PINS,
  type FavoritePin,
  createCustomerPin,
  createOrderPin,
  createViewPin,
  getCustomerPinId,
  getOrderPinId,
  isPinned,
  pruneDeletedOrderPins,
  removeFavoritePin,
  resolveViewPinLabel,
  sanitizeStoredFavorites,
  toggleFavoritePin,
} from './utils/favorites';
import type { ShortcutId } from './utils/shortcuts';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { CommandPalette } from './components/ui/CommandPalette';
import { ShortcutProvider } from './components/ui/KeyboardShortcutManager';
import { ConfirmModal } from './components/ui/Modal';
import { QrScannerModal } from './components/ui/QrCodeScanner';
import {
  NotificationDrawer,
  NotificationProvider,
  useNotifications,
} from './components/ui/NotificationSystem';
import { AppShell } from './components/layout/AppShell';
import { FavoritesBar } from './components/layout/FavoritesBar';
import { OverviewView } from './components/views/OverviewView';
import { OrdersView } from './components/views/OrdersView';
import {
  type CustomerFilterMode,
  CustomersView,
} from './components/views/CustomersView';
import {
  type ComponentKitCategory,
  ComponentKitView,
} from './components/views/ComponentKitView';
import { FileStorageView } from './components/views/FileStorageView';
import { KanbanView } from './components/views/KanbanView';
import { ReportsView } from './components/views/ReportsView';
import { OrderDetailPageView } from './components/views/OrderDetailPageView';
import { OrderFormPageView } from './components/views/OrderFormPageView';
import { AccessControlView } from './components/views/AccessControlView';
import { AuditLogView } from './components/views/AuditLogView';
import { SettingsView } from './components/views/SettingsView';
import { AuthErrorShowcaseView } from './components/views/AuthErrorShowcaseView';
import { OperationsHubView } from './components/views/OperationsHubView';
import { OperationsTasksView } from './components/views/OperationsTasksView';
import { DEFAULT_WORKSPACES } from './components/layout/ShellOverlays';
import { ConfirmProvider, ErrorBoundary } from './components/ui/OverlayExtras';
import { PermissionProvider } from './components/ui/SharedComposites';
import { QuickActionsFAB } from './components/ui/LayoutPrimitives';
import { OrderDetailDrawer } from './components/dashboard/OrderDetailDrawer';
import { CreateOrderModal } from './components/dashboard/CreateOrderModal';

function loadInitialFavorites(): FavoritePin[] {
  if (typeof window === 'undefined') return DEFAULT_QUICK_FAVORITES;
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return DEFAULT_QUICK_FAVORITES;
    const parsed: unknown = JSON.parse(raw);
    const sanitized = sanitizeStoredFavorites(parsed);
    return sanitized ?? DEFAULT_QUICK_FAVORITES;
  } catch {
    return DEFAULT_QUICK_FAVORITES;
  }
}

function DashboardWorkspace() {
  const { t, tStatus } = useI18n();
  const { drawerOpen, setDrawerOpen, addToast, pushNotification } =
    useNotifications();

  const [activeRoute, setActiveRoute] = useState<NavRouteId>('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [orderFilters, setOrderFilters] =
    useState<OrderFilters>(DEFAULT_ORDER_FILTERS);
  const [customerFilterMode, setCustomerFilterMode] =
    useState<CustomerFilterMode>('all');
  const [componentCategory, setComponentCategory] =
    useState<ComponentKitCategory>('all');
  const [inspectedOrderId, setInspectedOrderId] = useState<string | null>(null);
  const [detailPageOrderId, setDetailPageOrderId] = useState<string | null>(null);
  const [editingPageOrderId, setEditingPageOrderId] = useState<string | null>(null);
  const [orderFormDirty, setOrderFormDirty] = useState(false);
  const [pendingNavRoute, setPendingNavRoute] = useState<NavRouteId | null>(null);
  const [inspectedCustomerId, setInspectedCustomerId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [gridRefreshKey, setGridRefreshKey] = useState(0);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(DEFAULT_WORKSPACES[0].id);
  const [impersonatedUser, setImpersonatedUser] = useState<{ name: string; role: string } | null>(null);
  const [recentRouteIds, setRecentRouteIds] = useState<NavRouteId[]>(['orders-all', 'reports']);
  const [favoritePins, setFavoritePins] = useState<FavoritePin[]>(
    loadInitialFavorites
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoritePins)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [favoritePins]);

  // Warn browser tab unload when full-page form has unsaved edits
  useEffect(() => {
    if (!orderFormDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [orderFormDirty]);

  const syncOrdersFromServer = useCallback(async () => {
    try {
      const res = await fetch('/api/orders/all');
      if (res.ok) {
        const data = (await res.json()) as { orders?: OrderRecord[] };
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    } catch {
      // Keep current state if offline
    }
  }, []);

  useEffect(() => {
    void syncOrdersFromServer();
  }, [syncOrdersFromServer]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const applyNavigationNow = useCallback((route: NavRouteId) => {
    const resolved = resolveGroupTargetRoute(route);
    setActiveRoute(resolved);
    setRecentRouteIds((prev) => [resolved, ...prev.filter((r) => r !== resolved)].slice(0, 4));
    setInspectedOrderId(null);
    setInspectedCustomerId(null);
    switch (resolved) {
      case 'orders-all':
        setOrderFilters(DEFAULT_ORDER_FILTERS);
        break;
      case 'orders-flagged':
        setOrderFilters({ ...DEFAULT_ORDER_FILTERS, statuses: ['Flagged'] });
        break;
      case 'orders-pending':
        setOrderFilters({
          ...DEFAULT_ORDER_FILTERS,
          statuses: ['Pending', 'Processing'],
        });
        break;
      case 'customers-all':
        setCustomerFilterMode('all');
        break;
      case 'customers-enterprise':
        setCustomerFilterMode('Enterprise');
        break;
      case 'customers-risk':
        setCustomerFilterMode('risk');
        break;
      case 'components-all':
        setComponentCategory('all');
        break;
      case 'components-inputs':
        setComponentCategory('inputs');
        break;
      case 'components-workflows':
        setComponentCategory('workflows');
        break;
      case 'components-overlays':
        setComponentCategory('overlays');
        break;
      case 'components-charts':
        setComponentCategory('charts');
        break;
      case 'components-states':
        setComponentCategory('states');
        break;
      default:
        break;
    }
  }, []);

  const handleNavigate = useCallback(
    (route: NavRouteId) => {
      const resolved = resolveGroupTargetRoute(route);
      if (
        activeRoute === 'order-editor' &&
        orderFormDirty &&
        resolved !== 'order-editor'
      ) {
        setPendingNavRoute(resolved);
        return;
      }
      applyNavigationNow(resolved);
    },
    [activeRoute, orderFormDirty, applyNavigationNow]
  );

  const handleGlobalShortcut = useCallback(
    (id: Exclude<ShortcutId, 'open-help'>) => {
      switch (id) {
        case 'nav-overview':
          setDrawerOpen(false);
          handleNavigate('overview');
          break;
        case 'nav-orders':
          setDrawerOpen(false);
          handleNavigate('orders-all');
          break;
        case 'nav-flagged':
          setDrawerOpen(false);
          handleNavigate('orders-flagged');
          break;
        case 'nav-customers':
          setDrawerOpen(false);
          handleNavigate('customers-all');
          break;
        case 'nav-storage':
          setDrawerOpen(false);
          handleNavigate('storage');
          break;
        case 'nav-components':
          setDrawerOpen(false);
          handleNavigate('components-all');
          break;
        case 'toggle-notifications':
          setDrawerOpen(!drawerOpen);
          break;
        case 'new-order':
          setDrawerOpen(false);
          setCreateModalOpen(true);
          break;
        case 'toggle-theme':
          setDarkMode((d) => !d);
          break;
        case 'open-command-palette':
          setDrawerOpen(false);
          setQrScannerOpen(false);
          setCommandPaletteOpen((open) => !open);
          break;
        case 'open-qr-scanner':
          setDrawerOpen(false);
          setCommandPaletteOpen(false);
          setQrScannerOpen((open) => !open);
          break;
      }
    },
    [drawerOpen, handleNavigate, setDrawerOpen]
  );

  const inspectedOrder = useMemo(
    () => orders.find((o) => o.id === inspectedOrderId) ?? null,
    [orders, inspectedOrderId]
  );

  const inspectedCustomer = useMemo(
    () =>
      inspectedCustomerId
        ? INITIAL_CUSTOMERS.find((c) => c.id === inspectedCustomerId) ?? null
        : null,
    [inspectedCustomerId]
  );

  const flaggedCount = useMemo(
    () => orders.filter((o) => o.status === 'Flagged').length,
    [orders]
  );

  const pendingCount = useMemo(
    () =>
      orders.filter((o) => o.status === 'Pending' || o.status === 'Processing')
        .length,
    [orders]
  );

  const atRiskCustomersCount = useMemo(
    () => INITIAL_CUSTOMERS.filter((c) => c.healthStatus !== 'Healthy').length,
    []
  );

  const navTreeForPalette = useMemo(
    () =>
      buildAdminNavTree(
        {
          flaggedOrders: flaggedCount,
          pendingOrders: pendingCount,
          atRiskCustomers: atRiskCustomersCount,
        },
        t
      ),
    [flaggedCount, pendingCount, atRiskCustomersCount, t]
  );

  const handleSelectCommandItem = useCallback(
    (item: CommandPaletteItem) => {
      if (item.type === 'order' && item.entityId) {
        handleNavigate('orders-all');
        setInspectedOrderId(item.entityId);
        return;
      }
      if (item.type === 'customer' && item.entityId) {
        handleNavigate('customers-all');
        setInspectedCustomerId(item.entityId);
        return;
      }
      handleNavigate(item.routeId);
      if (item.anchorId) {
        window.setTimeout(() => {
          const el = document.getElementById(item.anchorId!);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
    },
    [handleNavigate]
  );

  const activeSection = getSectionForRoute(activeRoute);

  const handleCustomerFilterChange = (mode: CustomerFilterMode) => {
    setCustomerFilterMode(mode);
    if (mode === 'Enterprise') setActiveRoute('customers-enterprise');
    else if (mode === 'risk') setActiveRoute('customers-risk');
    else setActiveRoute('customers-all');
  };

  const handleComponentCategoryChange = (cat: ComponentKitCategory) => {
    setComponentCategory(cat);
    if (cat === 'inputs') setActiveRoute('components-inputs');
    else if (cat === 'workflows') setActiveRoute('components-workflows');
    else if (cat === 'overlays') setActiveRoute('components-overlays');
    else if (cat === 'charts') setActiveRoute('components-charts');
    else if (cat === 'states') setActiveRoute('components-states');
    else setActiveRoute('components-all');
  };

  const handleUpdateOrder = async (
    id: string,
    updates: Partial<OrderRecord>
  ) => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await syncOrdersFromServer();
        setGridRefreshKey((k) => k + 1);
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
        );
      }
    } catch {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
      );
    }
    addToast({
      title: `Updated ${id}`,
      description: updates.status
        ? `Status → ${tStatus(updates.status)}`
        : 'Changes saved.',
      variant: 'success',
    });
  };

  const handleRestoreDeletedOrder = useCallback(
    async (snapshot: OrderRecord) => {
      try {
        const res = await fetch('/api/orders/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snapshot),
        });
        if (res.ok) {
          await syncOrdersFromServer();
          setGridRefreshKey((k) => k + 1);
        } else {
          setOrders((prev) => [snapshot, ...prev]);
        }
      } catch {
        setOrders((prev) => [snapshot, ...prev]);
      }
      addToast({
        title: t('restoredOrderToast', { id: snapshot.id }),
        variant: 'success',
      });
    },
    [syncOrdersFromServer, addToast, t]
  );

  const handleDeleteOrder = async (id: string) => {
    const snapshot = orders.find((o) => o.id === id);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await syncOrdersFromServer();
        setGridRefreshKey((k) => k + 1);
      } else {
        setOrders((prev) => prev.filter((o) => o.id !== id));
      }
    } catch {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }
    setFavoritePins((prev) =>
      pruneDeletedOrderPins(
        prev,
        orders.filter((o) => o.id !== id).map((o) => o.id)
      )
    );
    addToast({
      title: `Deleted ${id}`,
      description: 'Order removed from the ledger.',
      variant: 'warning',
      actionLabel: snapshot ? t('undoAction') : undefined,
      onAction: snapshot ? () => void handleRestoreDeletedOrder(snapshot) : undefined,
    });
  };

  const handleCreateOrder = async (payload: Omit<OrderRecord, 'id'>) => {
    let created: OrderRecord | null = null;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          seatsCount: 5,
          cutoverAt: `${payload.date}T14:30`,
          updatedBy: 'Elena Rostova',
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { row: OrderRecord };
        created = data.row;
        await syncOrdersFromServer();
        setGridRefreshKey((k) => k + 1);
      }
    } catch {
      // Fallback below
    }
    if (!created) {
      const nextNum = 8493 + orders.length - INITIAL_ORDERS.length;
      created = { ...payload, id: `ORD-${nextNum}` };
      setOrders((prev) => [created!, ...prev]);
    }
    pushNotification({
      title: `Created ${created.id}`,
      message: `${created.customerName} (${created.company}) added for $${created.amount.toLocaleString()}.`,
      category: 'order',
      severity: 'success',
      relatedOrderId: created.id,
    });
    handleNavigate('orders-all');
  };

  const handleInspectById = (orderId: string) => {
    const exists = orders.some((o) => o.id === orderId);
    if (exists) {
      setInspectedOrderId(orderId);
    } else {
      addToast({
        title: `${orderId} not found`,
        description: 'This order may have been deleted.',
        variant: 'warning',
      });
    }
  };

  const handleApplyPinToggle = useCallback(
    (candidate: FavoritePin, displayLabel: string) => {
      const result = toggleFavoritePin(favoritePins, candidate, MAX_FAVORITE_PINS);
      if (result.action === 'limit_reached') {
        addToast({
          title: t('favLimitToast', { max: MAX_FAVORITE_PINS }),
          variant: 'warning',
        });
        return;
      }
      setFavoritePins(result.pins);
      addToast({
        title:
          result.action === 'added'
            ? t('favPinnedToast', { label: displayLabel })
            : t('favUnpinnedToast', { label: displayLabel }),
        variant: result.action === 'added' ? 'success' : 'info',
      });
    },
    [favoritePins, addToast, t]
  );

  const handleToggleCurrentViewPin = useCallback(() => {
    const label = resolveViewPinLabel(
      activeRoute,
      navTreeForPalette,
      t('navOverview')
    );
    handleApplyPinToggle(createViewPin(activeRoute, label), label);
  }, [activeRoute, navTreeForPalette, t, handleApplyPinToggle]);

  const handleToggleOrderPin = useCallback(
    (order: OrderRecord) => {
      handleApplyPinToggle(
        createOrderPin(order.id, order.company),
        order.id
      );
    },
    [handleApplyPinToggle]
  );

  const handleToggleCustomerPin = useCallback(
    (customer: CustomerProfile) => {
      handleApplyPinToggle(
        createCustomerPin(customer.id, customer.name, customer.company),
        customer.name
      );
    },
    [handleApplyPinToggle]
  );

  const handleRemovePin = useCallback(
    (pinId: string) => {
      const target = favoritePins.find((p) => p.id === pinId);
      setFavoritePins((prev) => removeFavoritePin(prev, pinId));
      if (target) {
        const displayLabel =
          target.kind === 'view'
            ? resolveViewPinLabel(
                target.routeId,
                navTreeForPalette,
                target.label
              )
            : target.label;
        addToast({
          title: t('favUnpinnedToast', { label: displayLabel }),
          variant: 'info',
        });
      }
    },
    [favoritePins, navTreeForPalette, addToast, t]
  );

  const handleSelectFavoritePin = useCallback(
    (pin: FavoritePin) => {
      if (pin.kind === 'view') {
        handleNavigate(pin.routeId);
        return;
      }
      if (pin.kind === 'order') {
        const exists = orders.some((o) => o.id === pin.orderId);
        if (!exists) {
          setFavoritePins((prev) => removeFavoritePin(prev, pin.id));
          addToast({
            title: `${pin.orderId} not found`,
            description: 'This order may have been deleted.',
            variant: 'warning',
          });
          return;
        }
        handleNavigate('orders-all');
        setInspectedOrderId(pin.orderId);
        return;
      }
      const customerExists = INITIAL_CUSTOMERS.some(
        (c) => c.id === pin.customerId
      );
      if (!customerExists) {
        setFavoritePins((prev) => removeFavoritePin(prev, pin.id));
        return;
      }
      handleNavigate('customers-all');
      setInspectedCustomerId(pin.customerId);
    },
    [handleNavigate, orders, addToast]
  );

  return (
    <ShortcutProvider onTriggerShortcut={handleGlobalShortcut}>
      <AppShell
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onOpenNewOrder={() => setCreateModalOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenQrScanner={() => setQrScannerOpen(true)}
        flaggedCount={flaggedCount}
        pendingCount={pendingCount}
        atRiskCustomersCount={atRiskCustomersCount}
        inspectedItemLabel={
          inspectedOrder?.id ?? inspectedCustomer?.name ?? null
        }
        onClearInspectedItem={() => {
          setInspectedOrderId(null);
          setInspectedCustomerId(null);
        }}
        activeWorkspaceId={activeWorkspaceId}
        onChangeWorkspace={(ws) => {
          setActiveWorkspaceId(ws.id);
          addToast({
            title: `Switched workspace to ${ws.name}`,
            description: `${ws.plan} · ${ws.region}`,
            variant: 'info',
          });
        }}
        impersonatedUser={impersonatedUser}
        onStartImpersonation={() => {
          setImpersonatedUser({ name: 'Sara Mohammadi', role: 'Operations Lead' });
          addToast({
            title: 'Impersonation session active',
            description: 'Viewing workspace as Sara Mohammadi.',
            variant: 'warning',
          });
        }}
        onExitImpersonation={() => {
          setImpersonatedUser(null);
          addToast({ title: 'Returned to Elena Rostova session', variant: 'success' });
        }}
        quickAccessBar={
          <FavoritesBar
            pins={favoritePins}
            navTree={navTreeForPalette}
            activeRoute={activeRoute}
            inspectedOrderId={inspectedOrderId}
            inspectedCustomerId={inspectedCustomerId}
            orders={orders}
            customers={INITIAL_CUSTOMERS}
            onSelectPin={handleSelectFavoritePin}
            onRemovePin={handleRemovePin}
            onToggleCurrentView={handleToggleCurrentViewPin}
            onToggleOrderPin={handleToggleOrderPin}
            onToggleCustomerPin={handleToggleCustomerPin}
            onResetDefaults={() => setFavoritePins(DEFAULT_QUICK_FAVORITES)}
            recentRoutes={recentRouteIds
              .filter((r) => r !== activeRoute)
              .slice(0, 3)
              .map((r) => ({
                routeId: r,
                label: resolveViewPinLabel(r, navTreeForPalette, r),
              }))}
            onSelectRecentRoute={handleNavigate}
          />
        }
      >
        {activeSection === 'overview' && (
          <OverviewView
            orders={orders}
            onInspectOrder={(o) => setInspectedOrderId(o.id)}
            onViewAllOrders={() => handleNavigate('orders-all')}
            onFilterFlagged={() => handleNavigate('orders-flagged')}
          />
        )}

        {activeRoute === 'order-detail' && (
          <OrderDetailPageView
            orders={orders}
            selectedOrderId={detailPageOrderId}
            onSelectOrderId={setDetailPageOrderId}
            onBackToOrders={() => handleNavigate('orders-all')}
            onOpenQuickDrawer={(o) => setInspectedOrderId(o.id)}
            onUpdateOrder={(id, updates) => void handleUpdateOrder(id, updates)}
            onOpenEditorPage={(o) => {
              setEditingPageOrderId(o.id);
              handleNavigate('order-editor');
            }}
          />
        )}

        {activeRoute === 'order-editor' && (
          <OrderFormPageView
            orders={orders}
            editingOrderId={editingPageOrderId}
            onDirtyChange={setOrderFormDirty}
            onBackToOrders={() => handleNavigate('orders-all')}
            onCreateOrder={handleCreateOrder}
            onUpdateOrder={handleUpdateOrder}
          />
        )}

        {activeSection === 'orders' &&
          activeRoute !== 'order-detail' &&
          activeRoute !== 'order-editor' && (
            <OrdersView
              filters={orderFilters}
              refreshKey={gridRefreshKey}
              onInspectOrder={(o) => setInspectedOrderId(o.id)}
              onDataMutated={() => void syncOrdersFromServer()}
            />
          )}

        {activeSection === 'kanban' && (
          <KanbanView
            orders={orders}
            onUpdateOrderStatus={(id, status: OrderStatus) =>
              void handleUpdateOrder(id, { status })
            }
            onInspectOrder={(o) => setInspectedOrderId(o.id)}
            onCreateNewOrder={() => {
              setEditingPageOrderId(null);
              handleNavigate('order-editor');
            }}
          />
        )}

        {activeSection === 'customers' && (
          <CustomersView
            orders={orders}
            onInspectOrder={(o) => setInspectedOrderId(o.id)}
            filterMode={customerFilterMode}
            onChangeFilterMode={handleCustomerFilterChange}
            inspectedCustomerId={inspectedCustomerId}
            onInspectCustomerChange={setInspectedCustomerId}
            isCustomerPinned={(id) =>
              isPinned(favoritePins, getCustomerPinId(id))
            }
            onTogglePinCustomer={handleToggleCustomerPin}
          />
        )}

        {activeSection === 'reports' && <ReportsView orders={orders} />}

        {activeSection === 'audit' && <AuditLogView />}

        {activeSection === 'access' && <AccessControlView />}

        {activeSection === 'settings' && (
          <SettingsView
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
            onOpenAccessControl={() => handleNavigate('access-control')}
          />
        )}

        {(activeSection === 'auth' || activeSection === 'errors') && (
          <AuthErrorShowcaseView
            initialMode={
              activeRoute === 'error-403'
                ? '403'
                : activeRoute === 'error-404'
                  ? '404'
                  : activeRoute === 'error-500'
                    ? '500'
                    : activeRoute === 'error-maintenance'
                      ? 'maintenance'
                      : activeRoute === 'error-offline'
                        ? 'offline'
                        : 'auth'
            }
            onGoHome={() => handleNavigate('overview')}
          />
        )}

        {activeSection === 'tasks' && <OperationsTasksView initialTab="tasks" />}

        {activeSection === 'help' && <OperationsTasksView initialTab="help" />}

        {activeSection === 'storage' && <FileStorageView />}

        {activeSection === 'operations' && (
          <OperationsHubView
            orders={orders}
            customers={INITIAL_CUSTOMERS}
            onSelectOrder={(o) => {
              handleNavigate('orders-all');
              setInspectedOrderId(o.id);
            }}
          />
        )}

        {activeSection === 'components' && (
          <ComponentKitView
            activeCategory={componentCategory}
            onChangeCategory={handleComponentCategoryChange}
            orders={orders}
            customers={INITIAL_CUSTOMERS}
            onInspectOrder={(o) => {
              handleNavigate('orders-all');
              setInspectedOrderId(o.id);
            }}
            onInspectCustomer={(c) => {
              handleNavigate('customers-all');
              setInspectedCustomerId(c.id);
            }}
          />
        )}

        <OrderDetailDrawer
          order={inspectedOrder}
          onClose={() => setInspectedOrderId(null)}
          onUpdateOrder={(id, updates) => void handleUpdateOrder(id, updates)}
          onDeleteOrder={(id) => void handleDeleteOrder(id)}
          isPinned={
            inspectedOrder
              ? isPinned(favoritePins, getOrderPinId(inspectedOrder.id))
              : false
          }
          onTogglePin={handleToggleOrderPin}
        />

        <CreateOrderModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreateOrder={handleCreateOrder}
        />

        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          orders={orders}
          customers={INITIAL_CUSTOMERS}
          navTree={navTreeForPalette}
          onSelectItem={handleSelectCommandItem}
        />

        <QrScannerModal
          open={qrScannerOpen}
          onClose={() => setQrScannerOpen(false)}
          orders={orders}
          customers={INITIAL_CUSTOMERS}
          onOpenOrder={(o) => {
            handleNavigate('orders-all');
            setInspectedOrderId(o.id);
          }}
          onOpenCustomer={(c) => {
            handleNavigate('customers-all');
            setInspectedCustomerId(c.id);
          }}
        />

        {/* Unsaved Changes Navigation Guard */}
        <ConfirmModal
          open={Boolean(pendingNavRoute)}
          onClose={() => setPendingNavRoute(null)}
          onConfirm={() => {
            const target = pendingNavRoute;
            setPendingNavRoute(null);
            setOrderFormDirty(false);
            if (target) applyNavigationNow(target);
          }}
          title={t('orderFormDiscardPromptTitle')}
          message={t('orderFormDiscardPromptMsg')}
          confirmLabel={t('orderFormLeaveBtn')}
          cancelLabel={t('orderFormStayBtn')}
          destructive
        />

        <NotificationDrawer onInspectOrder={handleInspectById} />
        <QuickActionsFAB
          onNewOrder={() => setCreateModalOpen(true)}
          onOpenPalette={() => setCommandPaletteOpen(true)}
          onOpenTasks={() => handleNavigate('tasks-queue')}
          onOpenHelp={() => handleNavigate('help-support')}
        />
      </AppShell>
    </ShortcutProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <NotificationProvider>
          <PermissionProvider>
            <ConfirmProvider>
              <DashboardWorkspace />
            </ConfirmProvider>
          </PermissionProvider>
        </NotificationProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
