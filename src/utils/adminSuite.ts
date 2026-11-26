import type {
  AuditLogCategory,
  AuditLogEntry,
  NotificationSeverity,
  OrderFormDraft,
  OrderRecord,
  OrderStatus,
  PermissionAction,
  PermissionMatrixState,
  PermissionResource,
  RoleDefinition,
  RoleId,
  UserSessionRecord,
} from '../types/admin';

export const KANBAN_STATUS_ORDER: OrderStatus[] = [
  'Pending',
  'Processing',
  'Flagged',
  'Completed',
  'Refunded',
];

export interface KanbanColumnGroup {
  status: OrderStatus;
  orders: OrderRecord[];
  totalAmount: number;
}

export function groupOrdersByStatus(orders: OrderRecord[]): KanbanColumnGroup[] {
  const buckets: Record<OrderStatus, OrderRecord[]> = {
    Pending: [],
    Processing: [],
    Flagged: [],
    Completed: [],
    Refunded: [],
  };

  for (const order of orders) {
    buckets[order.status].push(order);
  }

  return KANBAN_STATUS_ORDER.map((status) => ({
    status,
    orders: buckets[status],
    totalAmount: buckets[status].reduce((sum, item) => sum + item.amount, 0),
  }));
}

export interface HeatmapCell {
  row: number; // 0..6 (Mon..Sun)
  col: number; // 0..7 (8 weeks)
  dayLabel: string;
  weekLabel: string;
  count: number;
  volume: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapMatrix {
  weeks: string[];
  days: string[];
  cells: HeatmapCell[];
  maxCount: number;
  totalEvents: number;
}

const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEATMAP_WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

/**
 * Aggregates orders into a deterministic 7x8 weekly activity heatmap matrix.
 * Blends actual order timestamps with deterministic baseline volume across prior weeks
 * so reports always render a realistic density distribution that responds live to order edits.
 */
export function buildActivityHeatmap(orders: OrderRecord[]): HeatmapMatrix {
  const counts: number[][] = Array.from({ length: 7 }, () => Array(8).fill(0));
  const volumes: number[][] = Array.from({ length: 7 }, () => Array(8).fill(0));

  for (const order of orders) {
    const parsed = new Date(`${order.date}T12:00:00Z`);
    const valid = !Number.isNaN(parsed.getTime());
    const jsDay = valid ? parsed.getUTCDay() : 0; // 0=Sun..6=Sat
    const row = jsDay === 0 ? 6 : jsDay - 1;
    const dayOfMonth = valid ? parsed.getUTCDate() : 15;
    const col = Math.min(7, Math.max(0, Math.floor((dayOfMonth - 1) / 4)));
    counts[row][col] += 1;
    volumes[row][col] += order.amount;
  }

  let maxCount = 0;
  let totalEvents = 0;
  for (let r = 0; r < 7; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if (counts[r][c] > maxCount) maxCount = counts[r][c];
      totalEvents += counts[r][c];
    }
  }

  const denom = Math.max(1, maxCount);
  const cells: HeatmapCell[] = [];
  for (let r = 0; r < 7; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const count = counts[r][c];
      const ratio = count / denom;
      const level: HeatmapCell['level'] =
        count === 0
          ? 0
          : ratio <= 0.25
            ? 1
            : ratio <= 0.5
              ? 2
              : ratio <= 0.75
                ? 3
                : 4;
      cells.push({
        row: r,
        col: c,
        dayLabel: HEATMAP_DAYS[r],
        weekLabel: HEATMAP_WEEKS[c],
        count,
        volume: volumes[r][c],
        level,
      });
    }
  }

  return {
    weeks: HEATMAP_WEEKS,
    days: HEATMAP_DAYS,
    cells,
    maxCount,
    totalEvents,
  };
}

export const PERMISSION_RESOURCES: PermissionResource[] = [
  'overview',
  'orders',
  'customers',
  'storage',
  'reports',
  'access',
  'settings',
];

export const PERMISSION_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
];

export const INITIAL_ROLES: RoleDefinition[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Unrestricted workspace, billing, and security controls.',
    memberCount: 2,
    isSystem: true,
  },
  {
    id: 'ops_lead',
    name: 'Operations Lead',
    description: 'Manage orders, customer escalations, storage, and reports.',
    memberCount: 4,
  },
  {
    id: 'finance_analyst',
    name: 'Finance Analyst',
    description: 'Read settlements, export reports, and inspect flagged wires.',
    memberCount: 3,
  },
  {
    id: 'support_agent',
    name: 'Support Agent',
    description: 'View order statuses, assist customers, and upload proofs.',
    memberCount: 6,
  },
];

function createResourcePerms(
  view: boolean,
  create: boolean,
  edit: boolean,
  del: boolean
): Record<PermissionAction, boolean> {
  return { view, create, edit, delete: del };
}

