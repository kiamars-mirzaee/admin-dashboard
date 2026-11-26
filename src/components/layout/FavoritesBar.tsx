import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Blocks,
  Bookmark,
  BookmarkPlus,
  Building2,
  Check,
  Clock,
  FolderOpen,
  LayoutDashboard,
  Pin,
  PinOff,
  ReceiptText,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react';
import type {
  CustomerProfile,
  NavRouteId,
  OrderRecord,
} from '../../types/admin';
import type { NavNode } from '../../utils/navTree';
import { getSectionForRoute } from '../../utils/navTree';
import {
  type FavoritePin,
  getCustomerPinId,
  getOrderPinId,
  getViewPinId,
  isFavoritePinActive,
  isPinned,
  resolveViewPinLabel,
} from '../../utils/favorites';
import { useI18n } from '../../i18n/I18nContext';

export interface FavoritesBarProps {
  pins: FavoritePin[];
  navTree: NavNode[];
  activeRoute: NavRouteId;
  inspectedOrderId: string | null;
  inspectedCustomerId: string | null;
  orders: OrderRecord[];
  customers: CustomerProfile[];
  onSelectPin: (pin: FavoritePin) => void;
  onRemovePin: (pinId: string) => void;
  onToggleCurrentView: () => void;
  onToggleOrderPin: (order: OrderRecord) => void;
  onToggleCustomerPin: (customer: CustomerProfile) => void;
  onResetDefaults: () => void;
  recentRoutes?: Array<{ routeId: NavRouteId; label: string }>;
  onSelectRecentRoute?: (routeId: NavRouteId) => void;
}

function getRouteIcon(routeId: NavRouteId) {
  const section = getSectionForRoute(routeId);
  switch (section) {
    case 'overview':
      return LayoutDashboard;
    case 'orders':
      return ReceiptText;
    case 'customers':
      return Users;
    case 'storage':
      return FolderOpen;
    case 'components':
    default:
      return Blocks;
  }
}

