import { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  FolderGit2,
  GitCommitHorizontal,
  MessageSquareText,
  Search,
  Send,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import {
  createTicketConversionEntry,
  filterTicketConversionLog,
  INITIAL_TICKET_CONVERSION_LOG,
  type TicketConversionEntry,
  type TicketLogKind,
} from '../../utils/workTemplates';
import { Button } from './Button';

export interface TicketConversionLogProps {
  entries?: TicketConversionEntry[];
  onAppendEntry?: (entry: TicketConversionEntry) => void;
  activeTicketId?: string;
  className?: string;
}

export function TicketConversionLog({
  entries: controlledEntries,
  onAppendEntry,
  activeTicketId = 'TCK-2048',
  className = '',
}: TicketConversionLogProps) {
  const { t } = useI18n();
  const [internalEntries, setInternalEntries] = useState<TicketConversionEntry[]>(
    INITIAL_TICKET_CONVERSION_LOG
  );
  const [kindFilter, setKindFilter] = useState<'all' | TicketLogKind>('all');
  const [query, setQuery] = useState('');
  const [noteText, setNoteText] = useState('');

  const entries = controlledEntries ?? internalEntries;

  const appendEntry = (entry: TicketConversionEntry) => {
    if (onAppendEntry) {
      onAppendEntry(entry);
    } else {
      setInternalEntries((prev) => [entry, ...prev]);
    }
  };

  const filtered = useMemo(
    () => filterTicketConversionLog(entries, kindFilter, query),
    [entries, kindFilter, query]
  );

  const handleConvertToTask = () => {
    const targetId = `TSK-${420 + entries.length}`;
    appendEntry(
      createTicketConversionEntry({
        ticketId: activeTicketId,
        kind: 'conversion',
        actor: 'Elena Rostova',
        timestamp: '2026-11-22 12:10',
        summary: `Converted ${activeTicketId} follow-up action into ${targetId}`,
        fromValue: activeTicketId,
        toValue: targetId,
        targetEntityId: targetId,
        targetEntityType: 'Task',
      })
    );
  };

  const handleEscalateToProject = () => {
    const targetId = `PRJ-${110 + entries.length}`;
    appendEntry(
      createTicketConversionEntry({
        ticketId: activeTicketId,
        kind: 'conversion',
        actor: 'Tariq Mansoor',
        timestamp: '2026-11-22 12:12',
        summary: `Escalated ${activeTicketId} scope to project ${targetId}`,
        fromValue: activeTicketId,
        toValue: targetId,
        targetEntityId: targetId,
        targetEntityType: 'Project',
      })
    );
  };

  const handleAddNote = () => {
    const clean = noteText.trim();
    if (!clean) return;
    appendEntry(
      createTicketConversionEntry({
        ticketId: activeTicketId,
        kind: 'note',
        actor: 'Elena Rostova',
        timestamp: '2026-11-22 12:15',
        summary: clean,
      })
    );
    setNoteText('');
  };

  const filterTabs: { id: 'all' | TicketLogKind; label: string }[] = [
    { id: 'all', label: t('tlogTabAll') },
    { id: 'conversion', label: t('tlogTabConversions') },
    { id: 'status', label: t('tlogTabStatus') },
    { id: 'note', label: t('tlogTabNotes') },
  ];

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <ArrowRightLeft
              className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t('tlogTitle')}
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('tlogSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
            onClick={handleConvertToTask}
          >
            {t('tlogConvertToTaskBtn')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<FolderGit2 className="w-3.5 h-3.5" />}
            onClick={handleEscalateToProject}
          >
            {t('tlogEscalateProjectBtn')}
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar max-w-full">
          {filterTabs.map((tab) => {
            const active = kindFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setKindFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 sm:max-w-[230px]">
          <Search
            className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('tlogSearchPlaceholder')}
            className="min-h-[38px] w-full ps-8 pe-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Log Timeline */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pe-1">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            {t('tlogEmpty')}
          </p>
        ) : (
          filtered.map((entry) => {
            const Icon =
              entry.kind === 'conversion'
                ? ArrowRightLeft
                : entry.kind === 'status'
                  ? GitCommitHorizontal
                  : MessageSquareText;

            const kindLabel =
              entry.kind === 'conversion'
                ? t('tlogConvertedBadge')
                : entry.kind === 'status'
                  ? t('tlogStatusBadge')
                  : t('tlogNoteBadge');

            const kindColor =
              entry.kind === 'conversion'
                ? 'text-emerald-700 dark:text-emerald-400'
                : entry.kind === 'status'
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-amber-700 dark:text-amber-400';

            return (
              <div
                key={entry.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 font-semibold ${kindColor}`}>
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{kindLabel}</span>
                    </span>
                    <span dir="ltr" className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                      {entry.ticketId}
                    </span>
                  </div>
                  <span dir="ltr" className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                    {entry.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed">
                  {entry.summary}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{entry.actor}</span>
                  {(entry.fromValue || entry.toValue) && (
                    <span
                      dir="ltr"
                      className="font-mono font-medium text-slate-700 dark:text-slate-200"
                    >
                      {entry.fromValue ?? '—'} → {entry.toValue ?? '—'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Append Audit Note */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddNote();
            }
          }}
          placeholder={t('tlogNotePlaceholder')}
          className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <Button
          size="sm"
          variant="primary"
          leftIcon={<Send className="w-3.5 h-3.5" />}
          onClick={handleAddNote}
        >
          {t('tlogAddNoteBtn')}
        </Button>
      </div>
    </div>
  );
}