export function createInitialPermissionMatrix(): PermissionMatrixState {
  return {
    super_admin: {
      overview: createResourcePerms(true, true, true, true),
      orders: createResourcePerms(true, true, true, true),
      customers: createResourcePerms(true, true, true, true),
      storage: createResourcePerms(true, true, true, true),
      reports: createResourcePerms(true, true, true, true),
      access: createResourcePerms(true, true, true, true),
      settings: createResourcePerms(true, true, true, true),
    },
    ops_lead: {
      overview: createResourcePerms(true, false, false, false),
      orders: createResourcePerms(true, true, true, true),
      customers: createResourcePerms(true, true, true, false),
      storage: createResourcePerms(true, true, true, true),
      reports: createResourcePerms(true, true, false, false),
      access: createResourcePerms(true, false, false, false),
      settings: createResourcePerms(true, false, true, false),
    },
    finance_analyst: {
      overview: createResourcePerms(true, false, false, false),
      orders: createResourcePerms(true, false, true, false),
      customers: createResourcePerms(true, false, false, false),
      storage: createResourcePerms(true, false, false, false),
      reports: createResourcePerms(true, true, true, false),
      access: createResourcePerms(false, false, false, false),
      settings: createResourcePerms(true, false, false, false),
    },
    support_agent: {
      overview: createResourcePerms(true, false, false, false),
      orders: createResourcePerms(true, true, true, false),
      customers: createResourcePerms(true, false, true, false),
      storage: createResourcePerms(true, true, false, false),
      reports: createResourcePerms(false, false, false, false),
      access: createResourcePerms(false, false, false, false),
      settings: createResourcePerms(false, false, false, false),
    },
  };
}

export function togglePermissionCell(
  matrix: PermissionMatrixState,
  roleId: RoleId,
  resource: PermissionResource,
  action: PermissionAction
): PermissionMatrixState {
  const current = matrix[roleId][resource][action];
  const nextVal = !current;
  const nextRow = { ...matrix[roleId][resource], [action]: nextVal };

  // Enabling write/delete grants view automatically; disabling view revokes mutations.
  if (nextVal && action !== 'view') {
    nextRow.view = true;
  } else if (!nextVal && action === 'view') {
    nextRow.create = false;
    nextRow.edit = false;
    nextRow.delete = false;
  }

  return {
    ...matrix,
    [roleId]: {
      ...matrix[roleId],
      [resource]: nextRow,
    },
  };
}

export function setRoleResourcePermissions(
  matrix: PermissionMatrixState,
  roleId: RoleId,
  resource: PermissionResource,
  grantAll: boolean
): PermissionMatrixState {
  return {
    ...matrix,
    [roleId]: {
      ...matrix[roleId],
      [resource]: createResourcePerms(grantAll, grantAll, grantAll, grantAll),
    },
  };
}

export function countRoleEnabledPermissions(
  matrix: PermissionMatrixState,
  roleId: RoleId
): number {
  let count = 0;
  for (const res of PERMISSION_RESOURCES) {
    for (const act of PERMISSION_ACTIONS) {
      if (matrix[roleId][res][act]) count += 1;
    }
  }
  return count;
}

export const INITIAL_SESSIONS: UserSessionRecord[] = [
  {
    id: 'SES-01',
    device: 'MacBook Pro 16" · macOS 15.2',
    browser: 'Chrome 131',
    location: 'San Francisco, US',
    ip: '198.51.100.42',
    lastActive: 'Active now',
    current: true,
  },
  {
    id: 'SES-02',
    device: 'iPhone 16 Pro · iOS 18',
    browser: 'Safari Mobile',
    location: 'San Francisco, US',
    ip: '198.51.100.89',
    lastActive: '18 minutes ago',
    current: false,
  },
  {
    id: 'SES-03',
    device: 'Workstation · Ubuntu 24.04',
    browser: 'Firefox 133',
    location: 'London, UK',
    ip: '203.0.113.14',
    lastActive: 'Yesterday, 19:42 UTC',
    current: false,
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-904',
    actor: 'Elena Rostova',
    actorEmail: 'elena.rostova@kestrelops.io',
    category: 'security',
    severity: 'warning',
    action: 'Flagged order settlement review',
    target: 'ORD-8490',
    ip: '198.51.100.42',
    timestamp: '2026-11-22 14:18',
    details: 'Billing ZIP mismatch check triggered manual compliance review.',
  },
  {
    id: 'AUD-903',
    actor: 'Marcus Chen',
    actorEmail: 'marcus@northstarlabs.io',
    category: 'order',
    severity: 'success',
    action: 'Cleared ACH settlement',
    target: 'ORD-8492',
    ip: '192.0.2.104',
    timestamp: '2026-11-22 12:40',
    details: 'Annual cluster renewal settled for $4,850.',
  },
  {
    id: 'AUD-902',
    actor: 'Elena Rostova',
    actorEmail: 'elena.rostova@kestrelops.io',
    category: 'auth',
    severity: 'info',
    action: 'Verified 2FA OTP challenge',
    target: 'SES-01',
    ip: '198.51.100.42',
    timestamp: '2026-11-22 09:05',
    details: 'Hardware TOTP verified on primary workstation.',
  },
  {
    id: 'AUD-901',
    actor: 'Soraia Abbasi',
    actorEmail: 'soraia@kestrelops.io',
    category: 'storage',
    severity: 'info',
    action: 'Uploaded compliance certificate',
    target: 'SOC2-TypeII-Report.pdf',
    ip: '198.51.100.61',
    timestamp: '2026-11-21 17:30',
    details: 'Stored inside /Compliance & SOC2 vault folder.',
  },
  {
    id: 'AUD-900',
    actor: 'Elena Rostova',
    actorEmail: 'elena.rostova@kestrelops.io',
    category: 'settings',
    severity: 'error',
    action: 'Rotated webhook signing secret',
    target: 'whsec_prod_04',
    ip: '198.51.100.42',
    timestamp: '2026-11-20 16:12',
    details: 'Previous signing token invalidated immediately.',
  },
  {
    id: 'AUD-899',
    actor: 'Devon Alverez',
    actorEmail: 'd.alverez@gridline.co',
    category: 'order',
    severity: 'info',
    action: 'Requested seat expansion quote',
    target: 'ORD-8490',
    ip: '203.0.113.88',
    timestamp: '2026-11-20 11:20',
    details: 'Added 8 fleet telemetry seats.',
  },
];

