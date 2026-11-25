import React, { useMemo, useState } from 'react';
import {
  Bell,
  Blocks,
  Globe,
  Keyboard,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  Sun,
  Users,
} from 'lucide-react';
import type { NavRouteId, NavSection } from '../../types/admin';
import { ADMIN_PROFILE } from '../../data/seedData';
import { SUPPORTED_LOCALES, type Locale } from '../../i18n/translations';
import { useI18n } from '../../i18n/I18nContext';
import {
  buildAdminNavTree,
  findNavPath,
  getSectionForRoute,
} from '../../utils/navTree';
import { buildBreadcrumbsForRoute } from '../../utils/breadcrumbs';
import { Avatar } from '../ui/Avatar';
import { Breadcrumb } from '../ui/Breadcrumb';
import { Button } from '../ui/Button';
import { AdaptiveDrawer } from '../ui/AdaptiveDrawer';
import { useShortcuts } from '../ui/KeyboardShortcutManager';
import { NestedNavMenu } from '../ui/NestedNavMenu';
import { useNotifications } from '../ui/NotificationSystem';

interface MobileTabItem {
  id: NavSection;
  routeId: NavRouteId;
  labelKey: 'navOverview' | 'navOrders' | 'navCustomers' | 'navComponents';
  Icon: typeof LayoutDashboard;
}

const MOBILE_TABS: MobileTabItem[] = [
  { id: 'overview', routeId: 'overview', labelKey: 'navOverview', Icon: LayoutDashboard },
  { id: 'orders', routeId: 'orders-all', labelKey: 'navOrders', Icon: ReceiptText },
  { id: 'customers', routeId: 'customers-all', labelKey: 'navCustomers', Icon: Users },
  { id: 'components', routeId: 'components-all', labelKey: 'navComponents', Icon: Blocks },
];

