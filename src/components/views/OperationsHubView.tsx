import { useState } from 'react';
import {
  Activity,
  Building2,
  CheckCircle2,
  CreditCard,
  Flag,
  Printer,
  RefreshCw,
  Search,
  Server,
  UserPlus,
  Webhook,
} from 'lucide-react';
import type { CustomerProfile, OrderRecord } from '../../types/admin';
import { matchesNormalizedQuery } from '../../utils/persianRtl';
import { Barcode } from '../ui/AdvancedCharts';
import { Button } from '../ui/Button';
import { JSONViewer } from '../ui/JSONViewer';
import { PageContainer, PageHeader, Section } from '../ui/LayoutPrimitives';
import { useNotifications } from '../ui/NotificationSystem';
import { Badge, StatusDot } from '../ui/Primitives';
import { ProgressBar } from '../ui/Progress';
import { Tabs } from '../ui/Tabs';

export interface OperationsHubViewProps {
  initialTab?: 'teams' | 'billing' | 'flags' | 'webhooks' | 'health' | 'search' | 'invoice';
  orders: OrderRecord[];
  customers: CustomerProfile[];
  onSelectOrder?: (order: OrderRecord) => void;
}

export function OperationsHubView({
  initialTab = 'teams',
  orders,
  customers,
  onSelectOrder,
}: OperationsHubViewProps) {
  const { addToast } = useNotifications();
  const [tab, setTab] = useState(initialTab);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Operations Lead');
  const [teamMembers, setTeamMembers] = useState([
    { id: 'tm-1', name: 'Elena Rostova', email: 'elena.rostova@kestrelops.io', org: 'Kestrel EU Clearing', role: 'Super Admin', status: 'Active' },
    { id: 'tm-2', name: 'Sara Mohammadi', email: 'sara@kestrelops.io', org: 'Kestrel MENA Treasury', role: 'Operations Lead', status: 'Active' },
    { id: 'tm-3', name: 'Liam Brooks', email: 'liam@kestrelops.io', org: 'Staging Sandbox', role: 'Support Agent', status: 'Invited' },
  ]);

  const [flags, setFlags] = useState([
    { key: 'jalali_calendar_exports', label: 'Jalali Dates in CSV & PDF Exports', rollout: 100, enabled: true },
    { key: 'sepa_instant_failover', label: 'Automatic SEPA Instant Failover', rollout: 50, enabled: true },
    { key: 'ai_anomaly_scoring', label: 'Realtime Velocity Anomaly Scoring', rollout: 15, enabled: false },
  ]);

  const [webhooks, setWebhooks] = useState([
    { id: 'wh-901', event: 'order.flagged', target: 'https://hooks.gridline.co/kestrel', code: 200, latencyMs: 84, payload: { orderId: 'ORD-8490', riskScore: 87, rail: 'partner' } },
    { id: 'wh-900', event: 'settlement.failed', target: 'https://billing.harborpay.io/events', code: 502, latencyMs: 1420, payload: { orderId: 'ORD-8488', error: 'UPSTREAM_TIMEOUT', retryCount: 2 } },
  ]);
  const [selectedWebhookId, setSelectedWebhookId] = useState('wh-901');
  const [searchQuery, setSearchQuery] = useState('ORD-8490');

  const selectedWebhook = webhooks.find((w) => w.id === selectedWebhookId) ?? webhooks[0];

  const matchedOrders = orders.filter((o) =>
    matchesNormalizedQuery(`${o.id} ${o.customerName} ${o.company} ${o.planOrItem}`, searchQuery)
  );
  const matchedCustomers = customers.filter((c) =>
    matchesNormalizedQuery(`${c.id} ${c.name} ${c.company} ${c.email}`, searchQuery)
  );

  const invoiceOrder = orders[0];

  return (
    <PageContainer>
      <PageHeader
        title="Platform Operations, Billing & Diagnostics"
        description="Manage organizations, invites, subscriptions, feature flags, webhook deliveries, health status, global search, and printable invoices."
      />

      <Tabs
        value={tab}
        onChange={(v) => setTab(v as typeof tab)}
        ariaLabel="Operations Hub Tabs"
        items={[
          {
            id: 'teams',
            label: 'Teams & Orgs',
            icon: <Building2 className="w-3.5 h-3.5" />,
            content: (
              <Section
                title="Teams, Organizations & User Invites"
                description="Provision multi-tenant workspace seats and send role-scoped email invitations."
              >
                <div className="flex flex-wrap gap-2 mb-4">
                  <input
                    dir="ltr"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.io"
                    className="flex-1 min-w-[200px] min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                  >
                    <option>Operations Lead</option>
                    <option>Finance Analyst</option>
                    <option>Support Agent</option>
                  </select>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const clean = inviteEmail.trim();
                      if (!clean) return;
                      setTeamMembers((prev) => [
                        ...prev,
                        { id: `tm-${Date.now()}`, name: clean.split('@')[0], email: clean, org: 'Kestrel EU Clearing', role: inviteRole, status: 'Invited' },
                      ]);
                      setInviteEmail('');
                      addToast({ title: `Invitation sent to ${clean}`, variant: 'success' });
                    }}
                  >
                    Invite User
                  </Button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
                  {teamMembers.map((m) => (
                    <div key={m.id} className="p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{m.name}</p>
                        <p dir="ltr" className="font-mono text-[11px] text-slate-500">{m.email} · {m.org}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="neutral">{m.role}</Badge>
                        <Badge tone={m.status === 'Active' ? 'success' : 'warning'}>{m.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            ),
          },
          {
            id: 'billing',
            label: 'Billing & Plans',
            icon: <CreditCard className="w-3.5 h-3.5" />,
            content: (
              <Section title="Subscription & Usage Metering" description="Enterprise Clearing Plan — $1,490 / month">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="font-semibold text-slate-900 dark:text-white">API Requests</p>
                    <ProgressBar value={68} />
                    <p dir="ltr" className="font-mono text-slate-500">680k / 1M monthly</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="font-semibold text-slate-900 dark:text-white">Vault Storage</p>
                    <ProgressBar value={34} tone="success" />
                    <p dir="ltr" className="font-mono text-slate-500">17.2 GB / 50 GB</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="font-semibold text-slate-900 dark:text-white">Operator Seats</p>
                    <ProgressBar value={80} tone="warning" />
                    <p dir="ltr" className="font-mono text-slate-500">16 / 20 seats active</p>
                  </div>
                </div>
              </Section>
            ),
          },
          {
            id: 'flags',
            label: 'Feature Flags',
            icon: <Flag className="w-3.5 h-3.5" />,
            content: (
              <Section title="Runtime Feature Flags" description="Toggle capabilities and progressive rollout percentages.">
                <div className="space-y-2.5">
                  {flags.map((f) => (
                    <div key={f.key} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{f.label}</p>
                        <p dir="ltr" className="font-mono text-[11px] text-slate-500">{f.key} · Rollout {f.rollout}%</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFlags((prev) =>
                            prev.map((x) => (x.key === f.key ? { ...x, enabled: !x.enabled } : x))
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                          f.enabled
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {f.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  ))}
                </div>
              </Section>
            ),
          },
          {
            id: 'webhooks',
            label: 'Webhook Logs',
            icon: <Webhook className="w-3.5 h-3.5" />,
            content: (
              <Section title="Webhook Delivery Inspector" description="Inspect HTTP status, latency, and JSON delivery payloads.">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {webhooks.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => setSelectedWebhookId(w.id)}
                        className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between gap-2 ${
                          w.id === selectedWebhook.id
                            ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div>
                          <p dir="ltr" className="font-mono font-semibold text-slate-900 dark:text-white">
                            {w.event} · HTTP {w.code}
                          </p>
                          <p dir="ltr" className="font-mono text-[11px] text-slate-500 truncate">
                            {w.target} ({w.latencyMs}ms)
                          </p>
                        </div>
                        {w.code >= 400 && (
                          <Button
                            size="sm"
                            variant="secondary"
                            leftIcon={<RefreshCw className="w-3 h-3" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setWebhooks((prev) =>
                                prev.map((x) => (x.id === w.id ? { ...x, code: 200, latencyMs: 92 } : x))
                              );
                              addToast({ title: `Retried ${w.id} → HTTP 200`, variant: 'success' });
                            }}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <JSONViewer title={`${selectedWebhook.id} · ${selectedWebhook.event}`} data={selectedWebhook.payload} maxHeight="220px" />
                </div>
              </Section>
            ),
          },
          {
            id: 'health',
            label: 'System Health',
            icon: <Server className="w-3.5 h-3.5" />,
            content: (
              <Section title="Infrastructure Health & Uptime Status" description="99.98% trailing 30-day clearing availability.">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {[
                    { name: 'SEPA Instant Gateway', latency: '28ms', tone: 'success' as const, state: 'Operational' },
                    { name: 'PostgreSQL / Storage Vault', latency: '11ms', tone: 'success' as const, state: 'Operational' },
                    { name: 'Webhook Dispatch Workers', latency: '142ms', tone: 'warning' as const, state: 'Degraded queue' },
                  ].map((svc) => (
                    <div key={svc.name} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">{svc.name}</span>
                        <Activity className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <StatusDot tone={svc.tone} label={svc.state} live />
                        <span dir="ltr" className="font-mono text-slate-500">{svc.latency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            ),
          },
          {
            id: 'search',
            label: 'Search Results',
            icon: <Search className="w-3.5 h-3.5" />,
            content: (
              <Section title="Global Search Results Page" description="Cross-entity search supporting Persian & Arabic digit/character normalization.">
                <input
                  dir="auto"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try ORD-8490, ۸۴۹۰, Marcus..."
                  className="w-full min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs mb-4"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Orders ({matchedOrders.length})</p>
                    {matchedOrders.slice(0, 5).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => onSelectOrder?.(o)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-start hover:bg-slate-50 dark:hover:bg-slate-900 flex justify-between cursor-pointer"
                      >
                        <span><strong dir="ltr">{o.id}</strong> · {o.company}</span>
                        <span dir="ltr" className="font-mono">${o.amount.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Customers ({matchedCustomers.length})</p>
                    {matchedCustomers.slice(0, 5).map((c) => (
                      <div key={c.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span><strong>{c.name}</strong> · {c.company}</span>
                        <Badge tone="neutral">{c.tier}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            ),
          },
          {
            id: 'invoice',
            label: 'Print Invoice',
            icon: <Printer className="w-3.5 h-3.5" />,
            content: (
              <Section
                title="Printable Commercial Invoice"
                actions={
                  <Button size="sm" variant="primary" leftIcon={<Printer className="w-3.5 h-3.5" />} onClick={() => window.print()}>
                    Print Invoice
                  </Button>
                }
              >
                {invoiceOrder && (
                  <div className="max-w-2xl mx-auto p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-4 text-xs">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">INVOICE · {invoiceOrder.id}</h4>
                        <p className="text-slate-500 mt-0.5">Kestrel Clearing Ops · Tax ID EU-902814</p>
                      </div>
                      <Barcode value={invoiceOrder.id} height={38} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400">Billed To</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{invoiceOrder.customerName}</p>
                        <p>{invoiceOrder.company}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-slate-400">Invoice Total</p>
                        <p dir="ltr" className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                          ${invoiceOrder.amount.toLocaleString()}
                        </p>
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {invoiceOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Section>
            ),
          },
        ]}
      />
    </PageContainer>
  );
}
