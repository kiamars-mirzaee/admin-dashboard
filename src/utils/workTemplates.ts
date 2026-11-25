export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface SubtaskItem {
  id: string;
  title: string;
  assignee: string;
  estimateHours: number;
  priority: TaskPriority;
  done: boolean;
}

export interface TaskTemplate {
  id: string;
  nameKey: string;
  defaultTitle: string;
  defaultPriority: TaskPriority;
  subtasks: Omit<SubtaskItem, 'id'>[];
}

export interface SubprojectItem {
  id: string;
  code: string;
  name: string;
  lead: string;
  budget: number;
  status: 'Planned' | 'Active' | 'Completed';
  milestones: { id: string; title: string; done: boolean }[];
}

export interface ProjectTemplate {
  id: string;
  nameKey: string;
  defaultName: string;
  subprojects: Omit<SubprojectItem, 'id'>[];
}

export type TicketCategory = 'Operations' | 'Security' | 'Billing' | 'Technical';

export interface TicketLinkedTask {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  done: boolean;
}

export type TicketLogKind = 'conversion' | 'status' | 'note' | 'assignment';

export interface TicketConversionEntry {
  id: string;
  ticketId: string;
  kind: TicketLogKind;
  actor: string;
  timestamp: string;
  summary: string;
  fromValue?: string;
  toValue?: string;
  targetEntityId?: string;
  targetEntityType?: 'Task' | 'Project' | 'Subproject';
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'compliance-onboarding',
    nameKey: 'tplTaskCompliance',
    defaultTitle: 'Enterprise compliance onboarding',
    defaultPriority: 'High',
    subtasks: [
      {
        title: 'Verify KYB & beneficial ownership dossier',
        assignee: 'Elena Rostova',
        estimateHours: 2,
        priority: 'High',
        done: true,
      },
      {
        title: 'Provision dedicated KMS encryption key',
        assignee: 'Tariq Mansoor',
        estimateHours: 3,
        priority: 'Urgent',
        done: false,
      },
      {
        title: 'Run dual-control settlement dry run',
        assignee: 'Sara Rahimi',
        estimateHours: 1.5,
        priority: 'Medium',
        done: false,
      },
    ],
  },
  {
    id: 'release-verification',
    nameKey: 'tplTaskRelease',
    defaultTitle: 'Production release sign-off',
    defaultPriority: 'Urgent',
    subtasks: [
      {
        title: 'Confirm canary error budget below 0.05%',
        assignee: 'Devon Alverez',
        estimateHours: 1,
        priority: 'Urgent',
        done: true,
      },
      {
        title: 'Verify webhook signature rotation',
        assignee: 'Nadia Haddad',
        estimateHours: 2,
        priority: 'High',
        done: false,
      },
      {
        title: 'Publish changelog & rollback runbook',
        assignee: 'Marcus Chen',
        estimateHours: 1,
        priority: 'Low',
        done: false,
      },
    ],
  },
  {
    id: 'incident-triage',
    nameKey: 'tplTaskIncident',
    defaultTitle: 'Payment gateway latency triage',
    defaultPriority: 'Urgent',
    subtasks: [
      {
        title: 'Capture p99 trace snapshot across EU-West',
        assignee: 'Tariq Mansoor',
        estimateHours: 1.5,
        priority: 'Urgent',
        done: false,
      },
      {
        title: 'Failover secondary settlement rail',
        assignee: 'Elena Rostova',
        estimateHours: 2,
        priority: 'High',
        done: false,
      },
    ],
  },
];

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'multi-region-rollout',
    nameKey: 'tplProjRollout',
    defaultName: 'MENA & EU Clearing Expansion',
    subprojects: [
      {
        code: 'SUB-101',
        name: 'Core Settlement Rail Integration',
        lead: 'Tariq Mansoor',
        budget: 48000,
        status: 'Active',
        milestones: [
          { id: 'm1', title: 'ISO-20022 schema validation', done: true },
          { id: 'm2', title: 'Sandbox stress benchmark', done: false },
        ],
      },
      {
        code: 'SUB-102',
        name: 'Regional Compliance & Data Residency',
        lead: 'Nadia Haddad',
        budget: 32500,
        status: 'Planned',
        milestones: [
          { id: 'm3', title: 'Local vault provisioning', done: false },
          { id: 'm4', title: 'SOC 2 evidence sign-off', done: false },
        ],
      },
    ],
  },
  {
    id: 'enterprise-migration',
    nameKey: 'tplProjMigration',
    defaultName: 'Zero-Downtime Ledger Migration',
    subprojects: [
      {
        code: 'SUB-201',
        name: 'Dual-Write Shadow Pipeline',
        lead: 'Marcus Chen',
        budget: 27000,
        status: 'Active',
        milestones: [
          { id: 'm5', title: 'Backfill historical ledger partitions', done: true },
          { id: 'm6', title: 'Parity diff check (< 0.001%)', done: true },
        ],
      },
      {
        code: 'SUB-202',
        name: 'Cutover & Merchant Notification',
        lead: 'Elena Rostova',
        budget: 14500,
        status: 'Planned',
        milestones: [
          { id: 'm7', title: 'DNS weighted cutover', done: false },
        ],
      },
    ],
  },
];