export interface AppShellProps {
  activeRoute: NavRouteId;
  onNavigate: (route: NavRouteId) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenNewOrder: () => void;
  flaggedCount: number;
  pendingCount: number;
  atRiskCustomersCount: number;
  inspectedItemLabel?: string | null;
  onClearInspectedItem?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenQrScanner?: () => void;
  quickAccessBar?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  activeRoute,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  onOpenNewOrder,
  flaggedCount,
  pendingCount,
  atRiskCustomersCount,
  inspectedItemLabel,
  onClearInspectedItem,
  onOpenCommandPalette,
  onOpenQrScanner,
  quickAccessBar,
  children,
}: AppShellProps) {
  const { locale, setLocale, t } = useI18n();
  const { unreadCount, setDrawerOpen } = useNotifications();
  const { setHelpOpen } = useShortcuts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navTree = useMemo(
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

  const activePath = useMemo(
    () => findNavPath(navTree, activeRoute),
    [navTree, activeRoute]
  );

  const activeSection = getSectionForRoute(activeRoute);
  const currentLeafLabel =
    inspectedItemLabel ??
    activePath[activePath.length - 1]?.label ??
    t('navOverview');

  const breadcrumbItems = useMemo(
    () =>
      buildBreadcrumbsForRoute({
        navTree,
        activeRoute,
        rootLabel: t('navOverview'),
        inspectedItemLabel,
        onNavigate,
        onClearInspectedItem,
      }),
    [navTree, activeRoute, t, inspectedItemLabel, onNavigate, onClearInspectedItem]
  );

  const handleSelectFromMobileMenu = (route: NavRouteId) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Start Sidebar (Left in LTR, Right in RTL) */}
      <aside className="no-print hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:start-0 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 z-30">
        <div className="h-16 px-6 flex items-center border-b border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-2.5 text-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
              K
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
              {t('brandName')}
            </span>
          </button>
        </div>

        <nav
          aria-label="Primary navigation"
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          <NestedNavMenu
            nodes={navTree}
            activeRoute={activeRoute}
            onSelectRoute={onNavigate}
            searchable
          />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar
              src={ADMIN_PROFILE.avatar}
              name={ADMIN_PROFILE.name}
              size="md"
            />
            <div className="min-w-0 text-start">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {ADMIN_PROFILE.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t('roleVpOps')}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:ps-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="no-print sticky top-0 z-30 h-13 lg:h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-2 sm:gap-3">
          {/* Start: Mobile Menu Drawer Trigger + Title / Desktop Active Breadcrumb Trail */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t('openNavMenu')}
              className="lg:hidden min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <Breadcrumb
              items={breadcrumbItems}
              showHomeIcon
              maxVisible={5}
              className="hidden lg:block"
            />

            <div className="sm:hidden w-7 h-7 rounded-lg bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-display font-bold text-xs shrink-0">
              K
            </div>

            <h1 className="hidden sm:block lg:hidden font-display font-semibold text-base text-slate-900 dark:text-white truncate">
              {currentLeafLabel}
            </h1>
          </div>

          {/* End Actions: Command Search + Language Switcher + Dark Mode + Notifications + New Order */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {onOpenCommandPalette && (
              <>
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  aria-label={t('cmdOpenAria')}
                  data-testid="command-palette-trigger"
                  className="hidden md:flex items-center gap-2.5 min-h-[38px] w-48 xl:w-64 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate flex-1 text-start">
                    {t('cmdTriggerPlaceholder')}
                  </span>
                  <kbd
                    dir="ltr"
                    className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-600 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300 shrink-0"
                  >
                    ⌘K
                  </kbd>
                </button>
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  aria-label={t('cmdOpenAria')}
                  data-testid="command-palette-mobile-trigger"
                  className="md:hidden min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                </button>
              </>
            )}

            {onOpenQrScanner && (
              <button
                type="button"
                onClick={onOpenQrScanner}
                aria-label={t('qrOpenAria')}
                title={`${t('qrScanBtn')} (Q)`}
                data-testid="qr-scanner-trigger"
                className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            {/* Multilingual + RTL Language Selector */}
            <div className="relative flex items-center">
              <Globe
                className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute start-2.5 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="locale-switcher" className="sr-only">
                {t('selectLanguage')}
              </label>
              <select
                id="locale-switcher"
                aria-label={t('selectLanguage')}
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="min-h-[38px] max-w-[74px] sm:max-w-none ps-7 pe-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {SUPPORTED_LOCALES.map((loc) => (
                  <option key={loc.code} value={loc.code}>
                    {loc.shortLabel} · {loc.nativeName}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label={t('shortcutsBtn')}
              title={`${t('shortcutsBtn')} (?)`}
              className="hidden sm:flex min-h-[40px] min-w-[40px] rounded-xl items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Keyboard className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? t('switchToLight') : t('switchToDark')}
              className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={`${t('openNotifications')} (${unreadCount})`}
              className="relative min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 end-1.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="hidden sm:block">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={onOpenNewOrder}
              >
                {t('newOrder')}
              </Button>
            </div>
            <button
              type="button"
              onClick={onOpenNewOrder}
              aria-label={t('createNewOrder')}
              className="sm:hidden min-h-[40px] min-w-[40px] rounded-xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {quickAccessBar}

        {/* Main Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-20 lg:pb-8">
          {breadcrumbItems.length > 1 && (
            <div className="lg:hidden mb-3 pb-2 border-b border-slate-200/70 dark:border-slate-800/80">
              <Breadcrumb
                items={breadcrumbItems}
                showHomeIcon
                maxVisible={3}
                size="sm"
              />
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Mobile Nested Navigation Drawer (Bottom Sheet) */}
      <AdaptiveDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title={t('navigationTitle')}
        subtitle={`${t('activePrefix')}: ${activePath.map((n) => n.label).join(' / ')}`}
        footer={
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setHelpOpen(true);
            }}
            className="w-full min-h-[44px] px-3 rounded-xl flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>{t('shortcutsBtn')}</span>
            </span>
            <kbd
              dir="ltr"
              className="min-w-[24px] h-6 px-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs flex items-center justify-center"
            >
              ?
            </kbd>
          </button>
        }
      >
        <NestedNavMenu
          nodes={navTree}
          activeRoute={activeRoute}
          onSelectRoute={handleSelectFromMobileMenu}
          searchable
        />
      </AdaptiveDrawer>

      {/* Mobile Fixed Bottom Navigation Bar (56px height) */}
      <nav
        aria-label="Mobile navigation"
        className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 items-center px-1"
      >
        {MOBILE_TABS.map(({ id, routeId, labelKey, Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(routeId)}
              aria-current={active ? 'page' : undefined}
              className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                active
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                {t(labelKey)}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
