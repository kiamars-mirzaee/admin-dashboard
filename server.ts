import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import type { SortDirection } from './src/types/admin.ts';
import type { GridBulkScope, GridFilterValues, GridOrderRow } from './src/types/dataGrid.ts';
import {
  applyGridFilters,
  buildGridCsv,
  buildInitialGridOrders,
  buildOrdersGridSchemaResponse,
  extractNumericCode,
  getRemoteFilterOptions,
  ORDERS_COLUMNS_SCHEMA,
  paginateGridRows,
  resolveBulkTargetRows,
  sortGridRows,
  validateOrderCrudPayload,
} from './src/utils/dataGridEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

let ordersStore: GridOrderRow[] = buildInitialGridOrders();

function parseFiltersParam(raw: unknown): GridFilterValues {
  if (typeof raw !== 'string' || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as GridFilterValues) : {};
  } catch {
    return {};
  }
}

function getNextOrderId(): { id: string; numericCode: number } {
  const maxCode = ordersStore.reduce((max, row) => Math.max(max, row.numericCode), 8492);
  const nextCode = maxCode + 1;
  return { id: `ORD-${nextCode}`, numericCode: nextCode };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Lightweight full-dataset endpoint so Overview / Drawer stay synced with backend CRUD
  app.get('/api/orders/all', (_req, res) => {
    res.json({ orders: ordersStore });
  });

  // Remote AJAX options endpoint for multi-select-ajax filters
  app.get('/api/orders/options/:field', (req, res) => {
    const field = req.params.field;
    if (field !== 'company' && field !== 'region' && field !== 'planOrItem') {
      res.status(400).json({ error: 'Unsupported option field' });
      return;
    }
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const options = getRemoteFilterOptions(ordersStore, field, q);
    res.json({ field, query: q, options });
  });

  // Server-generated CSV export honoring scope (selected, current-page, current-filter, all-rows) and visible columns
  app.get('/api/orders/export', (req, res) => {
    const scope = (typeof req.query.scope === 'string'
      ? req.query.scope
      : 'current-filter') as GridBulkScope;
    const ids =
      typeof req.query.ids === 'string' && req.query.ids.trim()
        ? req.query.ids.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const filters = parseFiltersParam(req.query.filters);
    const sortField = typeof req.query.sortField === 'string' ? req.query.sortField : 'date';
    const sortDirection: SortDirection =
      req.query.sortDirection === 'asc' ? 'asc' : 'desc';
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 6;
    const visibleColumns =
      typeof req.query.columns === 'string' && req.query.columns.trim()
        ? req.query.columns.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

    const filtered = sortGridRows(
      applyGridFilters(ordersStore, filters, search),
      sortField,
      sortDirection
    );
    const paged = paginateGridRows(filtered, page, pageSize);
    const targetRows = resolveBulkTargetRows({
      allRows: ordersStore,
      filteredRows: filtered,
      pageRows: paged.items,
      scope,
      selectedIds: ids,
    });

    const csv = buildGridCsv(targetRows, ORDERS_COLUMNS_SCHEMA, visibleColumns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="kestrel-orders-export.csv"');
    res.send(csv);
  });

  // Self-describing backend Data Grid endpoint (returns columns, filters, actions, bulk actions, CRUD schema, rows, pagination)
  app.get('/api/orders', (req, res) => {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 6;
    const sortField = typeof req.query.sortField === 'string' ? req.query.sortField : 'date';
    const sortDirection: SortDirection =
      req.query.sortDirection === 'asc' ? 'asc' : 'desc';
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const filters = parseFiltersParam(req.query.filters);

    const payload = buildOrdersGridSchemaResponse({
      allRows: ordersStore,
      page,
      pageSize,
      sortField,
      sortDirection,
      search,
      filters,
    });
    res.json(payload);
  });

  // Create order (or duplicate existing order)
  app.post('/api/orders', (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;

    if (typeof body.duplicateFromId === 'string') {
      const source = ordersStore.find((r) => r.id === body.duplicateFromId);
      if (!source) {
        res.status(404).json({ error: 'Source order not found' });
        return;
      }
      const { id, numericCode } = getNextOrderId();
      const copy: GridOrderRow = {
        ...source,
        id,
        numericCode,
        status: 'Pending',
        notes: `Duplicated from ${source.id}`,
      };
      ordersStore = [copy, ...ordersStore];
      res.status(201).json({ ok: true, row: copy });
      return;
    }

    const validation = validateOrderCrudPayload(body, false);
    if (!validation.valid || !validation.normalized) {
      res.status(400).json({ error: 'Validation failed', errors: validation.errors });
      return;
    }

    const { id, numericCode } = getNextOrderId();
    const created: GridOrderRow = {
      id,
      numericCode,
      customerName: validation.normalized.customerName ?? '',
      customerEmail: validation.normalized.customerEmail ?? '',
      company: validation.normalized.company ?? '',
      planOrItem: validation.normalized.planOrItem ?? '',
      channel: validation.normalized.channel ?? 'Direct',
      status: validation.normalized.status ?? 'Pending',
      amount: validation.normalized.amount ?? 0,
      seatsCount: validation.normalized.seatsCount ?? 1,
      date: validation.normalized.date ?? '2026-11-23',
      cutoverAt: validation.normalized.cutoverAt ?? '2026-11-23T12:00',
      region: validation.normalized.region ?? 'Global',
      paymentMethod: validation.normalized.paymentMethod ?? 'Invoice Net-30',
      updatedBy: validation.normalized.updatedBy ?? 'Elena Rostova',
      notes: validation.normalized.notes,
    };

    ordersStore = [created, ...ordersStore];
    res.status(201).json({ ok: true, row: created });
  });

  // Partial or full update
  app.patch('/api/orders/:id', (req, res) => {
    const id = req.params.id;
    const existing = ordersStore.find((r) => r.id === id);
    if (!existing) {
      res.status(404).json({ error: `Order ${id} not found` });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const validation = validateOrderCrudPayload(body, true);
    if (!validation.valid || !validation.normalized) {
      res.status(400).json({ error: 'Validation failed', errors: validation.errors });
      return;
    }

    const updated: GridOrderRow = {
      ...existing,
      ...validation.normalized,
      numericCode: existing.numericCode || extractNumericCode(existing.id),
    };
    ordersStore = ordersStore.map((r) => (r.id === id ? updated : r));
    res.json({ ok: true, row: updated });
  });

  // Delete single order
  app.delete('/api/orders/:id', (req, res) => {
    const id = req.params.id;
    const exists = ordersStore.some((r) => r.id === id);
    if (!exists) {
      res.status(404).json({ error: `Order ${id} not found` });
      return;
    }
    ordersStore = ordersStore.filter((r) => r.id !== id);
    res.json({ ok: true, deletedId: id });
  });

  // Bulk execution across selected, current-page, current-filter, or all-rows
  app.post('/api/orders/bulk', (req, res) => {
    const body = (req.body ?? {}) as {
      actionId?: string;
      scope?: GridBulkScope;
      selectedIds?: string[];
      search?: string;
      filters?: GridFilterValues;
      sortField?: string;
      sortDirection?: SortDirection;
      page?: number;
      pageSize?: number;
      payload?: Record<string, unknown>;
    };

    const actionId = body.actionId ?? '';
    const scope: GridBulkScope = body.scope ?? 'selected';
    const selectedIds = Array.isArray(body.selectedIds) ? body.selectedIds : [];
    const search = typeof body.search === 'string' ? body.search : '';
    const filters = body.filters ?? {};
    const sortField = body.sortField ?? 'date';
    const sortDirection: SortDirection = body.sortDirection === 'asc' ? 'asc' : 'desc';
    const page = Number(body.page) || 1;
    const pageSize = Number(body.pageSize) || 6;

    const filtered = sortGridRows(
      applyGridFilters(ordersStore, filters, search),
      sortField,
      sortDirection
    );
    const paged = paginateGridRows(filtered, page, pageSize);
    const targets = resolveBulkTargetRows({
      allRows: ordersStore,
      filteredRows: filtered,
      pageRows: paged.items,
      scope,
      selectedIds,
    });

    if (targets.length === 0) {
      res.status(400).json({ error: 'No matching rows in target scope' });
      return;
    }

    const targetIdSet = new Set(targets.map((r) => r.id));
    const formPayload = body.payload ?? {};

    if (actionId === 'bulk-delete') {
      ordersStore = ordersStore.filter((r) => !targetIdSet.has(r.id));
      res.json({
        ok: true,
        actionId,
        scope,
        affectedCount: targets.length,
        affectedIds: Array.from(targetIdSet),
      });
      return;
    }

    if (actionId === 'bulk-status') {
      const nextStatus = formPayload.status as GridOrderRow['status'] | undefined;
      const auditNote =
        typeof formPayload.auditNote === 'string' ? formPayload.auditNote.trim() : '';
      if (!nextStatus) {
        res.status(400).json({ error: 'Target status is required' });
        return;
      }
      ordersStore = ordersStore.map((r) =>
        targetIdSet.has(r.id)
          ? {
              ...r,
              status: nextStatus,
              notes: auditNote ? auditNote : r.notes,
            }
          : r
      );
      res.json({
        ok: true,
        actionId,
        scope,
        affectedCount: targets.length,
        affectedIds: Array.from(targetIdSet),
      });
      return;
    }

    if (actionId === 'bulk-assign-owner') {
      const owner =
        typeof formPayload.updatedBy === 'string' ? formPayload.updatedBy.trim() : '';
      if (!owner) {
        res.status(400).json({ error: 'Owner is required' });
        return;
      }
      ordersStore = ordersStore.map((r) =>
        targetIdSet.has(r.id) ? { ...r, updatedBy: owner } : r
      );
      res.json({
        ok: true,
        actionId,
        scope,
        affectedCount: targets.length,
        affectedIds: Array.from(targetIdSet),
      });
      return;
    }

    if (actionId === 'bulk-refund') {
      const auditNote =
        typeof formPayload.auditNote === 'string' ? formPayload.auditNote.trim() : '';
      ordersStore = ordersStore.map((r) =>
        targetIdSet.has(r.id)
          ? {
              ...r,
              status: 'Refunded',
              notes: auditNote || r.notes,
            }
          : r
      );
      res.json({
        ok: true,
        actionId,
        scope,
        affectedCount: targets.length,
        affectedIds: Array.from(targetIdSet),
      });
      return;
    }

    res.status(400).json({ error: `Unknown bulk action: ${actionId}` });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kestrel server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
