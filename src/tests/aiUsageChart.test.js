import test from 'node:test';
import assert from 'node:assert/strict';
import {usagePeriodRange} from '../utils/aiUsagePeriods.js';
import {completeTokenTotal} from '../utils/aiUsageTotals.js';
import {usageViewSelection, usageChartBuckets, sumUsageAmounts, usageReportPlan, fetchUsageView, aggregateUsageChart, usageChartRange, todayUsageSummary} from '../utils/aiUsageChart.js';

const now = new Date('2026-10-22T06:00:00Z');
const view = (period, clock = now) => ({...usageChartRange(period, clock), period});
const row = (label, usd, inr, requests = 1) => ({label, requests, total_cost_usd: usd, total_cost_inr: inr});
const data = (admin = [], client = []) => ({admin: {rows: admin}, client: {rows: client}});
const totals = (requests = 1) => ({requests, unknown_token_requests: 0, input_tokens: 10, output_tokens: 5, total_cost_usd: '0.100000000001', total_cost_inr: '8.123456789012'});

test('period selection synchronizes real calendar boundaries; custom selection survives clock rollover', () => {
  for (const period of ['Today', 'Weekly', 'Monthly', 'Yearly']) {
    const selection = usageViewSelection(new URLSearchParams(`period=${period}&from=2026-10-20&to=2026-10-23`), now);
    assert.deepEqual(selection, {...view(period), source: 'period'});
  }
  const params = new URLSearchParams('chart_range=custom&from=2026-10-14&to=2026-10-25&period=Today');
  for (const clock of [now, new Date('2026-11-02T00:00:00Z')]) {
    assert.deepEqual(usageViewSelection(params, clock), {from: '2026-10-14', to: '2026-10-25', source: 'custom', period: 'Custom Range'});
  }
  assert.equal(usageViewSelection(new URLSearchParams(), now).period, 'Weekly');
});

test('Today displays the complete current IST week with daily labels, not hours', () => {
  const selection = view('Today');
  const buckets = usageChartBuckets(selection);
  assert.deepEqual(buckets.map(item => item.lines[0]), ['Mon 19 Oct', 'Tue 20 Oct', 'Wed 21 Oct', 'Thu 22 Oct', 'Fri 23 Oct', 'Sat 24 Oct', 'Sun 25 Oct']);
  const plan = usageReportPlan(selection, now);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].start, '2026-10-18T18:30:00.000Z');
  assert.equal(plan[0].end, now.toISOString());
  assert.equal(plan[0].group, 'daily');
});

test('Weekly shows all weeks of current month, combines daily costs, excludes adjacent months', () => {
  const selection = view('Weekly');
  assert.deepEqual({from: selection.from, to: selection.to}, {from: '2026-10-01', to: '2026-10-31'});
  const chart = aggregateUsageChart(selection, data([
    row('2026-09-30', '999', '999'), row('2026-10-20', '0.1', '8'),
    row('2026-10-21', '0.2', '16'), row('2026-11-01', '999', '999'),
  ], [row('2026-10-21', '0.3', '24')]));
  assert.deepEqual(chart.map(item => item.key), ['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26']);
  assert.equal(chart[3].usdExact, '0.6');
  assert.equal(chart[3].inr, 48);
  assert.equal(chart[0].usd, 0);
  assert.equal(chart[4].usd, 0);
});

test('October uses complete calendar-week labels but excludes September/November costs', () => {
  const chart = aggregateUsageChart(view('Weekly'), data([
    row('2026-09-30', '1000', '90000'), row('2026-10-01', '0.1', '8'), row('2026-10-04', '0.2', '16'),
    row('2026-10-05', '1', '80'), row('2026-10-31', '2', '160'), row('2026-11-01', '1000', '90000'),
  ]));
  assert.deepEqual(chart.map(item => item.key), ['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26']);
  assert.deepEqual(chart[0].lines, ['Mon 28 Sep', '– Sun 04 Oct']);
  assert.equal(chart[0].from, '2026-10-01');
  assert.equal(chart[4].to, '2026-10-31');
  assert.equal(chart[0].usdExact, '0.3');
  assert.equal(chart[4].usdExact, '2');
  assert.equal(sumUsageAmounts(chart.map(item => item.usdExact)), '3.3');
});