export function FavoritesBar({
  pins,
  navTree,
  activeRoute,
  inspectedOrderId,
  inspectedCustomerId,
  orders,
  customers,
  onSelectPin,
  onRemovePin,
  onToggleCurrentView,
  onToggleOrderPin,
  onToggleCustomerPin,
  onResetDefaults,
  recentRoutes = [],
  onSelectRecentRoute,
}: FavoritesBarProps) {
  const { t } = useI18n();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const currentViewPinId = getViewPinId(activeRoute);
  const currentViewPinned = isPinned(pins, currentViewPinId);
  const currentViewLabel = resolveViewPinLabel(
    activeRoute,
    navTree,
    t('navOverview')
  );

  useEffect(() => {
    if (!pickerOpen) return;
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPickerOpen(false);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [pickerOpen]);

  const filteredQuickEntities = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const matchedOrders = orders
      .filter((o) =>
        !q
          ? true
          : `${o.id} ${o.customerName} ${o.company}`.toLowerCase().includes(q)
      )
      .slice(0, 6);
    const matchedCustomers = customers
      .filter((c) =>
        !q
          ? true
          : `${c.name} ${c.company} ${c.id}`.toLowerCase().includes(q)
      )
      .slice(0, 5);
    return { matchedOrders, matchedCustomers };
  }, [orders, customers, pickerQuery]);

  return (
    <section
      aria-label={t('favBarTitle')}
      data-testid="favorites-bar"
      className="no-print border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/75 px-3 sm:px-4 lg:px-8 py-1.5"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-0">
        {/* Bar Title (Desktop / Tablet) */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap pe-1">
          <Bookmark className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span>{t('favBarTitle')}</span>
        </div>

        {/* Scrollable Pinned Items Track */}
        <div
          data-testid="favorites-track"
          className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
        >
          {pins.length === 0 ? (
            <div className="flex items-center gap-2 min-w-0 py-0.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t('favEmptyHint')}
              </span>
              <button
                type="button"
                onClick={onResetDefaults}
                data-testid="fav-reset-btn"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>{t('favResetDefaults')}</span>
              </button>
            </div>
          ) : (
            pins.map((pin) => {
              const active = isFavoritePinActive(pin, {
                activeRoute,
                inspectedOrderId,
                inspectedCustomerId,
              });
              const displayLabel =
                pin.kind === 'view'
                  ? resolveViewPinLabel(pin.routeId, navTree, pin.label)
                  : pin.label;

              const Icon =
                pin.kind === 'order'
                  ? ReceiptText
                  : pin.kind === 'customer'
                    ? Building2
                    : getRouteIcon(pin.routeId);

              const kindBadge =
                pin.kind === 'order'
                  ? t('favTypeOrder')
                  : pin.kind === 'customer'
                    ? t('favTypeCustomer')
                    : t('favTypeView');

              return (
                <div
                  key={pin.id}
                  data-testid={`fav-item-${pin.id}`}
                  className={`inline-flex items-center rounded-lg border shrink-0 transition-colors ${
                    active
                      ? 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-200'
                      : 'bg-slate-50/90 border-slate-200 text-slate-700 hover:bg-slate-100/90 hover:border-slate-300 dark:bg-slate-800/75 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectPin(pin)}
                    aria-current={active ? 'page' : undefined}
                    title={
                      pin.kind !== 'view' && pin.sublabel
                        ? `${kindBadge}: ${displayLabel} · ${pin.sublabel}`
                        : `${kindBadge}: ${displayLabel}`
                    }
                    className="min-h-[36px] sm:min-h-[30px] ps-2.5 pe-2 flex items-center gap-1.5 text-xs font-medium rounded-s-lg cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        active
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                    {pin.kind === 'order' ? (
                      <span
                        dir="ltr"
                        className="font-mono text-[11px] font-semibold truncate max-w-[130px]"
                      >
                        {displayLabel}
                      </span>
                    ) : (
                      <span className="truncate max-w-[140px]">
                        {displayLabel}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemovePin(pin.id)}
                    aria-label={t('favUnpinItem', { label: displayLabel })}
                    data-testid={`fav-unpin-${pin.id}`}
                    className={`min-h-[36px] sm:min-h-[30px] w-7 sm:w-6 flex items-center justify-center rounded-e-lg border-s transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      active
                        ? 'border-blue-200 text-blue-500 hover:text-red-600 hover:bg-red-50/80 dark:border-blue-800 dark:text-blue-300 dark:hover:text-red-400 dark:hover:bg-red-950/50'
                        : 'border-slate-200/80 text-slate-400 hover:text-red-600 hover:bg-red-50/80 dark:border-slate-700/80 dark:hover:text-red-400 dark:hover:bg-red-950/40'
                    }`}
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              );
            })
          )}

          {recentRoutes.length > 0 && onSelectRecentRoute && (
            <div
              data-testid="recent-routes-strip"
              className="hidden xl:flex items-center gap-1.5 ps-2 ms-1 border-s border-slate-200 dark:border-slate-700 shrink-0"
            >
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>{t('recentItemsLabel')}:</span>
              </span>
              {recentRoutes.map((item) => (
                <button
                  key={item.routeId}
                  type="button"
                  onClick={() => onSelectRecentRoute(item.routeId)}
                  className="px-2 py-1 rounded-lg bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/70 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* End Controls: Pin Current View + Quick Pin Entity Picker */}
        <div className="shrink-0 flex items-center gap-1.5 relative" ref={pickerRef}>
          <button
            type="button"
            onClick={onToggleCurrentView}
            data-testid="fav-pin-view-btn"
            aria-pressed={currentViewPinned}
            aria-label={`${
              currentViewPinned
                ? t('favUnpinCurrentView')
                : t('favPinCurrentView')
            }: ${currentViewLabel}`}
            title={`${
              currentViewPinned
                ? t('favUnpinCurrentView')
                : t('favPinCurrentView')
            }: ${currentViewLabel}`}
            className={`min-h-[36px] sm:min-h-[30px] px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              currentViewPinned
                ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:border-blue-600 dark:text-white dark:hover:bg-blue-500'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {currentViewPinned ? (
              <PinOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Pin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {currentViewPinned
                ? t('favUnpinCurrentView')
                : t('favPinCurrentView')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPickerOpen((prev) => !prev);
              setPickerQuery('');
            }}
            data-testid="fav-quick-add-btn"
            aria-expanded={pickerOpen}
            aria-haspopup="dialog"
            aria-label={t('favQuickAddTitle')}
            title={t('favQuickAddTitle')}
            className="min-h-[36px] sm:min-h-[30px] px-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <BookmarkPlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden lg:inline">{t('favQuickAddBtn')}</span>
          </button>

          {pickerOpen && (
            <div
              role="dialog"
              aria-label={t('favQuickAddTitle')}
              data-testid="fav-quick-add-popover"
              className="absolute top-full end-0 mt-1.5 w-72 sm:w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg z-40 overflow-hidden"
            >
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <Search
                    className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder={t('favQuickSearchPlaceholder')}
                    aria-label={t('favQuickSearchPlaceholder')}
                    className="w-full min-h-[36px] ps-8 pe-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {/* Orders Section */}
                {filteredQuickEntities.matchedOrders.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('favTypeOrder')}
                    </p>
                    <div className="space-y-0.5">
                      {filteredQuickEntities.matchedOrders.map((order) => {
                        const pinned = isPinned(pins, getOrderPinId(order.id));
                        return (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => onToggleOrderPin(order)}
                            className="w-full min-h-[36px] px-2 py-1.5 rounded-lg flex items-center justify-between gap-2 text-start text-xs hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                          >
                            <div className="min-w-0">
                              <span
                                dir="ltr"
                                className="font-mono font-semibold text-slate-900 dark:text-white inline-block"
                              >
                                {order.id}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 ms-1.5 truncate">
                                {order.company}
                              </span>
                            </div>
                            <span
                              className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-medium ${
                                pinned
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {pinned ? (
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              ) : (
                                <Pin className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Customers Section */}
                {filteredQuickEntities.matchedCustomers.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('favTypeCustomer')}
                    </p>
                    <div className="space-y-0.5">
                      {filteredQuickEntities.matchedCustomers.map((customer) => {
                        const pinned = isPinned(
                          pins,
                          getCustomerPinId(customer.id)
                        );
                        return (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => onToggleCustomerPin(customer)}
                            className="w-full min-h-[36px] px-2 py-1.5 rounded-lg flex items-center justify-between gap-2 text-start text-xs hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                          >
                            <div className="min-w-0 truncate">
                              <span className="font-medium text-slate-900 dark:text-white">
                                {customer.name}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 ms-1.5">
                                · {customer.company}
                              </span>
                            </div>
                            <span
                              className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-medium ${
                                pinned
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {pinned ? (
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              ) : (
                                <Pin className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