export const INITIAL_TICKET_CONVERSION_LOG: TicketConversionEntry[] = [
  {
    id: 'LOG-901',
    ticketId: 'TCK-2048',
    kind: 'status',
    actor: 'Elena Rostova',
    timestamp: '2026-11-22 09:14',
    summary: 'Triaged high-priority settlement discrepancy from HarborPay',
    fromValue: 'New',
    toValue: 'In Review',
  },
  {
    id: 'LOG-902',
    ticketId: 'TCK-2048',
    kind: 'conversion',
    actor: 'Tariq Mansoor',
    timestamp: '2026-11-22 09:42',
    summary: 'Converted diagnostic ticket step into tracked engineering task',
    fromValue: 'TCK-2048',
    toValue: 'TSK-418',
    targetEntityId: 'TSK-418',
    targetEntityType: 'Task',
  },
  {
    id: 'LOG-903',
    ticketId: 'TCK-2048',
    kind: 'note',
    actor: 'Nadia Haddad',
    timestamp: '2026-11-22 10:15',
    summary: 'Attached EU-West FX reconciliation batch logs for dual sign-off',
  },
  {
    id: 'LOG-904',
    ticketId: 'TCK-2048',
    kind: 'conversion',
    actor: 'Elena Rostova',
    timestamp: '2026-11-22 11:05',
    summary: 'Promoted recurring rail timeout investigation to dedicated subproject',
    fromValue: 'TCK-2048',
    toValue: 'PRJ-109 / SUB-101',
    targetEntityId: 'PRJ-109',
    targetEntityType: 'Project',
  },
];

export function applyTaskTemplate(
  templateId: string,
  templates: TaskTemplate[] = TASK_TEMPLATES
): {
  title: string;
  priority: TaskPriority;
  subtasks: SubtaskItem[];
} {
  const tpl = templates.find((t) => t.id === templateId);
  if (!tpl) {
    return {
      title: '',
      priority: 'Medium',
      subtasks: [],
    };
  }
  return {
    title: tpl.defaultTitle,
    priority: tpl.defaultPriority,
    subtasks: tpl.subtasks.map((s, idx) => ({
      ...s,
      id: `sub-${tpl.id}-${idx + 1}`,
    })),
  };
}

export function computeTaskSubtaskStats(subtasks: SubtaskItem[]) {
  const total = subtasks.length;
  const completed = subtasks.filter((s) => s.done).length;
  const totalHours = Number(
    subtasks.reduce((sum, s) => sum + (Number.isFinite(s.estimateHours) ? s.estimateHours : 0), 0).toFixed(1)
  );
  const progressPct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return {
    total,
    completed,
    remaining: total - completed,
    totalHours,
    progressPct,
  };
}

export function applyProjectTemplate(
  templateId: string,
  templates: ProjectTemplate[] = PROJECT_TEMPLATES
): {
  name: string;
  subprojects: SubprojectItem[];
} {
  const tpl = templates.find((t) => t.id === templateId);
  if (!tpl) {
    return {
      name: '',
      subprojects: [],
    };
  }
  return {
    name: tpl.defaultName,
    subprojects: tpl.subprojects.map((sp, idx) => ({
      ...sp,
      id: `sp-${tpl.id}-${idx + 1}`,
      milestones: sp.milestones.map((m, mIdx) => ({
        ...m,
        id: `ms-${tpl.id}-${idx + 1}-${mIdx + 1}`,
      })),
    })),
  };
}

export function computeProjectRollup(subprojects: SubprojectItem[]) {
  const subprojectCount = subprojects.length;
  const totalBudget = subprojects.reduce(
    (sum, sp) => sum + (Number.isFinite(sp.budget) ? sp.budget : 0),
    0
  );
  let totalMilestones = 0;
  let completedMilestones = 0;
  for (const sp of subprojects) {
    totalMilestones += sp.milestones.length;
    completedMilestones += sp.milestones.filter((m) => m.done).length;
  }
  return {
    subprojectCount,
    totalBudget,
    totalMilestones,
    completedMilestones,
  };
}

export function createTicketConversionEntry(
  input: Omit<TicketConversionEntry, 'id' | 'timestamp'> & {
    id?: string;
    timestamp?: string;
  }
): TicketConversionEntry {
  return {
    id: input.id ?? `LOG-${Math.floor(1000 + Math.random() * 8999)}`,
    timestamp: input.timestamp ?? '2026-11-22 12:00',
    ticketId: input.ticketId,
    kind: input.kind,
    actor: input.actor,
    summary: input.summary,
    fromValue: input.fromValue,
    toValue: input.toValue,
    targetEntityId: input.targetEntityId,
    targetEntityType: input.targetEntityType,
  };
}

export function filterTicketConversionLog(
  entries: TicketConversionEntry[],
  kindFilter: 'all' | TicketLogKind,
  query: string
): TicketConversionEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (kindFilter !== 'all' && entry.kind !== kindFilter) return false;
    if (!q) return true;
    return (
      entry.summary.toLowerCase().includes(q) ||
      entry.actor.toLowerCase().includes(q) ||
      entry.ticketId.toLowerCase().includes(q) ||
      (entry.targetEntityId?.toLowerCase().includes(q) ?? false) ||
      (entry.fromValue?.toLowerCase().includes(q) ?? false) ||
      (entry.toValue?.toLowerCase().includes(q) ?? false)
    );
  });
}