test('calendar months yield four, five, or six Monday-to-Sunday groups; leap day stays in February', () => {
  for (const [date, count] of [['2021-02-15', 4], ['2026-10-15', 5], ['2026-08-15', 6]]) {
    for (const period of ['Weekly']) assert.equal(usageChartBuckets(view(period, new Date(`${date}T12:00:00Z`))).length, count);
  }
  const leap = usageChartBuckets(view('Weekly', new Date('2028-02-15T12:00:00Z')));
  assert.equal(leap.at(-1).to, '2028-02-29');
});

for (const period of ['Monthly']) test(`${period} uses exactly twelve monthly values for current IST year, including empty months`, () => {
  const selection = view(period);
  const chart = aggregateUsageChart(selection, data([row('2026-01', '1.25', '100'), row('2025-12', '999', '999')], [row('2026-10', '2.5', '200')]));
  assert.deepEqual(chart.map(item => item.lines[0]), ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
  assert.equal(chart[0].usd, 1.25);
  assert.equal(chart[9].usd, 2.5);
  assert.equal(chart[11].usd, 0);
  assert.equal(usageReportPlan(selection, now)[0].group, 'monthly');
  assert.equal(usageReportPlan(selection, now)[0].start, '2025-12-31T18:30:00.000Z');
});

test('unknown currency values remain gaps independently; genuine empty rows are zero', () => {
  const chart = aggregateUsageChart(view('Weekly'), data([row('2026-10-01', null, '8'), row('2026-10-02', '0.2', '16'), row('2026-10-06', null, null, 0)]));
  assert.equal(chart[0].usd, null);
  assert.equal(chart[0].inr, 24);
  assert.equal(chart[1].usd, 0);
  assert.equal(chart[1].inr, 0);
  assert.equal(chart[2].usd, 0);
  for (const requests of [null, undefined, '']) {
    const missing = aggregateUsageChart(view('Weekly'), data([{label: '2026-10-19', requests, total_cost_usd: null, total_cost_inr: null}]));
    assert.equal(missing[3].usd, null);
    assert.equal(missing[3].inr, null);
  }
});

test('decimal accumulation keeps backend precision; invalid/missing costs never become zero', () => {
  assert.equal(sumUsageAmounts(['0.100000000001', '0.200000000002']), '0.300000000003');
  assert.equal(sumUsageAmounts([1e-7, '0.2']), '0.2000001');
  assert.equal(sumUsageAmounts([]), '0');
  for (const bad of [null, undefined, '', 'bad', NaN, Infinity, -1]) assert.equal(sumUsageAmounts(['1', bad]), null);
});

test('custom daily aggregation excludes dates outside selected range and keeps all zero days', () => {
  const selection = {from: '2026-10-14', to: '2026-10-25', period: 'Custom Range'};
  const chart = aggregateUsageChart(selection, data([row('2026-10-13', '999', '999'), row('2026-10-14', '1', '80')]));
  assert.equal(chart.length, 12);
  assert.equal(chart[0].usd, 1);
  assert.equal(chart.at(-1).usd, 0);
});

const response = q => ({application: q.get('application'), timezone: 'Asia/Kolkata', kind: 'external', group: q.get('group'), company: q.has('company_id') ? {id: Number(q.get('company_id'))} : null, totals: totals(), rows: []});

test('Today reuses a single weekly report per application; summaries include only today', async () => {
  const calls = [], signal = new AbortController().signal;
  const result = await fetchUsageView(async (url, options) => {
    calls.push(url);
    assert.equal(options.signal, signal);
    const q = new URL(url, 'http://test').searchParams;
    assert.equal(q.get('company_id'), '4');
    assert.equal(q.get('timezone'), 'Asia/Kolkata');
    return {...response(q), rows: [{...totals(), label: '2026-10-21'}, {...totals(), label: '2026-10-22'}]};
  }, view('Today'), '4', signal, now);
  assert.equal(calls.length, 2);
  assert.equal(new Set(calls).size, calls.length);
  const summary = todayUsageSummary(result, '2026-10-22');
  assert.equal(summary.admin.totals.total_cost_usd, '0.100000000001');
  assert.equal(completeTokenTotal(summary.admin.totals), 15);
  const chart = aggregateUsageChart(view('Today'), result);
  assert.equal(chart[2].usdExact, '0.200000000002');
  assert.equal(chart[3].usdExact, '0.200000000002');
  assert.equal(chart[6].usd, 0);
  assert.equal(todayUsageSummary(result, '2026-10-23').admin.totals.total_cost_usd, '0');
});

test('non-Today views make only two requests; monthly queries never include adjacent-month dates', async () => {
  for (const period of ['Weekly', 'Monthly', 'Yearly']) {
    const calls = [];
    await fetchUsageView(async url => {calls.push(url); return response(new URL(url, 'http://test').searchParams);}, view(period), null, undefined, now);
    assert.equal(calls.length, 2);
    assert.equal(new Set(calls).size, 2);
    if (period === 'Weekly') {
      const q = new URL(calls[0], 'http://test').searchParams;
      assert.equal(q.get('start'), '2026-09-30T18:30:00.000Z');
      assert.equal(q.get('end'), now.toISOString());
    }
  }
});

test('reject mismatched company/application/timezone/group and incomplete reports', async () => {
  for (const override of [{company: {id: 999}}, {application: 'other'}, {timezone: 'UTC'}, {group: 'request'}, {rows: null}, {totals: null}, {totals: {requests: ''}}]) {
    await assert.rejects(fetchUsageView(async url => ({...response(new URL(url, 'http://test').searchParams), ...override}), view('Weekly'), '4', undefined, now));
  }
});

test('future-only custom range makes no API calls and supplies genuine no-request zeros', async () => {
  const selection = {from: '2026-10-26', to: '2026-10-27', period: 'Custom Range'};
  const result = await fetchUsageView(() => {throw new Error('Future dates must not query backend');}, selection, null, undefined, now);
  assert.equal(completeTokenTotal(result.admin.totals), 0);
  assert.deepEqual(aggregateUsageChart(selection, result).map(item => item.usd), [0, 0]);
});

test('Today summaries preserve unknowns today without inheriting prior-day unknown costs', () => {
  const result = {admin: {rows: [{...totals(), label: '2026-10-21', total_cost_usd: null}, {...totals(), label: '2026-10-22'}]}, client: {rows: []}};
  assert.equal(todayUsageSummary(result, '2026-10-22').admin.totals.total_cost_usd, '0.100000000001');
  result.admin.rows[1] = {...result.admin.rows[1], input_tokens: null, unknown_token_requests: 1, total_cost_usd: null};
  const summary = todayUsageSummary(result, '2026-10-22');
  assert.equal(completeTokenTotal(summary.admin.totals), null);
  assert.equal(summary.admin.totals.total_cost_usd, null);
  assert.equal(summary.admin.totals.total_cost_inr, '8.123456789012');
});


test('Yearly uses seven year labels and annual totals instead of month values', () => {
  const selection = view('Yearly');
  assert.equal(selection.from, '2026-01-01');
  assert.equal(selection.to, '2032-12-31');
  const chart = aggregateUsageChart(selection, data([
    row('2025-12', '999', '999'), row('2026-01', '0.1', '8'), row('2026-10', '0.2', '16')
  ], [row('2026-10', '0.3', '24')]));
  assert.deepEqual(chart.map(item => item.lines[0]), ['2026', '2027', '2028', '2029', '2030', '2031', '2032']);
  assert.equal(chart[0].usdExact, '0.6');
  assert.equal(chart[0].inr, 48);
  assert.equal(chart[6].usd, 0);
  const plan = usageReportPlan(selection, now);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].start, '2025-12-31T18:30:00.000Z');
  assert.equal(plan[0].end, now.toISOString());
});
