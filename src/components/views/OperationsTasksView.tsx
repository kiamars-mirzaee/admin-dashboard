import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  PauseCircle,
  Play,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { PageContainer, PageHeader, Section } from '../ui/LayoutPrimitives';
import { useNotifications } from '../ui/NotificationSystem';
import { Accordion, Badge, StatusDot } from '../ui/Primitives';
import { CircularProgress, ProgressBar } from '../ui/Progress';
import { ChangeLogModal, VersionBadge } from '../ui/SharedComposites';
import { Tabs } from '../ui/Tabs';

interface BackgroundJob {
  id: string;
  name: string;
  queue: string;
  progress: number;
  status: 'running' | 'completed' | 'failed' | 'queued';
  duration: string;
  retries: number;
}

const INITIAL_JOBS: BackgroundJob[] = [
  {
    id: 'JOB-941',
    name: 'EMEA SEPA Batch Settlement Export',
    queue: 'ledger-export',
    progress: 78,
    status: 'running',
    duration: '14s',
    retries: 0,
  },
  {
    id: 'JOB-940',
    name: 'SOC2 Compliance Archive Snapshot',
    queue: 'storage-vault',
    progress: 100,
    status: 'completed',
    duration: '42s',
    retries: 0,
  },
  {
    id: 'JOB-939',
    name: 'Webhook Retry — partner-apac-02',
    queue: 'webhooks',
    progress: 45,
    status: 'failed',
    duration: '9s',
    retries: 2,
  },
  {
    id: 'JOB-938',
    name: 'Nightly Customer Health Score Recompute',
    queue: 'analytics',
    progress: 0,
    status: 'queued',
    duration: '—',
    retries: 0,
  },
];

export interface OperationsTasksViewProps {
  initialTab?: 'tasks' | 'help';
}

