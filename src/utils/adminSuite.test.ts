import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_ORDERS } from '../data/seedData';
import {
  INITIAL_AUDIT_LOGS,
  addNormalizedTag,
  buildActivityHeatmap,
  countRoleEnabledPermissions,
  createEmptyOrderDraft,
  createInitialPermissionMatrix,
  evaluatePasswordStrength,
  filterAuditLogs,
  filterComboboxOptions,
  groupOrdersByStatus,
  hasUnsavedOrderChanges,
  setRoleResourcePermissions,
  togglePermissionCell,
  validateOrderWizardStep,
} from './adminSuite';

test('groupOrdersByStatus organizes orders into 5 canonical columns with accurate totals', () => {
  const columns = groupOrdersByStatus(INITIAL_ORDERS);
  assert.equal(columns.length, 5);
  assert.deepEqual(
    columns.map((c) => c.status),
    ['Pending', 'Processing', 'Flagged', 'Completed', 'Refunded']
  );
  const totalFromCols = columns.reduce((s, c) => s + c.orders.length, 0);
  assert.equal(totalFromCols, INITIAL_ORDERS.length);
  const flaggedCol = columns.find((c) => c.status === 'Flagged')!;
  assert.equal(flaggedCol.orders.length, 2);
  assert.equal(flaggedCol.totalAmount, 3290 + 5400);
});

test('buildActivityHeatmap builds 7x8 matrix matching order event counts', () => {
  const matrix = buildActivityHeatmap(INITIAL_ORDERS);
  assert.equal(matrix.days.length, 7);
  assert.equal(matrix.weeks.length, 8);
  assert.equal(matrix.cells.length, 56);
  assert.equal(matrix.totalEvents, INITIAL_ORDERS.length);
  assert.ok(matrix.maxCount >= 1);
});

test('permission matrix toggling preserves view dependency invariants', () => {
  let matrix = createInitialPermissionMatrix();
  const baseSupportCount = countRoleEnabledPermissions(matrix, 'support_agent');
  assert.ok(baseSupportCount > 0);

  // Enabling delete on reports for support_agent auto-enables view
  matrix = togglePermissionCell(matrix, 'support_agent', 'reports', 'delete');
  assert.equal(matrix.support_agent.reports.delete, true);
  assert.equal(matrix.support_agent.reports.view, true);

  // Disabling view revokes create/edit/delete
  matrix = togglePermissionCell(matrix, 'support_agent', 'reports', 'view');
  assert.equal(matrix.support_agent.reports.view, false);
  assert.equal(matrix.support_agent.reports.delete, false);

  // Bulk resource grant
  matrix = setRoleResourcePermissions(matrix, 'finance_analyst', 'storage', true);
  assert.equal(matrix.finance_analyst.storage.delete, true);
});

test('filterAuditLogs filters by query, category, and severity', () => {
  const all = filterAuditLogs(INITIAL_AUDIT_LOGS, {});
  assert.equal(all.length, INITIAL_AUDIT_LOGS.length);

  const security = filterAuditLogs(INITIAL_AUDIT_LOGS, { category: 'security' });
  assert.equal(security.length, 1);
  assert.equal(security[0].target, 'ORD-8490');

  const queryMatch = filterAuditLogs(INITIAL_AUDIT_LOGS, { query: 'webhook' });
  assert.equal(queryMatch.length, 1);
  assert.equal(queryMatch[0].id, 'AUD-900');
});

test('order form wizard validation and dirty state tracking detect errors and edits', () => {
  const base = createEmptyOrderDraft();
  const step0Errors = validateOrderWizardStep(0, base);
  assert.ok(step0Errors.customerName);
  assert.ok(step0Errors.customerEmail);
  assert.ok(step0Errors.company);

  const edited = {
    ...base,
    customerName: 'Aria Mehr',
    customerEmail: 'aria@mehr.ir',
    company: 'Mehr Cloud',
  };
  assert.equal(hasUnsavedOrderChanges(edited, base), true);
  assert.deepEqual(validateOrderWizardStep(0, edited), {});
  assert.ok(validateOrderWizardStep(1, edited).planOrItem);
});

test('tag normalization, combobox filtering, and password strength helpers', () => {
  let tags = ['pci-dss'];
  tags = addNormalizedTag(tags, 'SOC2,');
  tags = addNormalizedTag(tags, 'soc2'); // duplicate case-insensitive
  assert.deepEqual(tags, ['pci-dss', 'SOC2']);

  const options = [
    { value: 'us', label: 'US East', description: 'Virginia' },
    { value: 'eu', label: 'EU Central', description: 'Frankfurt' },
  ];
  assert.equal(filterComboboxOptions(options, 'frank').length, 1);
  assert.equal(evaluatePasswordStrength('weak').label, 'Weak');
  assert.equal(evaluatePasswordStrength('Kestrel#2026').label, 'Strong');
});