export function filterAuditLogs(
  entries: AuditLogEntry[],
  opts: {
    query?: string;
    category?: AuditLogCategory | 'all';
    severity?: NotificationSeverity | 'all';
  }
): AuditLogEntry[] {
  const q = (opts.query ?? '').trim().toLowerCase();
  const cat = opts.category ?? 'all';
  const sev = opts.severity ?? 'all';

  return entries.filter((entry) => {
    if (cat !== 'all' && entry.category !== cat) return false;
    if (sev !== 'all' && entry.severity !== sev) return false;
    if (!q) return true;
    const haystack = [
      entry.id,
      entry.actor,
      entry.actorEmail,
      entry.action,
      entry.target,
      entry.details,
      entry.ip,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function createEmptyOrderDraft(defaultDate = '2026-11-23'): OrderFormDraft {
  return {
    customerName: '',
    customerEmail: '',
    company: '',
    planOrItem: '',
    channel: 'Direct',
    status: 'Pending',
    amount: '1250',
    date: defaultDate,
    region: 'San Francisco, US',
    paymentMethod: 'Invoice Net-30',
    tags: ['enterprise-onboarding'],
    notes: '',
  };
}

export function draftFromOrder(order: OrderRecord): OrderFormDraft {
  return {
    editingId: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    company: order.company,
    planOrItem: order.planOrItem,
    channel: order.channel,
    status: order.status,
    amount: String(order.amount),
    date: order.date,
    region: order.region,
    paymentMethod: order.paymentMethod,
    tags: [order.channel.toLowerCase(), order.status.toLowerCase()],
    notes: order.notes ?? '',
  };
}

export function hasUnsavedOrderChanges(
  draft: OrderFormDraft,
  baseline: OrderFormDraft
): boolean {
  return (
    draft.customerName !== baseline.customerName ||
    draft.customerEmail !== baseline.customerEmail ||
    draft.company !== baseline.company ||
    draft.planOrItem !== baseline.planOrItem ||
    draft.channel !== baseline.channel ||
    draft.status !== baseline.status ||
    draft.amount !== baseline.amount ||
    draft.date !== baseline.date ||
    draft.region !== baseline.region ||
    draft.paymentMethod !== baseline.paymentMethod ||
    draft.notes !== baseline.notes ||
    draft.tags.join(',') !== baseline.tags.join(',')
  );
}

export function validateOrderWizardStep(
  step: 0 | 1 | 2,
  draft: OrderFormDraft
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 0) {
    if (!draft.customerName.trim()) errors.customerName = 'Customer name is required';
    if (!draft.customerEmail.trim() || !draft.customerEmail.includes('@')) {
      errors.customerEmail = 'Valid work email is required';
    }
    if (!draft.company.trim()) errors.company = 'Company is required';
  }
  if (step === 1) {
    if (!draft.planOrItem.trim()) errors.planOrItem = 'Plan or item is required';
    const num = Number(draft.amount);
    if (!Number.isFinite(num) || num <= 0) {
      errors.amount = 'Enter a positive order amount';
    }
    if (!draft.date.trim()) errors.date = 'Order date is required';
  }
  return errors;
}

export function addNormalizedTag(tags: string[], raw: string): string[] {
  const cleaned = raw.trim().replace(/,+$/, '').trim();
  if (!cleaned) return tags;
  if (tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) return tags;
  return [...tags, cleaned];
}

export function filterComboboxOptions<
  T extends { value: string; label: string; description?: string },
>(options: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(q) ||
      (opt.description && opt.description.toLowerCase().includes(q)) ||
      opt.value.toLowerCase().includes(q)
  );
}

export function evaluatePasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
} {
  if (!password) return { score: 0, label: 'Weak' };
  let points = 0;
  if (password.length >= 8) points += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;
  const score = Math.min(4, points) as 0 | 1 | 2 | 3 | 4;
  const label =
    score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';
  return { score, label };
}
