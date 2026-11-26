import { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  FileUp,
  MoreHorizontal,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useDebounce, usePagination } from '../../hooks/index';
import { Button } from '../ui/Button';
import {
  CalendarView,
  ChartCard,
  CommentThread,
  DescriptionList,
  GaugeChart,
  ImageGallery,
  Pagination,
  RadarChart,
  Timeline,
  VirtualList,
} from '../ui/DataDisplayExtras';
import { JSONViewer } from '../ui/JSONViewer';
import {
  CurrencyInput,
  ImageUpload,
  NumberInput,
  PhoneInput,
  RangeSlider,
  Rating,
} from '../ui/ExtendedInputs';
import { FormBuilder, Repeater, type RepeaterLineItem } from '../ui/FormStructure';
import { SplitView } from '../ui/LayoutPrimitives';
import { useNotifications } from '../ui/NotificationSystem';
import {
  ContextMenu,
  DirectionDrawer,
  DropdownMenu,
  HoverCard,
  ResultPage,
  useConfirm,
} from '../ui/OverlayExtras';
import {
  Accordion,
  Badge,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Code,
  Heading,
  IconButton,
  Kbd,
  SplitButton,
  StatusDot,
  Text,
} from '../ui/Primitives';
import { CircularProgress } from '../ui/Progress';
import {
  Can,
  CopyButton,
  ExportDialog,
  ImportWizard,
  InlineEdit,
  usePermission,
} from '../ui/SharedComposites';
import { Tabs } from '../ui/Tabs';
import {
  BackgroundTaskManager,
  type BackgroundTaskItem,
  FeedbackWidget,
  OfflineReconnectingBanner,
  ProductTourModal,
  SessionTimeoutModal,
} from '../layout/ShellOverlays';
import {
  Barcode,
  FunnelChart,
  OrgChart,
  ScatterChart,
  TreemapChart,
} from '../ui/AdvancedCharts';
import {
  EnterpriseTable,
  LogViewer,
  MediaPlayer,
  PDFPreviewCard,
} from '../ui/EnterpriseDataKit';
import {
  CascaderField,
  ConditionalAndMultiLangForm,
  IconCronDurationControls,
  InputGroupAndMask,
  MentionLocationSignatureCaptcha,
  TransferList,
  TreeSelectField,
} from '../ui/AdvancedFormKit';
import {
  ApprovalFlow,
  AttachmentsList,
  BottomSheet,
  Popconfirm,
  TagCategoryManager,
  TemplateEditor,
  TrashRecovery,
  VersionHistory,
} from '../ui/BusinessModulesKit';

export interface ExtendedKitShowcaseProps {
  showInputs: boolean;
  showWorkflows: boolean;
  showOverlays: boolean;
  showCharts: boolean;
  showStates: boolean;
}

