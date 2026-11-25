import { useMemo, useState } from 'react';
import { Check, Link2, Plus, Ticket, Trash2 } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type {
  TaskPriority,
  TicketCategory,
  TicketLinkedTask,
} from '../../utils/workTemplates';
import { Button } from './Button';

export interface TicketWithTasksPayload {
  id: string;
  subject: string;
  category: TicketCategory;
  priority: TaskPriority;
  requester: string;
  description: string;
  linkedTasks: TicketLinkedTask[];
}

export interface TicketWithTasksProps {
  onCreateTicket?: (payload: TicketWithTasksPayload) => void;
  className?: string;
}

const CATEGORIES: TicketCategory[] = ['Operations', 'Security', 'Billing', 'Technical'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

export function TicketWithTasks({
  onCreateTicket,
  className = '',
}: TicketWithTasksProps) {
  const { t } = useI18n();
  const [ticketSeq, setTicketSeq] = useState(2049);
  const [subject, setSubject] = useState('SEPA webhook retry spike on enterprise gateway');
  const [category, setCategory] = useState<TicketCategory>('Technical');
  const [priority, setPriority] = useState<TaskPriority>('High');
  const [requester, setRequester] = useState('HarborPay Systems');
  const [description, setDescription] = useState(
    'Settlement confirmations delayed by ~14s during batch rollover.'
  );
  const [linkedTasks, setLinkedTasks] = useState<TicketLinkedTask[]>([
    {
      id: 'TSK-421',
      title: 'Inspect EU-West webhook dead-letter queue',
      assignee: 'Tariq Mansoor',
      dueDate: '2026-11-23',
      priority: 'Urgent',
      done: false,
    },
    {
      id: 'TSK-422',
      title: 'Notify HarborPay account lead with ETA',
      assignee: 'Elena Rostova',
      dueDate: '2026-11-22',
      priority: 'High',
      done: true,
    },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Sara Rahimi');
  const [lastCreatedInfo, setLastCreatedInfo] = useState<string | null>(null);

  const doneCount = useMemo(
    () => linkedTasks.filter((item) => item.done).length,
    [linkedTasks]
  );

  const handleAttachTask = () => {
    const clean = newTaskTitle.trim();
    if (!clean) return;
    const nextNum = 421 + linkedTasks.length + Math.floor(Math.random() * 10);
    setLinkedTasks((prev) => [
      ...prev,
      {
        id: `TSK-${nextNum}`,
        title: clean,
        assignee: newTaskAssignee.trim() || 'Elena Rostova',
        dueDate: '2026-11-24',
        priority,
        done: false,
      },
    ]);
    setNewTaskTitle('');
  };

  const toggleLinkedTask = (id: string) => {
    setLinkedTasks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const removeLinkedTask = (id: string) => {
    setLinkedTasks((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = () => {
    const ticketId = `TCK-${ticketSeq}`;
    const payload: TicketWithTasksPayload = {
      id: ticketId,
      subject: subject.trim() || t('tktTitle'),
      category,
      priority,
      requester: requester.trim() || 'Enterprise Account',
      description: description.trim(),
      linkedTasks,
    };
    onCreateTicket?.(payload);
    setTicketSeq((n) => n + 1);
    setLastCreatedInfo(
      t('tktCreatedSummary', { id: ticketId, count: linkedTasks.length })
    );
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t('tktTitle')}
          </h4>
        </div>
        <span dir="ltr" className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
          TCK-{ticketSeq}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="ticket-subject"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t('tktSubjectLabel')}
          </label>
          <input
            id="ticket-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('tktSubjectPlaceholder')}
            className="min-h-[42px] w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label
              htmlFor="ticket-category"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
            >
              {t('tktCategoryLabel')}
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
              className="min-h-[40px] w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ticket-priority"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
            >
              {t('tskPriorityLabel')}
            </label>
            <select
              id="ticket-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="min-h-[40px] w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ticket-requester"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
            >
              {t('tktRequesterLabel')}
            </label>
            <input
              id="ticket-requester"
              type="text"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              className="min-h-[40px] w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="ticket-desc"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t('tktDescLabel')}
          </label>
          <textarea
            id="ticket-desc"
            dir="auto"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Linked Tasks Section */}
      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
            <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            {t('tktLinkedTasksHeading', {
              done: doneCount,
              total: linkedTasks.length,
            })}
          </span>
        </div>

        <div className="space-y-1.5">
          {linkedTasks.map((task) => (
            <div
              key={task.id}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={task.done}
                aria-label={task.title}
                onClick={() => toggleLinkedTask(task.id)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer ${
                  task.done
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950'
                }`}
              >
                {task.done && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    dir="ltr"
                    className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400 shrink-0"
                  >
                    {task.id}
                  </span>
                  <p
                    className={`text-xs font-medium truncate ${
                      task.done
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {task.title}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>{task.assignee}</span>
                  <span>·</span>
                  <span dir="ltr" className="tabular-nums">
                    {task.dueDate}
                  </span>
                </p>
              </div>

              <button
                type="button"
                aria-label={t('upRemove')}
                onClick={() => removeLinkedTask(task.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>

        {/* Inline attach task */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAttachTask();
              }
            }}
            placeholder={t('tktAddTaskPlaceholder')}
            className="flex-1 min-w-[170px] min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="text"
            aria-label="Assignee"
            value={newTaskAssignee}
            onChange={(e) => setNewTaskAssignee(e.target.value)}
            className="w-28 min-h-[40px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleAttachTask}
          >
            {t('tktAddTaskBtn')}
          </Button>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
          {lastCreatedInfo ?? ''}
        </span>
        <Button size="md" variant="primary" onClick={handleSubmit}>
          {t('tktCreateBtn')}
        </Button>
      </div>
    </div>
  );
}
