import test from 'node:test';
import assert from 'node:assert/strict';
import {USAGE_PRESETS, istDate, usagePeriodRange, usageRangeBounds, initialUsageChartRange} from '../utils/aiUsagePeriods.js';

test('four visible period choices', () => {
  assert.deepEqual(USAGE_PRESETS, ['Today','Weekly','Monthly','Yearly']);
});
test('all periods follow IST, including UTC date crossover', () => {
  const now = new Date('2026-10-20T18:45:00Z');
  assert.equal(istDate(now), '2026-10-21');
  assert.deepEqual(usagePeriodRange('Today',now),{from:'2026-10-21',to:'2026-10-21'});
  assert.deepEqual(usagePeriodRange('Weekly',now),{from:'2026-10-19',to:'2026-10-25'});
  assert.deepEqual(usagePeriodRange('Monthly',now),{from:'2026-10-01',to:'2026-10-31'});
  assert.deepEqual(usagePeriodRange('Yearly',now),{from:'2026-01-01',to:'2026-12-31'});
});
test('calendar boundaries include leap day and IST New Year', () => {
  assert.deepEqual(usagePeriodRange('Monthly',new Date('2028-02-15T00:00:00Z')),{from:'2028-02-01',to:'2028-02-29'});
  assert.deepEqual(usagePeriodRange('Weekly',new Date('2026-12-31T19:00:00Z')),{from:'2026-12-28',to:'2027-01-03'});
  assert.deepEqual(usagePeriodRange('Yearly',new Date('2026-12-31T19:00:00Z')),{from:'2027-01-01',to:'2027-12-31'});
});

test('default week includes all seven dates, even midweek and at IST rollover', () => {
  assert.deepEqual(usagePeriodRange('Weekly', new Date('2026-10-22T06:00:00Z')),
    {from: '2026-10-19', to: '2026-10-25'});
  assert.deepEqual(usagePeriodRange('Weekly', new Date('2026-10-25T18:29:59Z')),
    {from: '2026-10-19', to: '2026-10-25'});
  assert.deepEqual(usagePeriodRange('Weekly', new Date('2026-10-25T18:30:00Z')),
    {from: '2026-10-26', to: '2026-11-01'});
});
test('ongoing periods never request future events', () => {
  const now = new Date('2026-10-20T18:45:00Z');
  for (const preset of USAGE_PRESETS) {
    const {from,to} = usagePeriodRange(preset,now);
    const bounds = usageRangeBounds(from,to,now);
    assert.equal(bounds.end,now.toISOString());
  }
  assert.equal(usageRangeBounds('2026-10-22','2026-10-24',now),null);
});
test('manual historical range uses inclusive IST end date', () => {
  assert.deepEqual(usageRangeBounds('2026-10-01','2026-10-03',new Date('2026-10-20T00:00:00Z')),
    {start:'2026-09-30T18:30:00.000Z',end:'2026-10-03T18:30:00.000Z'});
});


test('initial chart state ignores stale partial-week URL defaults', () => {
  const now = new Date('2026-10-22T06:00:00Z');
  const expected = {from: '2026-10-19', to: '2026-10-25', source: 'week'};
  for (const query of ['', 'from=2026-10-20&to=2026-10-23', 'from=2026-10-20&to=2026-10-23&chart_range=week&period=Today']) {
    assert.deepEqual(initialUsageChartRange(new URLSearchParams(query), now), expected);
  }
});

test('only completed manual selections restore custom chart dates', () => {
  const params = new URLSearchParams('from=2026-10-14&to=2026-10-25&chart_range=custom&period=Yearly');
  for (const now of [new Date('2026-10-22T06:00:00Z'), new Date('2026-11-02T06:00:00Z')]) {
    assert.deepEqual(initialUsageChartRange(params, now), {from: '2026-10-14', to: '2026-10-25', source: 'custom'});
  }
});

test('invalid saved selections fall back to full current IST week', () => {
  for (const dates of ['from=2026-02-30&to=2026-03-04', 'from=2026-10-25&to=2026-10-14', 'from=2026-10-14', 'from=2020-01-01&to=2026-10-25']) {
    assert.deepEqual(initialUsageChartRange(new URLSearchParams(dates + '&chart_range=custom'), new Date('2026-10-22T06:00:00Z')),
      {from: '2026-10-19', to: '2026-10-25', source: 'week'});
  }
});
