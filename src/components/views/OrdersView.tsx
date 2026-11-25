import { useMemo } from 'react';
import type { OrderFilters, OrderRecord } from '../../types/admin';
import type { GridFilterValues } from '../../types/dataGrid';
import { AutoDataGrid } from '../ui/AutoDataGrid';

export interface OrdersViewProps {
  filters: OrderFilters;
  refreshKey?: number;
  onInspectOrder: (order: OrderRecord) => void;
  onDataMutated?: () => void;
}

export function OrdersView({
  filters,
  refreshKey = 0,
  onInspectOrder,
  onDataMutated,
}: OrdersViewProps) {
  const initialGridFilters = useMemo<GridFilterValues>(() => {
    const next: GridFilterValues = {};
    if (filters.statuses.length > 0) {
      next.statuses = filters.statuses;
    }
    if (filters.channel !== 'all') {
      next.channels = [filters.channel];
    }
    if (filters.dateFrom || filters.dateTo) {
      next.dateRange = { startDate: filters.dateFrom, endDate: filters.dateTo };
    }
    if (filters.minAmount || filters.maxAmount) {
      next.amountRange = { min: filters.minAmount, max: filters.maxAmount };
    }
    return next;
  }, [filters]);

  return (
    <AutoDataGrid
      endpoint="/api/orders"
      initialFilters={initialGridFilters}
      externalRefreshKey={refreshKey}
      onInspectRow={(row) => onInspectOrder(row)}
      onDataMutated={onDataMutated}
    />
  );
}
