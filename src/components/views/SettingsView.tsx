import { useState } from 'react';
import { KeyRound, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { ADMIN_PROFILE } from '../../data/seedData';
import { SUPPORTED_LOCALES, type Locale } from '../../i18n/translations';
import { useI18n } from '../../i18n/I18nContext';
import { Alert } from '../ui/Alert';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { ColorPicker } from '../ui/ColorPicker';
import { JSONEditor, SlugInput } from '../ui/ExtendedInputs';
import {
  PasswordInput,
  RadioGroupField,
  SliderField,
  SwitchToggle,
  TimePicker,
} from '../ui/FormControls';
import { useNotifications } from '../ui/NotificationSystem';
import { Badge } from '../ui/Primitives';
import { SegmentedControl } from '../ui/SegmentedControl';
import { CopyButton } from '../ui/SharedComposites';

export interface SettingsViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAccessControl: () => void;
}

type SettingsTab =
  | 'general'
  | 'profile'
  | 'appearance'
  | 'security'
  | 'notifications'
  | 'apikeys'
  | 'webhooks'
  | 'integrations';

interface ApiKeyEntry {
  id: string;
  name: string;
  token: string;
  scope: string;
  lastUsed: string;
}

export function SettingsView({
  darkMode,
  onToggleDarkMode,
  onOpenAccessControl,
}: SettingsViewProps) {
  const { locale, setLocale, t } = useI18n();
  const { addToast } = useNotifications();

  const [tab, setTab] = useState<SettingsTab>('general');
  const [workspaceName, setWorkspaceName] = useState('Kestrel Enterprise Ops');
  const [workspaceSlug, setWorkspaceSlug] = useState('kestrel-enterprise-ops');
  const [currencyMode, setCurrencyMode] = useState('USD');
  const [displayName, setDisplayName] = useState(ADMIN_PROFILE.name);
  const [roleTitle, setRoleTitle] = useState(ADMIN_PROFILE.role);
  const [accentColor, setAccentColor] = useState('#2563EB');
  const [uiDensity, setUiDensity] = useState('comfortable');
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(12);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [flaggedSlackAlert, setFlaggedSlackAlert] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.kestrelops.io/v2/settlements');
  const [webhookSecret, setWebhookSecret] = useState('whsec_94a8f10d44c2e18b7a62');
  const [webhookPayloadJson, setWebhookPayloadJson] = useState(
    JSON.stringify(
      {
        events: ['order.settled', 'order.flagged', 'refund.issued'],
        retryPolicy: { maxAttempts: 5, backoff: 'exponential' },
        verifySsl: true,
      },
      null,
      2
    )
  );
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([
    {
      id: 'KEY-01',
      name: 'Ledger Read-Only Sync',
      token: 'kstr_live_99a12b4f8c7019ee3d',
      scope: 'orders:read, reports:read',
      lastUsed: '4m ago',
    },
    {
      id: 'KEY-02',
      name: 'Warehouse ERP Bridge',
      token: 'kstr_live_4409c8a1127d03ff91',
      scope: 'orders:write, storage:write',
      lastUsed: '2h ago',
    },
  ]);

  const handleSave = () => {
    addToast({
      title: t('settingsSavedToast'),
      description: `${workspaceName} · ${displayName}`,
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6" data-testid="settings-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('settingsTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('settingsSubtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Save className="w-4 h-4" />}
          onClick={handleSave}
        >
          {t('settingsSaveBtn')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <SegmentedControl
          ariaLabel={t('settingsTitle')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'general', label: t('settingsTabGeneral') },
            { value: 'profile', label: t('settingsTabProfile') },
            { value: 'appearance', label: 'Appearance' },
            { value: 'security', label: t('settingsTabSecurity') },
            { value: 'notifications', label: t('settingsTabNotifications') },
            { value: 'apikeys', label: 'API Keys' },
            { value: 'webhooks', label: 'Webhooks' },
            { value: 'integrations', label: t('settingsTabIntegrations') },
          ]}
        />
      </div>

      {/* General */}
      {tab === 'general' && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="set-ws-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Workspace name
              </label>
              <input
                id="set-ws-name"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="set-locale" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('selectLanguage')}
              </label>
              <select
                id="set-locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
              >
                {SUPPORTED_LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.dir.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <SlugInput
            label="Workspace URL Slug"
            prefix="https://console.kestrelops.io/"
            sourceTitle={workspaceName}
            value={workspaceSlug}
            onChange={setWorkspaceSlug}
          />

          <RadioGroupField
            label="Reporting settlement currency"
            columns={3}
            value={currencyMode}
            onChange={setCurrencyMode}
            options={[
              { value: 'USD', label: 'USD ($)', description: 'Primary ledger currency' },
              { value: 'EUR', label: 'EUR (€)', description: 'SEPA settlement display' },
              { value: 'IRR', label: 'IRR / Toman', description: 'Localized Persian ledger' },
            ]}
          />
        </section>
      )}

      {/* Appearance */}
      {tab === 'appearance' && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5">
          <SwitchToggle
            label={darkMode ? t('switchToLight') : t('switchToDark')}
            description="Toggle dark surfaces across tables, charts, and drawers."
            checked={darkMode}
            onChange={onToggleDarkMode}
          />

          <RadioGroupField
            label="Interface table & spacing density"
            columns={2}
            value={uiDensity}
            onChange={setUiDensity}
            options={[
              { value: 'comfortable', label: 'Comfortable', description: '44px touch targets & spacious cards' },
              { value: 'compact', label: 'Compact Ledger', description: 'High-density analyst rows' },
            ]}
          />

          <ColorPicker
            label="Workspace primary accent swatch"
            value={accentColor}
            onChange={setAccentColor}
          />
        </section>
      )}

      {/* Account Profile */}
      {tab === 'profile' && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5">
          <div className="flex items-center gap-4">
            <Avatar src={ADMIN_PROFILE.avatar} name={displayName} size="lg" />
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {displayName}
              </h3>
              <p dir="ltr" className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {ADMIN_PROFILE.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Full name
              </label>
              <input
                id="prof-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prof-role" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Title
              </label>
              <input
                id="prof-role"
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </section>
      )}

      {/* Security & 2FA */}
      {tab === 'security' && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5">
          <Alert
            variant="info"
            title="Hardware & TOTP 2FA policy active"
            description="Require 6-digit OTP verification before approving refunds or key rotations."
            actionLabel={t('accessSessionsTitle')}
            onAction={onOpenAccessControl}
          />

          <SwitchToggle
            label="Enforce 2FA for all workspace admins"
            description="Blocks password-only logins from unrecognized IP addresses."
            checked={mfaEnforced}
            onChange={setMfaEnforced}
          />

          <SliderField
            label="Idle session expiration"
            min={1}
            max={72}
            step={1}
            unit="h"
            value={sessionTimeoutHours}
            onChange={setSessionTimeoutHours}
            helperText="Automatically locks inactive browser tabs after timeout."
          />

          <PasswordInput
            label="Rotate admin password"
            value={newPassword}
            onChange={setNewPassword}
            showStrength
            helperText="Use 12+ characters mixing uppercase, numbers, and symbols."
          />
        </section>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <SwitchToggle
            label="Daily settlement digest emails"
            description="Send end-of-day gross & cleared ledger summary."
            checked={emailAlerts}
            onChange={setEmailAlerts}
          />
          <SwitchToggle
            label="Instant alerts for Flagged orders"
            description="Push high-priority banner & toast when velocity rules trigger."
            checked={flaggedSlackAlert}
            onChange={setFlaggedSlackAlert}
          />
          <TimePicker
            label="Quiet hours start time"
            value={quietStart}
            onChange={setQuietStart}
            helperText="Non-critical system alerts pause until 07:00 UTC."
          />
        </section>
      )}

      {/* API Keys */}
      {tab === 'apikeys' && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                API Access Tokens
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scoped bearer credentials for automated ERP & ledger integrations.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                const nextId = `KEY-0${apiKeys.length + 1}`;
                setApiKeys((prev) => [
                  {
                    id: nextId,
                    name: `Automation Token #${prev.length + 1}`,
                    token: `kstr_live_${Math.random().toString(36).slice(2, 16)}`,
                    scope: 'orders:read',
                    lastUsed: 'Just created',
                  },
                  ...prev,
                ]);
                addToast({ title: `Created ${nextId}`, variant: 'success' });
              }}
            >
              Generate key
            </Button>
          </div>

          <div className="space-y-2.5">
            {apiKeys.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {entry.name}
                    </span>
                    <Badge tone="neutral">{entry.lastUsed}</Badge>
                  </div>
                  <p dir="ltr" className="font-mono text-xs text-slate-500 truncate">
                    {entry.token} · {entry.scope}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CopyButton value={entry.token} label="Copy key" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setApiKeys((prev) => prev.filter((k) => k.id !== entry.id))
                    }
                    aria-label={`Revoke ${entry.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Webhooks JSON Config */}
      {tab === 'webhooks' && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="int-webhook-json" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Primary settlement webhook URL
            </label>
            <input
              id="int-webhook-json"
              type="url"
              dir="ltr"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white"
            />
          </div>

          <JSONEditor
            label="Webhook Routing & Retry Policy (JSON)"
            value={webhookPayloadJson}
            onChange={setWebhookPayloadJson}
            helperText="Live JSON syntax validation before deploying webhook rules."
          />
        </section>
      )}

      {/* Integrations */}
      {tab === 'integrations' && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="int-webhook" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Primary settlement webhook URL
            </label>
            <input
              id="int-webhook"
              type="url"
              dir="ltr"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white"
            />
          </div>

          <PasswordInput
            label="Webhook signing secret"
            value={webhookSecret}
            onChange={setWebhookSecret}
            helperText="Used to verify HMAC-SHA256 signatures on incoming events."
          />

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => {
              const rotated = `whsec_${Math.random().toString(36).slice(2, 16)}`;
              setWebhookSecret(rotated);
              addToast({
                title: 'Signing secret rotated',
                variant: 'warning',
              });
            }}
          >
            Rotate secret
          </Button>
        </section>
      )}
    </div>
  );
}
