import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyProjectTemplate,
  applyTaskTemplate,
  computeProjectRollup,
  computeTaskSubtaskStats,
  createTicketConversionEntry,
  filterTicketConversionLog,
  INITIAL_TICKET_CONVERSION_LOG,
} from './workTemplates';

test('applyTaskTemplate populates subtasks cleanly and computeTaskSubtaskStats aggregates hours and progress', () => {
  const result = applyTaskTemplate('compliance-onboarding');
  assert.equal(result.priority, 'High');
  assert.equal(result.subtasks.length, 3);

  const stats = computeTaskSubtaskStats(result.subtasks);
  assert.equal(stats.total, 3);
  assert.equal(stats.completed, 1);
  assert.equal(stats.remaining, 2);
  assert.equal(stats.totalHours, 6.5);
  assert.equal(stats.progressPct, 33);

  const blank = applyTaskTemplate('unknown-id');
  assert.equal(blank.subtasks.length, 0);
  assert.equal(computeTaskSubtaskStats(blank.subtasks).progressPct, 0);
});

test('applyProjectTemplate builds nested subprojects and computeProjectRollup sums budgets and milestones', () => {
  const proj = applyProjectTemplate('multi-region-rollout');
  assert.equal(proj.subprojects.length, 2);

  const rollup = computeProjectRollup(proj.subprojects);
  assert.equal(rollup.subprojectCount, 2);
  assert.equal(rollup.totalBudget, 80500);
  assert.equal(rollup.totalMilestones, 4);
  assert.equal(rollup.completedMilestones, 1);
});

test('createTicketConversionEntry and filterTicketConversionLog accurately track and filter conversions', () => {
  const custom = createTicketConversionEntry({
    id: 'LOG-999',
    ticketId: 'TCK-2048',
    kind: 'conversion',
    actor: 'Sara Rahimi',
    timestamp: '2026-11-22 11:30',
    summary: 'Converted ticket follow-up into linked task',
    fromValue: 'TCK-2048',
    toValue: 'TSK-425',
    targetEntityId: 'TSK-425',
    targetEntityType: 'Task',
  });

  const combined = [custom, ...INITIAL_TICKET_CONVERSION_LOG];
  const conversionsOnly = filterTicketConversionLog(combined, 'conversion', '');
  assert.equal(conversionsOnly.length, 3);
  assert.equal(conversionsOnly[0].targetEntityId, 'TSK-425');

  const queryFiltered = filterTicketConversionLog(combined, 'all', 'HarborPay');
  assert.equal(queryFiltered.length, 1);
  assert.equal(queryFiltered[0].id, 'LOG-901');
});