export function OperationsTasksView({
  initialTab = 'tasks',
}: OperationsTasksViewProps) {
  const { addToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<'tasks' | 'help'>(initialTab);
  const [jobs, setJobs] = useState<BackgroundJob[]>(INITIAL_JOBS);
  const [changelogOpen, setChangelogOpen] = useState(false);

  const handleRetryJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? { ...j, status: 'running', progress: 64, retries: j.retries + 1 }
          : j
      )
    );
    addToast({
      title: `Re-queued ${id}`,
      variant: 'info',
    });
  };

  const handleCompleteJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, status: 'completed', progress: 100 } : j
      )
    );
    addToast({
      title: `Marked ${id} completed`,
      variant: 'success',
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title={activeTab === 'tasks' ? 'Tasks & Background Jobs' : 'Help, Docs & Changelog'}
        description={
          activeTab === 'tasks'
            ? 'Monitor worker queues, progress telemetry, and retry failed settlement jobs.'
            : 'Operational guides, keyboard shortcuts, and platform release notes.'
        }
        actions={
          <VersionBadge version="v2.6.0" onClick={() => setChangelogOpen(true)} />
        }
      />

      <Tabs
        value={activeTab}
        onChange={(v) => setActiveTab(v as 'tasks' | 'help')}
        ariaLabel="Operations Tasks and Help"
        items={[
          {
            id: 'tasks',
            label: 'Jobs Queue',
            badge: jobs.filter((j) => j.status === 'running' || j.status === 'failed').length,
            icon: <Clock className="w-3.5 h-3.5" aria-hidden="true" />,
            content: (
              <Section
                title="Active Worker Queues"
                description="Real-time status across ledger export, compliance vaulting, and webhook delivery."
                actions={
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() =>
                      setJobs((prev) =>
                        prev.map((j) =>
                          j.status === 'running'
                            ? { ...j, progress: Math.min(100, j.progress + 12) }
                            : j
                        )
                      )
                    }
                  >
                    Poll workers
                  </Button>
                }
              >
                <div className="space-y-3" data-testid="jobs-queue-list">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <CircularProgress value={job.progress} size={46} />
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              dir="ltr"
                              className="font-mono text-xs font-bold text-slate-900 dark:text-white"
                            >
                              {job.id}
                            </span>
                            <StatusDot
                              tone={
                                job.status === 'completed' || job.status === 'running'
                                  ? 'success'
                                  : job.status === 'failed'
                                    ? 'danger'
                                    : 'neutral'
                              }
                              label={job.status}
                              live={job.status === 'running'}
                            />
                            <Badge tone="neutral">{job.queue}</Badge>
                          </div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {job.name}
                          </p>
                          <div className="max-w-xs">
                            <ProgressBar
                              value={job.progress}
                              tone={
                                job.status === 'failed'
                                  ? 'error'
                                  : job.status === 'completed'
                                    ? 'success'
                                    : 'default'
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          dir="ltr"
                          className="font-mono text-xs text-slate-500 dark:text-slate-400"
                        >
                          {job.duration} · retries:{job.retries}
                        </span>
                        {job.status === 'failed' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Play className="w-3.5 h-3.5" />}
                            onClick={() => handleRetryJob(job.id)}
                          >
                            Retry
                          </Button>
                        )}
                        {(job.status === 'running' || job.status === 'queued') && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => handleCompleteJob(job.id)}
                          >
                            Finish
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            ),
          },
          {
            id: 'help',
            label: 'Help & Changelog',
            icon: <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />,
            content: (
              <div className="space-y-4" data-testid="help-support-panel">
                <Section
                  title="Operations Playbook & FAQs"
                  description="Quick answers for keyboard navigation, CSV imports, and compliance vaults."
                  actions={
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      onClick={() => setChangelogOpen(true)}
                    >
                      Open Changelog
                    </Button>
                  }
                >
                  <Accordion
                    defaultOpenId="faq-1"
                    items={[
                      {
                        id: 'faq-1',
                        title: 'How do I navigate quickly with Command Palette, Favorites, and Shortcuts?',
                        content:
                          'Press Ctrl+K (or Cmd+K on macOS) anywhere to open the fuzzy Command Palette across orders, customers, routes, and component sections. Pin frequent queues or records to the Quick Access Favorites Bar below the header, or press ? to view two-key Vim chords (G+O, G+L, G+F, G+C, G+S, G+K).',
                      },
                      {
                        id: 'faq-2',
                        title: 'How do I filter Time-Series Analytics and export Orders or Grids to PDF?',
                        content:
                          'On Overview or Reports & Heatmap, switch between Area, Line, Bar, Stacked, Composed, and Donut views while slicing by date range (7D, 30D, 90D, Custom), granularity (Day, Week, Month), metric, channels, and statuses. In the Orders Ledger or Order Detail Drawer, click Print / Export PDF to generate landscape tables or portrait dispatch sheets with verification QR codes (including full RTL/Arabic/Persian canvas rendering).',
                      },
                      {
                        id: 'faq-3',
                        title: 'How does File Storage and scoped modal form selection work?',
                        content:
                          'Open File Storage from the sidebar to browse in Open Folder or Split Tree mode, create folders/files, drag-and-drop upload, or edit text/JSON/CSV files inline. Inside forms, FileStoragePickerModal and StorageFormField accept a rootFolderId prop to lock browsing, search, and uploads strictly inside a predefined directory such as Partner Contracts or Compliance & SOC2.',
                      },
                      {
                        id: 'faq-4',
                        title: 'How do DataGrid customization, Kanban status flow, and RBAC work?',
                        content:
                          'In the Orders Ledger, toggle Compact/Standard density, resize or reorder/pin columns, and run scoped bulk actions across selected rows or active filters. Use Commerce → Orders → Kanban board to move orders across status stages, and Admin & security → Users & permissions to configure the Role & Permission Matrix and inspect active sessions.',
                      },
                      {
                        id: 'faq-5',
                        title: 'How do I inspect API payloads or configs with JSONViewer and the UI Kit?',
                        content:
                          'Open UI System → All components to test 40+ primitives, Gregorian & Persian (Jalali) pickers, FormWizard, Rich Text & Markdown editors, and the JSONViewer debugger—featuring syntax highlighting, collapsible nodes, key/value search with Prev/Next jumping, Matches-only filtering, JSONPath copy, and raw view toggle.',
                      },
                    ]}
                  />
                </Section>

                <Section title="Support Channels">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        On-Call Engineering
                      </p>
                      <p dir="ltr" className="font-mono text-slate-500 mt-1">
                        ops-oncall@kestrelops.io
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        SLA Response Target
                      </p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        &lt; 15 minutes (P1 Incident)
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          Scheduled Freeze
                        </p>
                        <p className="text-slate-500 mt-1">Sundays 02:00 UTC</p>
                      </div>
                      <PauseCircle className="w-5 h-5 text-slate-400" aria-hidden="true" />
                    </div>
                  </div>
                </Section>
              </div>
            ),
          },
        ]}
      />

      <ChangeLogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </PageContainer>
  );
}
