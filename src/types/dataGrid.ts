import type { OrderChannel, OrderStatus, SortDirection } from './admin';

export type GridColumnType =
  | 'id'
  | 'text'
  | 'avatar-text'
  | 'currency'
  | 'number'
  | 'status'
  | 'date'
  | 'datetime';

export interface GridColumnSchema {
  key: string;
  label: string;
  type: GridColumnType;
  sticky?: 'start' | 'end';
  sortable?: boolean;
  align?: 'left' | 'right';
  widthPx?: number;
  visibleByDefault: boolean;
  locked?: boolean;
  secondaryKey?: string;
}

export type GridFilterType =
  | 'number'
  | 'number-range'
  | 'comma-numbers'
  | 'date-range'
  | 'datetime-range'
  | 'multi-select'
  | 'multi-select-ajax';

export interface GridFilterOption {
  value: string;
  label: string;
  description?: string;
}

export interface GridFilterSchema {
  key: string;
  label: string;
  type: GridFilterType;
  placeholder?: string;
  options?: GridFilterOption[];
  ajaxEndpoint?: string;
  min?: number;
  step?: number;
}

export interface GridActionSchema {
  id: string;
  label: string;
  icon: 'eye' | 'edit' | 'copy' | 'trash' | 'tag' | 'check' | 'clock' | 'alert' | 'rotate';
  actionType: 'inspect' | 'edit' | 'delete' | 'patch' | 'duplicate' | 'submenu';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  critical?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  patchPayload?: Record<string, unknown>;
  children?: GridActionSchema[];
}

export type GridBulkScope = 'selected' | 'current-page' | 'current-filter' | 'all-rows';

export interface GridBulkFormField {
  key: string;
  label: string;
  type: 'select' | 'text';
  required?: boolean;
  placeholder?: string;
  options?: GridFilterOption[];
}

export interface GridBulkActionSchema {
  id: string;
  label: string;
  description: string;
  kind: 'export' | 'update' | 'delete';
  variant: 'primary' | 'secondary' | 'danger';
  critical: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  supportedScopes: GridBulkScope[];
  formFields?: GridBulkFormField[];
}

export interface GridCrudFieldSchema {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'date' | 'datetime' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: GridFilterOption[];
  min?: number;
  step?: number;
}

export interface GridOrderRow {
  id: string;
  numericCode: number;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  company: string;
  planOrItem: string;
  channel: OrderChannel;
  status: OrderStatus;
  amount: number;
  seatsCount: number;
  date: string;
  cutoverAt: string;
  region: string;
  paymentMethod: string;
  updatedBy: string;
  notes?: string;
}

export type GridFilterValues = Record<string, unknown>;

export interface GridSchemaResponse {
  resource: string;
  endpoint: string;
  title: string;
  subtitle: string;
  primaryKey: string;
  columns: GridColumnSchema[];
  filters: GridFilterSchema[];
  rowActions: GridActionSchema[];
  bulkActions: GridBulkActionSchema[];
  crud: {
    allowCreate: boolean;
    allowEdit: boolean;
    allowDelete: boolean;
    fields: GridCrudFieldSchema[];
  };
  defaultVisibleColumns: string[];
  rows: GridOrderRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    allMatchingCount: number;
    totalDatasetCount: number;
  };
  applied: {
    search: string;
    sortField: string;
    sortDirection: SortDirection;
    filters: GridFilterValues;
  };
  statusCounts: Record<string, number>;
}
