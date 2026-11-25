import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  ListChecks,
  Plus,
  Trash2,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';
import {
  applyTaskTemplate,
  computeTaskSubtaskStats,
  type SubtaskItem,
  TASK_TEMPLATES,
  type TaskPriority,
} from '../../utils/workTemplates';
import { Button } from './Button';

export interface TaskWithSubtaskTemplateProps {
  onCreateTask?: (payload: {
    title: string;
    priority: TaskPriority;
    subtasks: SubtaskItem[];
  }) => void;
  className?: string;
}

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

export function TaskWithSubtaskTemplate({
  onCreateTask,
  className = '',
}: TaskWithSubtaskTemplateProps) {
  const { t } = useI18n();
  const initial = applyTaskTemplate('compliance-onboarding');

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('compliance-onboarding');
  const [title, setTitle] = useState(initial.title);
  const [priority, setPriority] = useState<TaskPriority>(initial.priority);
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>(initial.subtasks);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskHours, setNewSubtaskHours] = useState('1.5');
  const [createdCount, setCreatedCount] = useState(0);

  const stats = useMemo(() => computeTaskSubtaskStats(subtasks), [subtasks]);

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    if (tplId === 'blank') {
      setTitle('');
      setPriority('Medium');
      setSubtasks([]);
      return;
    }
    const applied = applyTaskTemplate(tplId);
    setTitle(applied.title);
    setPriority(applied.priority);
    setSubtasks(applied.subtasks);
  };

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const moveSubtask = (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= subtasks.length) return;
    setSubtasks((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, item);
      return copy;
    });
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    const hrs = Math.max(0.5, Number(newSubtaskHours) || 1);
    setSubtasks((prev) => [
      ...prev,
      {
        id: `sub-custom-${Date.now()}-${prev.length}`,
        title: trimmed,
        assignee: 'Elena Rostova',
        estimateHours: hrs,
        priority: 'Medium',
        done: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleSubmit = () => {
    const cleanTitle = title.trim() || t('tskTitle');
    onCreateTask?.({
      title: cleanTitle,
      priority,
      subtasks,
    });
    setCreatedCount((c) => c + 1);
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t('tskTitle')}
          </h4>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
          {t('tskTotalHours', { hours: stats.totalHours })}
        </span>
      </div>

      {/* Template selector */}
      <div className="space-y-1.5">
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
          {t('tskTemplateLabel')}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {TASK_TEMPLATES.map((tpl) => {
            const active = selectedTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleSelectTemplate(tpl.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t(tpl.nameKey as TranslationKey)}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={selectedTemplateId === 'blank'}
            onClick={() => handleSelectTemplate('blank')}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              selectedTemplateId === 'blank'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('tplBlank')}
          </button>
        </div>
      </div>

      {/* Task Title & Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label
            htmlFor="task-tpl-title"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t('tskTaskTitleLabel')}
          </label>
          <input
            id="task-tpl-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('tskTaskPlaceholder')}
            className="min-h-[42px] w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label
            htmlFor="task-tpl-priority"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t('tskPriorityLabel')}
          </label>
          <select
            id="task-tpl-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="min-h-[42px] w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subtask progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {t('tskSubtasksHeading', { done: stats.completed, total: stats.total })}
          </span>
          <span dir="ltr" className="tabular-nums font-mono text-slate-500 dark:text-slate-400">
            {stats.progressPct}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-200"
            style={{ width: `${stats.progressPct}%` }}
          />
        </div>
      </div>

      {/* Subtask checklist */}
      <div className="space-y-2">
        {subtasks.map((sub, idx) => (
          <div
            key={sub.id}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5"
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={sub.done}
              aria-label={sub.title}
              onClick={() => toggleSubtask(sub.id)}
              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                sub.done
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950'
              }`}
            >
              {sub.done && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
            </button>

            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-medium truncate ${
                  sub.done
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-800 dark:text-slate-100'
                }`}
              >
                {sub.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{sub.assignee}</span>
                <span>·</span>
                <span dir="ltr" className="inline-flex items-center gap-0.5 tabular-nums">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {sub.estimateHours}h
                </span>
              </p>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                aria-label="Move up"
                disabled={idx === 0}
                onClick={() => moveSubtask(idx, -1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={idx === subtasks.length - 1}
                onClick={() => moveSubtask(idx, 1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={t('upRemove')}
                onClick={() => removeSubtask(sub.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add subtask step */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddSubtask();
            }
          }}
          placeholder={t('tskAddSubtaskPlaceholder')}
          className="flex-1 min-w-[170px] min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <input
          type="number"
          dir="ltr"
          min="0.5"
          step="0.5"
          aria-label="Hours"
          value={newSubtaskHours}
          onChange={(e) => setNewSubtaskHours(e.target.value)}
          className="w-16 min-h-[40px] px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-center tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={handleAddSubtask}
        >
          {t('tskAddSubtaskBtn')}
        </Button>
      </div>

      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {createdCount > 0 ? `#${createdCount} · ${title}` : `${stats.total} steps`}
        </span>
        <Button size="md" variant="primary" onClick={handleSubmit}>
          {t('tskCreateBtn')}
        </Button>
      </div>
    </div>
  );
}
