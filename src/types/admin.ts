export type NavSection =
  | 'overview'
  | 'orders'
  | 'customers'
  | 'kanban'
  | 'reports'
  | 'audit'
  | 'access'
  | 'settings'
  | 'storage'
  | 'tasks'
  | 'help'
  | 'components'
  | 'auth'
  | 'errors'
  | 'operations';

export type NavRouteId =
  | 'overview'
  | 'commerce'
  | 'orders-group'
  | 'orders-all'
  | 'orders-flagged'
  | 'orders-pending'
  | 'kanban'
  | 'order-detail'
  | 'order-editor'
  | 'customers-group'
  | 'customers-all'
  | 'customers-enterprise'
  | 'customers-risk'
  | 'reports'
  | 'audit-log'
  | 'storage'
  | 'tasks-queue'
  | 'help-support'
  | 'admin-group'
  | 'access-control'
  | 'settings'
  | 'operations-hub'
  | 'auth-flows'
  | 'error-403'
  | 'error-404'
  | 'error-500'
  | 'error-maintenance'
  | 'error-offline'
  | 'ui-system'
  | 'components-all'
  | 'components-inputs'
  | 'components-workflows'
  | 'components-overlays'
  | 'components-charts'
  | 'components-states';

export type OrderStatus = 'Completed' | 'Processing' | 'Pending' | 'Flagged' | 'Refunded';

export type OrderChannel = 'Direct' | 'Enterprise' | 'Marketplace' | 'Partner';

export interface OrderRecord {
  id: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  company: string;
  planOrItem: string;
  channel: OrderChannel;
  status: OrderStatus;
  amount: number;
  date: string; // ISO YYYY-MM-DD
  region: string;
  paymentMethod: string;
  notes?: string;
}

export type DatePreset = 'all' | '7d' | '30d' | '90d' | 'custom';

export interface OrderFilters {
  search: string;
  statuses: OrderStatus[];
  channel: OrderChannel | 'all';
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}

export type SortField = 'date' | 'amount' | 'customerName' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  avatar?: string;
  tier: 'Enterprise' | 'Growth' | 'Starter';
  totalSpend: number;
  orderCount: number;
  lastOrderDate: string;
  location: string;
  healthStatus: 'Healthy' | 'Attention' | 'At Risk';
}

export type NotificationCategory = 'order' | 'security' | 'system' | 'billing';
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  read: boolean;
  relatedOrderId?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'info' | 'success' | 'warning' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}

export interface RevenueSeriesPoint {
  label: string;
  revenue: number;
  previousRevenue: number;
  orders: number;
}

export type RoleId = 'super_admin' | 'ops_lead' | 'finance_analyst' | 'support_agent';

export type PermissionResource =
  | 'overview'
  | 'orders'
  | 'customers'
  | 'storage'
  | 'reports'
  | 'access'
  | 'settings';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  description: string;
  memberCount: number;
  isSystem?: boolean;
}

export type PermissionMatrixState = Record<
  RoleId,
  Record<PermissionResource, Record<PermissionAction, boolean>>
>;

export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  roleId: RoleId;
  avatar?: string;
  status: 'Active' | 'Invited' | 'Suspended';
  lastActive: string;
  twoFactorEnabled: boolean;
}

export interface UserSessionRecord {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

export type AuditLogCategory = 'order' | 'auth' | 'security' | 'storage' | 'settings';

export interface AuditLogEntry {
  id: string;
  actor: string;
  actorEmail: string;
  category: AuditLogCategory;
  severity: NotificationSeverity;
  action: string;
  target: string;
  ip: string;
  timestamp: string;
  details: string;
}

export interface OrderFormDraft {
  editingId?: string;
  customerName: string;
  customerEmail: string;
  company: string;
  planOrItem: string;
  channel: OrderChannel;
  status: OrderStatus;
  amount: string;
  date: string;
  region: string;
  paymentMethod: string;
  tags: string[];
  notes: string;
}
