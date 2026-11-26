import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  History,
  Info,
  Search,
  ShieldAlert,
} from 'lucide-react';
import type { AuditLogCategory, NotificationSeverity } from '../../types/admin';
import { INITIAL_AUDIT_LOGS, filterAuditLogs } from '../../utils/adminSuite';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../ui/Button';
import { DiffViewer } from '../ui/EnterpriseDataKit';
import { EmptyState } from '../ui/EmptyState';
import { SegmentedControl } from '../ui/SegmentedControl';

export function AuditLogView() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AuditLogCategory | 'all'>('all');
  const [severity, setSeverity] = useState<NotificationSeverity | 'all'>('all');
  const [expandedDiffId, setExpandedDiffId] = useState<string | null>(INITIAL_AUDIT_LOGS[0]?.id ?? null);

  const filtered = useMemo(
    () => filterAuditLogs(INITIAL_AUDIT_LOGS, { query, category, severity }),
    [query, category, severity]
  );

  const severityIcon = (sev: NotificationSeverity) => {
    switch (sev) {
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

  const hasFilters = Boolean(query.trim()) || category !== 'all' || severity !== 'all';

  return (
    <div className="space-y-5" data-testid="audit-log-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('auditTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('auditSubtitle')}
          </p>
        </div>

        <span dir="ltr" className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {filtered.length} / {INITIAL_AUDIT_LOGS.length} events
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('auditSearchPlaceholder')}
            aria-label={t('auditSearchPlaceholder')}
            className="w-full min-h-[42px] ps-10 pe-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <SegmentedControl
          ariaLabel={t('auditAllCategories')}
          value={category}
          onChange={setCategory}
          options={[
            { value: 'all', label: t('all') },
            { value: 'order', label: t('auditCatOrder') },
            { value: 'auth', label: t('auditCatAuth') },
            { value: 'security', label: t('auditCatSecurity') },
            { value: 'storage', label: t('auditCatStorage') },
            { value: 'settings', label: t('auditCatSettings') },
          ]}
        />

        <select
          aria-label="Filter severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value as NotificationSeverity | 'all')}
          className="min-h-[40px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
        >
          <option value="all">{t('all')}</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setCategory('all');
              setSeverity('all');
            }}
          >
            {t('clearAll')}
          </Button>
        )}
      </div>

      {/* Events List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<History className="w-5 h-5" />}
          title={t('noMatchingOrders')}
          description={t('noMatchingOrdersDesc')}
          actionLabel={t('clearAllFilters')}
          onAction={() => {
            setQuery('');
            setCategory('all');
            setSeverity('all');
          }}
        />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((entry) => (
            <article
              key={entry.id}
              className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                {severityIcon(entry.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {entry.action}{' '}
                    <span dir="ltr" className="font-mono text-xs text-blue-600 dark:text-blue-400">
                      {entry.target}
                    </span>
                  </p>
                  <span dir="ltr" className="font-mono text-xs text-slate-400 tabular-nums">
                    {entry.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {entry.details}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[11px] text-slate-400">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {entry.actor}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span dir="ltr" className="font-mono">
                      {entry.actorEmail}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span dir="ltr" className="font-mono">
                      {entry.ip}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase font-mono">{entry.category}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedDiffId((cur) => (cur === entry.id ? null : entry.id))}
                    className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                  >
                    {expandedDiffId === entry.id ? 'Hide diff' : 'Inspect diff'}
                  </button>
                </div>

                {expandedDiffId === entry.id && (
                  <div className="mt-3">
                    <DiffViewer
                      title={`State Diff · ${entry.target}`}
                      before={{
                        target: entry.target,
                        status: 'pending_review',
                        dualControl: false,
                        actor: entry.actor,
                      }}
                      after={{
                        target: entry.target,
                        status: entry.severity === 'warning' ? 'flagged' : 'verified',
                        dualControl: true,
                        actor: entry.actor,
                        verifiedIp: entry.ip,
                      }}
                    />
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