export function ExtendedKitShowcase({
  showInputs,
  showWorkflows,
  showOverlays,
  showCharts,
  showStates,
}: ExtendedKitShowcaseProps) {
  const { addToast } = useNotifications();
  const confirm = useConfirm();
  const { roleId, setRoleId } = usePermission();

  const [qty, setQty] = useState(12);
  const [budget, setBudget] = useState('48,500');
  const [countryCode, setCountryCode] = useState('+98');
  const [phone, setPhone] = useState('912-345-6789');
  const [rangeVal, setRangeVal] = useState<[number, number]>([200, 8000]);
  const [ratingVal, setRatingVal] = useState(4);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(['settlement', 'tier-1']);
  const [repeaterRows, setRepeaterRows] = useState<RepeaterLineItem[]>([
    { id: 'r1', label: 'EU-West Settlement Node', qty: '2', unitPrice: '1200' },
    { id: 'r2', label: 'SOC2 Compliance Vault', qty: '1', unitPrice: '450' },
  ]);

  const [tabMode, setTabMode] = useState('radar');
  const [verticalTab, setVerticalTab] = useState('perms');
  const [inlineLabel, setInlineLabel] = useState('Q4 EMEA Settlement Policy');
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSide, setDrawerSide] = useState<'left' | 'right' | 'bottom'>('right');
  const [filterText, setFilterText] = useState('');
  const debouncedFilter = useDebounce(filterText, 250);
  const [jsonPreset, setJsonPreset] = useState<'api' | 'config' | 'malformed'>('api');
  const [jsonSurface, setJsonSurface] = useState<'dark' | 'auto'>('dark');
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [timeoutModalOpen, setTimeoutModalOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [bgTasks, setBgTasks] = useState<BackgroundTaskItem[]>([
    { id: 'bg-1', title: 'Q4 Ledger PDF Compilation', progress: 100, status: 'completed', detail: 'Ready in Vault / Reports' },
    { id: 'bg-2', title: 'SEPA Sanctions Delta Sync', progress: 64, status: 'running', detail: 'Processing chunk 16 / 25' },
  ]);

  const jsonPresets: Record<
    'api' | 'config' | 'malformed',
    { title: string; data: unknown }
  > = {
    api: {
      title: 'GET /api/v2/orders/ORD-8490',
      data: {
        requestId: 'req_9f22c81a',
        statusCode: 200,
        order: {
          id: 'ORD-8490',
          amount: 14850.75,
          currency: 'EUR',
          settled: false,
          riskState: 'flagged',
          reviewerNote: null,
          customer: {
            id: 'CUS-302',
            name: 'Marcus Vance',
            company: 'Northstar Logistics GmbH',
            tier: 'enterprise',
          },
          rails: [
            { rail: 'sepa_instant', priority: 1, active: true, maxLimit: 50000 },
            { rail: 'swift_wire', priority: 2, active: false, maxLimit: null },
          ],
        },
        meta: {
          region: 'eu-west-1',
          latencyMs: 38,
          tags: ['sepa', 'dual-control', 'high-value'],
        },
      },
    },
    config: {
      title: 'kestrel.config.json',
      data: {
        service: 'kestrel-clearing-core',
        version: '2.6.4',
        strictMode: true,
        telemetry: {
          enabled: true,
          sampleRate: 0.25,
          redactFields: ['iban', 'taxId', 'authToken'],
        },
        retryPolicy: {
          maxAttempts: 5,
          backoffMs: 250,
          jitter: true,
          deadLetterTopic: 'clearing.dlq.v2',
        },
        regions: ['eu-west-1', 'eu-central-1', 'me-south-1'],
        maintenanceWindowUtc: null,
      },
    },
    malformed: {
      title: 'broken-webhook-payload.json',
      data: '{\n  "event": "settlement.failed",\n  "orderId": "ORD-8490",\n  "retries": 3,\n  "reason": unquoted_value\n}',
    },
  };

  const virtualRows = Array.from({ length: 120 }, (_, i) => ({
    id: `ROW-${1000 + i}`,
    label: `Settlement Checkpoint #${i + 1}`,
    region: i % 2 === 0 ? 'EU-West' : 'MENA',
  })).filter(
    (r) =>
      !debouncedFilter ||
      r.label.toLowerCase().includes(debouncedFilter.toLowerCase())
  );

  const pager = usePagination(virtualRows.length, 6);
  const startIdx = (pager.page - 1) * pager.pageSize;
  const pagedRows = virtualRows.slice(startIdx, startIdx + pager.pageSize);

  return (
    <div className="space-y-6" data-testid="extended-kit-showcase">
      {/* Layer 1: Primitives & Typography */}
      {showInputs && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Heading level={3}>UI Primitives, Badges, SplitButton & Accordion</Heading>
              <Text tone="muted" size="xs">
                Layer 1 building blocks: outline/link buttons, split actions, typography, status dots, and circular progress.
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot tone="success" label="All Systems Operational" live />
              <CircularProgress value={84} size={36} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" size="sm">
              Outline Button
            </Button>
            <Button variant="link" size="sm">
              Link Button
            </Button>
            <ButtonGroup>
              <Button variant="secondary" size="sm">
                Day
              </Button>
              <Button variant="secondary" size="sm">
                Week
              </Button>
              <Button variant="secondary" size="sm">
                Month
              </Button>
            </ButtonGroup>
            <SplitButton
              label="Run Batch"
              onClick={() => addToast({ title: 'Batch started', variant: 'success' })}
              actions={[
                {
                  id: 'dry-run',
                  label: 'Dry Run Validation',
                  onClick: () => addToast({ title: 'Dry run clean', variant: 'info' }),
                },
                {
                  id: 'export-manifest',
                  label: 'Export Manifest',
                  onClick: () => setExportOpen(true),
                },
              ]}
            />
            <IconButton
              label="Configure"
              icon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => addToast({ title: 'Configured', variant: 'info' })}
            />
            <div className="flex items-center gap-1.5">
              <Kbd>Ctrl</Kbd>
              <Text size="xs" tone="muted">
                +
              </Text>
              <Kbd>K</Kbd>
              <Code>v2.6.0</Code>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                tone="info"
                onRemove={() => setTags((prev) => prev.filter((x) => x !== tag))}
              >
                {tag}
              </Badge>
            ))}
            <Badge tone="success">Verified</Badge>
            <Badge tone="warning">Pending Review</Badge>
            <Badge tone="danger">Alert</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader
                title="Composable Card Container"
                subtitle="Header, body, and footer slots"
                action={<CopyButton value="CARD-REF-2026" />}
              />
              <CardBody>
                <div className="flex items-center justify-between gap-2">
                  <Text size="xs" tone="muted">
                    Inline editable rule title:
                  </Text>
                  <InlineEdit
                    value={inlineLabel}
                    onSave={(next) => {
                      setInlineLabel(next);
                      addToast({ title: `Updated: ${next}`, variant: 'success' });
                    }}
                  />
                </div>
              </CardBody>
              <CardFooter>
                <Button size="sm" variant="ghost" onClick={() => setImportOpen(true)}>
                  Open CSV Import Wizard
                </Button>
              </CardFooter>
            </Card>

            <Accordion
              defaultOpenId="acc-1"
              items={[
                {
                  id: 'acc-1',
                  title: 'Collapsible Architecture Spec',
                  content:
                    'Built with semantic borders, full RTL directionality, and WCAG focus rings.',
                },
                {
                  id: 'acc-2',
                  title: 'Keyboard Navigation Support',
                  content:
                    'Supports Tab, Escape, Arrow keys in split views, and global shortcuts.',
                },
              ]}
            />
          </div>
        </section>
      )}

      {/* Layer 2: Extended Form Controls & FormBuilder */}
      {showInputs && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5">
          <div>
            <Heading level={3}>Extended Form Inputs, Cropper, Repeater & FormBuilder</Heading>
            <Text tone="muted" size="xs">
              Number stepper, currency separator, phone mask, range slider, rating, canvas image crop, dynamic field array, and JSON schema form.
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumberInput
              label="Seat Allocation"
              value={qty}
              onChange={setQty}
              min={1}
              max={100}
            />
            <CurrencyInput
              label="Settlement Cap"
              value={budget}
              onChange={setBudget}
              currencySymbol="$"
            />
            <PhoneInput
              label="Operations Hotline"
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              value={phone}
              onChange={setPhone}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <RangeSlider
              label="Risk Score Threshold Window"
              min={0}
              max={10000}
              value={rangeVal}
              onChange={setRangeVal}
            />
            <Rating
              label="Audit Confidence Rating"
              value={ratingVal}
              onChange={setRatingVal}
            />
            <ImageUpload
              label="Avatar / Logo Crop Upload"
              valueUrl={avatarUrl}
              onChange={setAvatarUrl}
              circular
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Repeater
              label="Invoice Line Items (Repeater)"
              items={repeaterRows}
              onChange={setRepeaterRows}
            />

            <FormBuilder
              submitLabel="Deploy Node Config"
              onSubmit={(vals) =>
                addToast({
                  title: `Saved schema for ${String(vals.serviceName)}`,
                  variant: 'success',
                })
              }
              schema={[
                {
                  name: 'serviceName',
                  label: 'Service Name',
                  type: 'text',
                  required: true,
                  defaultValue: 'Kestrel Clearing Node',
                },
                {
                  name: 'ownerEmail',
                  label: 'Owner Email',
                  type: 'email',
                  required: true,
                  defaultValue: 'ops@kestrelops.io',
                },
                {
                  name: 'autoRetry',
                  label: 'Enable Exponential Backoff',
                  type: 'switch',
                  defaultValue: true,
                },
              ]}
            />
          </div>
        </section>
      )}

      {/* Layer 2B: Enterprise Form Controls (Transfer, Cascader, TreeSelect, Masks, Conditional, Cron, Signature, Captcha) */}
      {showInputs && (
        <section
          id="kit-section-advanced-forms"
          data-testid="kit-section-advanced-forms"
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5"
        >
          <div>
            <Heading level={3}>
              Transfer List, Cascader, TreeSelect, Masks, Conditional &amp; Signature Controls
            </Heading>
            <Text tone="muted" size="xs">
              Persian digit normalization (۰-۹ → 0-9), dual-list role transfer, province/city cascader, bilingual FA/EN auto-save form, cron parser, @mention, map pin picker, signature pad, and captcha.
            </Text>
          </div>

          <TransferList
            items={[
              { id: 'p-view', label: 'orders:view (View Ledger)' },
              { id: 'p-export', label: 'orders:export (CSV & PDF)' },
              { id: 'p-approve', label: 'settlement:approve (Dual Control)' },
              { id: 'p-fa', label: 'reports:jalali (Persian Calendar)' },
              { id: 'p-keys', label: 'security:rotate_keys' },
            ]}
            initialAssignedIds={['p-view', 'p-export', 'p-fa']}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <CascaderField />
            <TreeSelectField
              options={[
                {
                  id: 'cat-rails',
                  label: 'Payment Rails',
                  children: [
                    { id: 'cat-sepa', label: 'SEPA Instant' },
                    { id: 'cat-swift', label: 'SWIFT Wire' },
                  ],
                },
                {
                  id: 'cat-compliance',
                  label: 'Compliance & Tax',
                  children: [{ id: 'cat-kyb', label: 'KYB / Sanctions' }],
                },
              ]}
            />
          </div>

          <InputGroupAndMask />
          <ConditionalAndMultiLangForm />
          <IconCronDurationControls />
          <MentionLocationSignatureCaptcha />
        </section>
      )}

      {/* Layer 3: Radar, Gauge, Calendar, Timeline, Gallery, VirtualList */}
      {showCharts && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5">
          <div>
            <Heading level={3}>Extended Data Display & Analytics</Heading>
            <Text tone="muted" size="xs">
              Radar & Gauge charts inside ChartCard, CalendarView, DescriptionList, Timeline, ImageGallery Lightbox, JsonViewer, CommentThread, and VirtualList.
            </Text>
          </div>

          <Tabs
            value={tabMode}
            onChange={setTabMode}
            urlSyncParam="kitTab"
            items={[
              {
                id: 'radar',
                label: 'Radar & Gauge Charts',
                content: (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ChartCard
                      title="Operational SLA Radar"
                      subtitle="Multi-axis platform resilience score"
                      onExportCsv={() => setExportOpen(true)}
                    >
                      <RadarChart
                        axes={[
                          { label: 'Uptime', value: 96 },
                          { label: 'Latency', value: 88 },
                          { label: 'Security', value: 94 },
                          { label: 'Throughput', value: 82 },
                          { label: 'Compliance', value: 98 },
                        ]}
                      />
                    </ChartCard>
                    <ChartCard
                      title="Settlement Capacity Gauge"
                      subtitle="Current throughput utilization"
                    >
                      <GaugeChart value={78} max={100} label="Capacity" />
                    </ChartCard>
                  </div>
                ),
              },
              {
                id: 'schedule',
                label: 'Calendar, Timeline & Details',
                content: (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <CalendarView
                      events={[
                        { id: 'ev-1', date: '2026-11-05', title: 'SEPA Cutover', tone: 'info' },
                        { id: 'ev-2', date: '2026-11-12', title: 'SOC2 Audit', tone: 'success' },
                        { id: 'ev-3', date: '2026-11-22', title: 'Key Rotation', tone: 'warning' },
                      ]}
                    />
                    <div className="space-y-4">
                      <DescriptionList
                        items={[
                          { label: 'Ledger Engine', value: 'Kestrel Core v2.6' },
                          { label: 'Primary Region', value: 'eu-west-1', mono: true },
                          { label: 'Throughput SLA', value: '99.98%' },
                          { label: 'Settlement Window', value: 'T+0 Instant' },
                        ]}
                      />
                      <Timeline
                        items={[
                          {
                            id: 't1',
                            title: 'Batch #412 signed',
                            description: 'Dual-control approval by Elena R.',
                            timestamp: '14:20 UTC',
                            tone: 'success',
                          },
                          {
                            id: 't2',
                            title: 'Webhook latency spike mitigated',
                            description: 'Automated failover shifted to eu-west-2.',
                            timestamp: '12:05 UTC',
                            tone: 'warning',
                          },
                        ]}
                      />
                    </div>
                  </div>
                ),
              },
              {
                id: 'media',
                label: 'Gallery, JSON, Comments & VirtualList',
                content: (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <ImageGallery
                        items={[
                          {
                            id: 'g1',
                            title: 'Frankfurt Vault Cluster',
                            caption: 'Primary EU-West ledger replication enclave',
                            colorFrom: '#1E293B',
                            colorTo: '#2563EB',
                          },
                          {
                            id: 'g2',
                            title: 'MENA Clearing Hub',
                            caption: 'Real-time cross-border FX settlement switch',
                            colorFrom: '#0F172A',
                            colorTo: '#059669',
                          },
                        ]}
                      />
                      <JSONViewer
                        title="Settlement Node Telemetry"
                        defaultExpandDepth={2}
                        data={{
                          node: 'eu-west-01',
                          active: true,
                          queued: 14,
                          rules: ['velocity', 'sanctions'],
                          lastCheckpoint: null,
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <CommentThread
                        initialComments={[
                          {
                            id: 'c1',
                            author: 'Elena Rostova',
                            role: 'VP Ops',
                            timestamp: '10m ago',
                            body: 'Verified treasury batch #412 across SEPA rails.',
                          },
                        ]}
                      />
                      <div className="space-y-2">
                        <input
                          type="search"
                          placeholder="Debounced filter across 120 virtual rows..."
                          value={filterText}
                          onChange={(e) => setFilterText(e.target.value)}
                          className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                        />
                        <VirtualList
                          items={pagedRows}
                          itemHeight={42}
                          height={180}
                          renderItem={(row) => (
                            <div className="w-full flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-900 dark:text-white">
                                {row.label}
                              </span>
                              <span dir="ltr" className="font-mono text-slate-500">
                                {row.id} · {row.region}
                              </span>
                            </div>
                          )}
                        />
                        <Pagination
                          page={pager.page}
                          totalPages={pager.totalPages}
                          onPageChange={pager.setPage}
                        />
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </section>
      )}

      {/* Layer 3B: Enterprise Table (Inline Edit, Group, Tree, Drag Reorder, Master-Detail, Jalali & FA Collator) */}
      {showCharts && (
        <section
          id="kit-section-enterprise-table"
          data-testid="kit-section-enterprise-table"
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5"
        >
          <div>
            <Heading level={3}>
              Enterprise Table, Cell Renderers, Diff &amp; Diagnostics
            </Heading>
            <Text tone="muted" size="xs">
              Saved views, grouped rows, tree child expansion, drag-to-reorder, master-detail drawer row, inline cell editing, summary footer, Intl.Collator(&apos;fa&apos;) sort, Jalali dates, &lt;bdi&gt; isolation, LogViewer, PDF preview, and Media player.
            </Text>
          </div>

          <EnterpriseTable />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <ChartCard title="Conversion Funnel" subtitle="Checkout to settled clearing">
              <FunnelChart
                stages={[
                  { id: 'f1', label: 'API Intent Created', value: 4200, color: '#2563EB' },
                  { id: 'f2', label: 'KYB / Sanctions Cleared', value: 3480, color: '#0EA5E9' },
                  { id: 'f3', label: 'Settlement Confirmed', value: 2940, color: '#059669' },
                ]}
              />
            </ChartCard>

            <ChartCard title="Latency vs Value Scatter" subtitle="Settlement correlation">
              <ScatterChart
                points={[
                  { id: 's1', label: 'ORD-8490', x: 42, y: 4850 },
                  { id: 's2', label: 'ORD-8491', x: 68, y: 3290 },
                  { id: 's3', label: 'ORD-8492', x: 115, y: 9200 },
                  { id: 's4', label: 'ORD-8489', x: 29, y: 1620 },
                  { id: 's5', label: 'ORD-8487', x: 84, y: 6400 },
                ]}
              />
            </ChartCard>

            <ChartCard title="Volume Treemap &amp; Barcode" subtitle="Proportional channel share">
              <div className="space-y-3">
                <TreemapChart
                  items={[
                    { id: 'tm1', label: 'Enterprise', value: 18400, tone: 'blue' },
                    { id: 'tm2', label: 'Direct', value: 9200, tone: 'emerald' },
                    { id: 'tm3', label: 'Partner', value: 5400, tone: 'amber' },
                    { id: 'tm4', label: 'Marketplace', value: 3100, tone: 'violet' },
                  ]}
                />
                <div className="flex justify-center">
                  <Barcode value="ORD-8490-EU" height={34} />
                </div>
              </div>
            </ChartCard>
          </div>

          <OrgChart
            root={{
              id: 'org-1',
              name: 'Elena Rostova',
              role: 'VP of Operations',
              department: 'Executive Ops',
              reports: [
                { id: 'org-2', name: 'Marcus Chen', role: 'Clearing Lead', department: 'EMEA' },
                { id: 'org-3', name: 'Sara Mohammadi', role: 'Treasury Lead', department: 'MENA' },
                { id: 'org-4', name: 'Hana Takahashi', role: 'Risk Lead', department: 'APAC' },
              ],
            }}
          />

          <LogViewer
            logs={[
              { id: 'l1', timestamp: '14:22:01', level: 'info', service: 'sepa-rail', message: 'Batch #412 cleared in 38ms (eu-west-1)' },
              { id: 'l2', timestamp: '14:22:14', level: 'warn', service: 'risk-engine', message: 'Velocity spike detected on ORD-8490 — queued for dual review' },
              { id: 'l3', timestamp: '14:22:45', level: 'error', service: 'webhook-worker', message: 'HTTP 502 from harborpay.io — retry scheduled (attempt 2/5)' },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PDFPreviewCard
              onDownload={() => addToast({ title: 'Downloaded Q4-EMEA-Settlement-Audit.pdf', variant: 'success' })}
            />
            <MediaPlayer />
          </div>
        </section>
      )}

      {/* Reusable JSONViewer Debugger */}
      {(showCharts || showStates) && (
        <section
          id="kit-section-json-viewer"
          data-testid="kit-section-json-viewer"
          className="scroll-mt-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Heading level={3}>JSONViewer — API Response &amp; Config Debugger</Heading>
              <Text tone="muted" size="xs">
                Syntax-highlighted tree inspector with collapsible nodes, key/value search, Prev/Next match jumping, Matches-only filter, JSONPath copy, and raw view toggle.
              </Text>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'api', label: 'API Response' },
                  { id: 'config', label: 'Config JSON' },
                  { id: 'malformed', label: 'Malformed JSON' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setJsonPreset(preset.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    jsonPreset === preset.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setJsonSurface((s) => (s === 'dark' ? 'auto' : 'dark'))}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Surface: {jsonSurface === 'dark' ? 'Dark' : 'Auto'}
              </button>
            </div>
          </div>

          <JSONViewer
            title={jsonPresets[jsonPreset].title}
            data={jsonPresets[jsonPreset].data}
            surface={jsonSurface}
            persistSearchKey="kestrel:kit-json-debugger"
            defaultExpandDepth={2}
            maxHeight="340px"
          />
        </section>
      )}

      {/* Business Workflow Modules (ApprovalFlow, VersionHistory, TrashRecovery, Attachments, Tags, TemplateEditor) */}
      {showWorkflows && (
        <section
          id="kit-section-business-modules"
          data-testid="kit-section-business-modules"
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5"
        >
          <div>
            <Heading level={3}>
              Business Workflows: Approvals, Version Restore, Trash &amp; Template Editor
            </Heading>
            <Text tone="muted" size="xs">
              Multi-stage approval flow, version history with instant restore, soft-delete trash recovery, attachments, tag manager, and variable-interpolated notification template editor.
            </Text>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Text size="xs" tone="muted" className="font-semibold uppercase tracking-wider">
                Approval Flow Stepper
              </Text>
              <ApprovalFlow
                initialStages={[
                  { id: 'ap-1', role: 'Risk Triage', assignee: 'Hana Takahashi', status: 'approved', note: 'Sanctions cleared' },
                  { id: 'ap-2', role: 'Treasury Sign-off', assignee: 'Elena Rostova', status: 'pending', note: 'Awaiting dual approval' },
                ]}
                onAction={(id, decision) =>
                  addToast({ title: `Stage ${id} marked ${decision}`, variant: decision === 'approved' ? 'success' : 'warning' })
                }
              />
            </div>

            <div className="space-y-2">
              <Text size="xs" tone="muted" className="font-semibold uppercase tracking-wider">
                Version History (With Restore)
              </Text>
              <VersionHistory
                versions={[
                  { id: 'v3', version: 'v2.6.2', author: 'Elena Rostova', timestamp: '2026-11-22 14:10', summary: 'Raised SEPA instant threshold to $50k' },
                  { id: 'v2', version: 'v2.6.1', author: 'Sara Mohammadi', timestamp: '2026-11-21 09:40', summary: 'Enabled Jalali PDF headers' },
                ]}
                onRestore={(v) => addToast({ title: `Restored ${v.version}`, variant: 'info' })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <TrashRecovery
              initialItems={[
                { id: 'ORD-8477', title: 'Draft — Cobalt Freight', entityType: 'Order', deletedAt: '2h ago' },
                { id: 'DOC-19', title: 'legacy-sepa-key.json', entityType: 'Storage File', deletedAt: '1d ago' },
              ]}
              onRestore={(item) => addToast({ title: `Restored ${item.id}`, variant: 'success' })}
            />
            <AttachmentsList />
            <TagCategoryManager />
          </div>

          <TemplateEditor />
        </section>
      )}

      {/* Layer 4–7: Overlays, ContextMenu, SplitView, RBAC, Import/Export */}
      {(showOverlays || showWorkflows || showStates) && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5">
          <div>
            <Heading level={3}>Overlays, SplitView, ContextMenu, RBAC & Wizards</Heading>
            <Text tone="muted" size="xs">
              Promise-based TypedConfirmDialog, directional drawers, right-click ContextMenu, HoverCard, draggable SplitView, RBAC switcher, and CSV ImportWizard.
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Purge Ledger Cache?',
                  message: 'This clears local materialized projections across nodes.',
                  confirmLabel: 'Purge Cache',
                  requiredPhrase: 'PURGE',
                  destructive: true,
                });
                if (ok) {
                  addToast({ title: 'Cache purged cleanly', variant: 'warning' });
                }
              }}
            >
              Typed Confirm (useConfirm)
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDrawerSide('left');
                setDrawerOpen(true);
              }}
            >
              Left Drawer
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDrawerSide('bottom');
                setDrawerOpen(true);
              }}
            >
              Bottom Sheet
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileUp className="w-3.5 h-3.5" />}
              onClick={() => setImportOpen(true)}
            >
              Import Wizard
            </Button>
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
              Export Dialog
            </Button>

            <DropdownMenu
              trigger={
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<MoreHorizontal className="w-3.5 h-3.5" />}
                >
                  DropdownMenu
                </Button>
              }
              items={[
                {
                  id: 'dup',
                  label: 'Duplicate Rule',
                  icon: <Copy className="w-3.5 h-3.5" />,
                  shortcut: '⌘D',
                  onSelect: () => addToast({ title: 'Rule duplicated', variant: 'info' }),
                },
                {
                  id: 'del',
                  label: 'Archive Entry',
                  icon: <Trash2 className="w-3.5 h-3.5" />,
                  destructive: true,
                  onSelect: () => addToast({ title: 'Archived', variant: 'warning' }),
                },
              ]}
            />

            <HoverCard
              trigger={
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-xs font-semibold text-blue-700 dark:text-blue-300 cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5" /> HoverCard Preview
                </span>
              }
              content={
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Elena Rostova · VP Ops
                  </p>
                  <p className="text-xs text-slate-500">
                    Dual-control approver with SOC2 Level-3 clearance.
                  </p>
                </div>
              }
            />
          </div>

          <ContextMenu
            items={[
              {
                id: 'ctx-1',
                label: 'Approve Selected Batch',
                icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                onSelect: () =>
                  addToast({ title: 'Batch approved via ContextMenu', variant: 'success' }),
              },
              {
                id: 'ctx-2',
                label: 'Delete Draft',
                icon: <Trash2 className="w-3.5 h-3.5" />,
                destructive: true,
                onSelect: () => addToast({ title: 'Draft deleted', variant: 'warning' }),
              },
            ]}
          >
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/60 p-4 text-xs text-slate-600 dark:text-slate-300 text-center">
              Right-click anywhere in this box to test{' '}
              <code className="font-mono font-semibold">ContextMenu</code>
            </div>
          </ContextMenu>

          <SplitView
            left={
              <div className="space-y-2">
                <Text size="sm" tone="default" className="font-semibold">
                  Resizable SplitView — Left Inspector
                </Text>
                <Text size="xs" tone="muted">
                  Drag the center handle or focus it and press ArrowLeft / ArrowRight keys.
                </Text>
              </div>
            }
            right={
              <div className="space-y-2">
                <Text size="sm" tone="default" className="font-semibold">
                  Right Workspace Preview
                </Text>
                <Tabs
                  orientation="vertical"
                  value={verticalTab}
                  onChange={setVerticalTab}
                  items={[
                    {
                      id: 'perms',
                      label: 'RBAC <Can>',
                      icon: <Shield className="w-3.5 h-3.5" />,
                      content: (
                        <div className="space-y-2.5 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-500">Active Role:</span>
                            <select
                              aria-label="Test RBAC role"
                              value={roleId}
                              onChange={(e) => setRoleId(e.target.value as typeof roleId)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="support_agent">Support Agent</option>
                            </select>
                          </div>
                          <Can
                            resource="orders"
                            action="delete"
                            fallback={
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Delete button hidden by &lt;Can resource="orders" action="delete"&gt;
                              </span>
                            }
                          >
                            <Badge tone="success">Allowed: orders:delete</Badge>
                          </Can>
                        </div>
                      ),
                    },
                    {
                      id: 'result',
                      label: 'ResultPage',
                      content: (
                        <ResultPage
                          status="success"
                          title="Ledger Snapshot Verified"
                          description="All 24 checkpoints reconciled cleanly."
                        />
                      ),
                    },
                  ]}
                />
              </div>
            }
          />

          {/* Popconfirm, BottomSheet, SessionTimeoutModal, ProductTour, BackgroundTaskManager, FeedbackWidget, OfflineBanner */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Popconfirm
                title="Revoke stale API token?"
                confirmLabel="Revoke"
                onConfirm={() => addToast({ title: 'API token revoked', variant: 'warning' })}
              >
                <Button variant="outline" size="sm">
                  Popconfirm Action
                </Button>
              </Popconfirm>
              <Button variant="secondary" size="sm" onClick={() => setBottomSheetOpen(true)}>
                Mobile BottomSheet
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setTimeoutModalOpen(true)}>
                Session Timeout Modal
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setTourOpen(true)}>
                Product Tour Coachmarks
              </Button>
              <Button
                variant={simulateOffline ? 'danger' : 'outline'}
                size="sm"
                onClick={() => setSimulateOffline((v) => !v)}
              >
                {simulateOffline ? 'Hide Offline Banner' : 'Preview Offline Indicator'}
              </Button>
            </div>

            {simulateOffline && (
              <OfflineReconnectingBanner
                forceOffline
                onRetry={() => {
                  setSimulateOffline(false);
                  addToast({ title: 'Reconnected to Kestrel ledger', variant: 'success' });
                }}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BackgroundTaskManager
                tasks={bgTasks}
                onClearCompleted={() =>
                  setBgTasks((prev) => prev.filter((t) => t.status !== 'completed'))
                }
              />
              <FeedbackWidget
                onSubmit={(p) =>
                  addToast({
                    title: `Feedback sent (${p.sentiment})`,
                    description: p.note || 'Thanks for helping improve Kestrel Ops.',
                    variant: 'success',
                  })
                }
              />
            </div>
          </div>
        </section>
      )}

      <BottomSheet
        open={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        title="Quick Settlement Actions (BottomSheet)"
      >
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p>Mobile-ergonomic bottom sheet for single-handed confirmation and quick inspection.</p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setBottomSheetOpen(false)}>
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setBottomSheetOpen(false);
                addToast({ title: 'Action confirmed from BottomSheet', variant: 'success' });
              }}
            >
              Confirm Batch
            </Button>
          </div>
        </div>
      </BottomSheet>

      <SessionTimeoutModal
        open={timeoutModalOpen}
        initialSeconds={95}
        onExtend={() => {
          setTimeoutModalOpen(false);
          addToast({ title: 'Session extended for 30 minutes', variant: 'success' });
        }}
        onSignOut={() => {
          setTimeoutModalOpen(false);
          addToast({ title: 'Signed out cleanly', variant: 'info' });
        }}
      />

      <ProductTourModal
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        steps={[
          {
            id: 't-1',
            badge: 'Workspace',
            title: 'Multi-Tenant Organization Switcher',
            description: 'Switch seamlessly between EU Clearing, MENA Treasury, and Staging Sandbox from the sidebar.',
          },
          {
            id: 't-2',
            badge: 'RTL & Jalali',
            title: 'Persian Normalization & Solar Hijri',
            description: 'Search automatically normalizes Persian/Arabic numerals and ک/ی characters across tables and logs.',
          },
          {
            id: 't-3',
            badge: 'Shortcuts',
            title: 'Press Ctrl+K Anywhere',
            description: 'Jump directly to orders, customers, file vaults, or component playgrounds from the command palette.',
          },
        ]}
      />

      <DirectionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement={drawerSide}
        title={`Directional Drawer (${drawerSide})`}
        description="Supports left, right, and bottom sheet placements."
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Use left, right, or bottom drawers depending on inspection density or mobile sheet interaction.
        </p>
      </DirectionDrawer>

      <ImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportValidRows={(rows) =>
          addToast({
            title: `Imported ${rows.length} validated CSV rows`,
            variant: 'success',
          })
        }
      />

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={({ format, scope }) =>
          addToast({
            title: `Exported ${scope} data as ${format.toUpperCase()}`,
            variant: 'success',
          })
        }
      />
    </div>
  );
}
