import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_ORDERS, REFERENCE_TODAY } from '../data/seedData';
import {
  DEFAULT_TIME_SERIES_FILTERS,
  aggregateTimeSeries,
  buildDonutBreakdown,
  countActiveTimeSeriesFilters,
  filterTimeSeriesOrders,
} from './timeSeriesCharts';

test('filterTimeSeriesOrders respects date presets, custom bounds, channels, and statuses', () => {
  const recent7d = filterTimeSeriesOrders(
    INITIAL_ORDERS,
    {
      datePreset: '7d',
      dateFrom: '',
      dateTo: '',
      channels: [],
      statuses: [],
    },
    REFERENCE_TODAY
  );
  assert.ok(recent7d.length > 0);
  assert.ok(recent7d.every((o) => o.date >= '2026-11-16' && o.date <= '2026-11-22'));

  const enterpriseFlagged = filterTimeSeriesOrders(
    INITIAL_ORDERS,
    {
      datePreset: 'all',
      dateFrom: '',
      dateTo: '',
      channels: ['Enterprise'],
      statuses: ['Flagged'],
    },
    REFERENCE_TODAY
  );
  assert.equal(enterpriseFlagged.length, 1);
  assert.equal(enterpriseFlagged[0].id, 'ORD-8482');

  const customRange = filterTimeSeriesOrders(
    INITIAL_ORDERS,
    {
      datePreset: 'custom',
      dateFrom: '2026-10-01',
      dateTo: '2026-10-31',
      channels: [],
      statuses: [],
    },
    REFERENCE_TODAY
  );
  assert.ok(customRange.every((o) => o.date.startsWith('2026-10')));
  assert.equal(customRange.length, 3);
});

test('aggregateTimeSeries buckets accurately across day, week, and month granularities', () => {
  const daily7d = aggregateTimeSeries(
    INITIAL_ORDERS,
    {
      ...DEFAULT_TIME_SERIES_FILTERS,
      datePreset: '7d',
      granularity: 'day',
      metric: 'revenue',
    },
    REFERENCE_TODAY
  );
  // Continuous 7-day timeline Nov 16..Nov 22
  assert.equal(daily7d.buckets.length, 7);
  assert.equal(daily7d.buckets[6].bucketKey, '2026-11-22');
  assert.equal(daily7d.buckets[6].revenue, 4850);

  const monthlyAll = aggregateTimeSeries(
    INITIAL_ORDERS,
    {
      ...DEFAULT_TIME_SERIES_FILTERS,
      datePreset: 'all',
      granularity: 'month',
      metric: 'orders',
    },
    REFERENCE_TODAY
  );
  assert.deepEqual(
    monthlyAll.buckets.map((b) => b.bucketKey),
    ['2026-09', '2026-10', '2026-11']
  );
  assert.equal(monthlyAll.summary.matchingOrdersCount, INITIAL_ORDERS.length);
  assert.equal(monthlyAll.summary.totalValue, INITIAL_ORDERS.length);
});

test('aggregateTimeSeries computes settled metric and empty states cleanly', () => {
  const settledOnly = aggregateTimeSeries(
    INITIAL_ORDERS,
    {
      ...DEFAULT_TIME_SERIES_FILTERS,
      datePreset: 'all',
      granularity: 'month',
      metric: 'settled',
    },
    REFERENCE_TODAY
  );
  const novBucket = settledOnly.buckets.find((b) => b.bucketKey === '2026-11');
  assert.ok(novBucket);
  assert.ok(novBucket.settledRevenue < novBucket.revenue);

  const emptyResult = aggregateTimeSeries(
    INITIAL_ORDERS,
    {
      ...DEFAULT_TIME_SERIES_FILTERS,
      datePreset: 'custom',
      dateFrom: '2020-01-01',
      dateTo: '2020-01-05',
    },
    REFERENCE_TODAY
  );
  assert.equal(emptyResult.buckets.length, 0);
  assert.equal(emptyResult.summary.matchingOrdersCount, 0);
});

test('buildDonutBreakdown aggregates percentage shares by channel and status', () => {
  const byChannel = buildDonutBreakdown(INITIAL_ORDERS, 'channel', 'revenue');
  assert.equal(byChannel.length, 4);
  assert.equal(byChannel[0].key, 'Enterprise');
  const pctSum = byChannel.reduce((s, item) => s + item.percentage, 0);
  assert.ok(pctSum >= 98 && pctSum <= 102);

  const byStatus = buildDonutBreakdown(INITIAL_ORDERS, 'status', 'orders');
  assert.equal(byStatus.length, 5);
  assert.equal(
    countActiveTimeSeriesFilters({
      datePreset: '30d',
      channels: ['Enterprise'],
      statuses: [],
    }),
    2
  );
});
