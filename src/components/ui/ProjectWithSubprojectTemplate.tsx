import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Plus,
  Trash2,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';
import { formatNumberValue } from '../../utils/numberFormat';
import {
  applyProjectTemplate,
  computeProjectRollup,
  PROJECT_TEMPLATES,
  type SubprojectItem,
} from '../../utils/workTemplates';
import { Button } from './Button';

export interface ProjectWithSubprojectTemplateProps {
  onCreateProject?: (payload: {
    name: string;
    lead: string;
    subprojects: SubprojectItem[];
  }) => void;
  className?: string;
}

export function ProjectWithSubprojectTemplate({
  onCreateProject,
  className = '',
}: ProjectWithSubprojectTemplateProps) {
  const { t } = useI18n();
  const initial = applyProjectTemplate('multi-region-rollout');

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('multi-region-rollout');
  const [projectName, setProjectName] = useState(initial.name);
  const [projectLead, setProjectLead] = useState('Elena Rostova');
  const [subprojects, setSubprojects] = useState<SubprojectItem[]>(initial.subprojects);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const first = initial.subprojects[0]?.id;
    return first ? { [first]: true } : {};
  });
  const [newSubName, setNewSubName] = useState('');
  const [newSubBudget, setNewSubBudget] = useState('15000');

  const rollup = useMemo(() => computeProjectRollup(subprojects), [subprojects]);

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    if (tplId === 'blank') {
      setProjectName('');
      setSubprojects([]);
      setExpandedIds({});
      return;
    }
    const applied = applyProjectTemplate(tplId);
    setProjectName(applied.name);
    setSubprojects(applied.subprojects);
    const first = applied.subprojects[0]?.id;
    setExpandedIds(first ? { [first]: true } : {});
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMilestone = (spId: string, msId: string) => {
    setSubprojects((prev) =>
      prev.map((sp) =>
        sp.id === spId
          ? {
              ...sp,
              milestones: sp.milestones.map((m) =>
                m.id === msId ? { ...m, done: !m.done } : m
              ),
            }
          : sp
      )
    );
  };

  const removeSubproject = (spId: string) => {
    setSubprojects((prev) => prev.filter((sp) => sp.id !== spId));
  };

  const handleAddSubproject = () => {
    const clean = newSubName.trim();
    if (!clean) return;
    const budget = Math.max(0, Number(newSubBudget) || 0);
    const nextNum = 101 + subprojects.length;
    const newId = `sp-custom-${Date.now()}`;
    setSubprojects((prev) => [
      ...prev,
      {
        id: newId,
        code: `SUB-${nextNum}`,
        name: clean,
        lead: projectLead || 'Elena Rostova',
        budget,
        status: 'Planned',
        milestones: [
          { id: `ms-${Date.now()}-1`, title: 'Kickoff & scope sign-off', done: false },
        ],
      },
    ]);
    setExpandedIds((prev) => ({ ...prev, [newId]: true }));
    setNewSubName('');
  };

  const handleCreate = () => {
    onCreateProject?.({
      name: projectName.trim() || t('prjTitle'),
      lead: projectLead.trim() || 'Elena Rostova',
      subprojects,
    });
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t('prjTitle')}
          </h4>
        </div>
        <span dir="ltr" className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
          {formatNumberValue(rollup.totalBudget, { style: 'currency', decimals: 0 })}
        </span>
      </div>

      {/* Subproject Template selector */}
      <div className="space-y-1.5">
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
          {t('prjTemplateLabel')}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PROJECT_TEMPLATES.map((tpl) => {
            const active = selectedTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleSelectTemplate(tpl.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600'
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
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('tplBlank')}
          </button>
        </div>
      </div>

      {/* Project Name & Lead */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label
            htmlFor="proj-tpl-name"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t('prjNameLabel')}
          </label>
          <input
            id="proj-tpl-name"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={t('prjNamePlaceholder')}
            className="min-h-[42px] w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label
            htmlFor="proj-tpl-lead"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1"
          >
            {t('prjLeadLabel')}
          </label>
          <input
            id="proj-tpl-lead"
            type="text"
            value={projectLead}
            onChange={(e) => setProjectLead(e.target.value)}
            className="min-h-[42px] w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Subprojects Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {t('prjSubprojectsHeading', { count: rollup.subprojectCount })}
        </span>
        <span className="text-slate-500 dark:text-slate-400 tabular-nums">
          {t('prjMilestones', {
            done: rollup.completedMilestones,
            total: rollup.totalMilestones,
          })}
        </span>
      </div>

      {/* Subproject Accordion Cards */}
      <div className="space-y-2">
        {subprojects.map((sp) => {
          const isOpen = Boolean(expandedIds[sp.id]);
          const doneMs = sp.milestones.filter((m) => m.done).length;
          return (
            <div
              key={sp.id}
              className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-2.5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleExpand(sp.id)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-start cursor-pointer"
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  )}
                  <span
                    dir="ltr"
                    className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400 shrink-0"
                  >
                    {sp.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {sp.name}
                  </span>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <span dir="ltr" className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                    {formatNumberValue(sp.budget, { style: 'currency', decimals: 0 })}
                  </span>
                  <button
                    type="button"
                    aria-label={t('upRemove')}
                    onClick={() => removeSubproject(sp.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {t('prjLeadLabel')}: <strong className="text-slate-700 dark:text-slate-200">{sp.lead}</strong>
                    </span>
                    <span className="tabular-nums">
                      {t('prjMilestones', { done: doneMs, total: sp.milestones.length })}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {sp.milestones.map((ms) => (
                      <button
                        key={ms.id}
                        type="button"
                        onClick={() => toggleMilestone(sp.id, ms.id)}
                        className="w-full py-1 px-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-900 flex items-center gap-2 text-start text-xs cursor-pointer"
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            ms.done
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950'
                          }`}
                        >
                          {ms.done && <Check className="w-3 h-3" aria-hidden="true" />}
                        </span>
                        <span
                          className={
                            ms.done
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-700 dark:text-slate-200'
                          }
                        >
                          {ms.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Subproject Inline */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={newSubName}
          onChange={(e) => setNewSubName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddSubproject();
            }
          }}
          placeholder={t('prjAddSubprojectPlaceholder')}
          className="flex-1 min-w-[170px] min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <input
          type="number"
          dir="ltr"
          min="0"
          step="1000"
          aria-label={t('prjBudgetLabel')}
          value={newSubBudget}
          onChange={(e) => setNewSubBudget(e.target.value)}
          className="w-24 min-h-[40px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-end tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={handleAddSubproject}
        >
          {t('prjAddSubprojectBtn')}
        </Button>
      </div>

      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {t('prjBudgetLabel')}:{' '}
          <strong dir="ltr" className="text-slate-800 dark:text-slate-100">
            {formatNumberValue(rollup.totalBudget, { style: 'currency', decimals: 0 })}
          </strong>
        </span>
        <Button size="md" variant="primary" onClick={handleCreate}>
          {t('prjCreateBtn')}
        </Button>
      </div>
    </div>
  );
}
