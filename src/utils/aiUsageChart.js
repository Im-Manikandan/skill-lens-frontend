import {initialUsageChartRange, usagePeriodRange, usageRangeBounds, USAGE_PRESETS, istDate} from './aiUsagePeriods.js';
import {completeTokenTotal} from './aiUsageTotals.js';

const DAY = 86400000;
const iso = date => date.toISOString().slice(0, 10);
const dateOf = value => new Date(`${value}T00:00:00Z`);
const format = (value, options) => dateOf(value).toLocaleDateString('en-GB', {...options, timeZone: 'UTC'}).replace(/\bSept\b/g, 'Sep');
const shortDay = value => format(value, {weekday: 'short', day: '2-digit', month: 'short'});
const longDay = value => format(value, {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
export function usageChartRange(period, now = new Date()) {
  if (period === 'Yearly') {
    const year = Number(istDate(now).slice(0, 4));
    return {from: `${year}-01-01`, to: `${year + 6}-12-31`};
  }
  return usagePeriodRange(period === 'Today' ? 'Weekly' : period === 'Weekly' ? 'Monthly' : period === 'Monthly' ? 'Yearly' : period, now);
}

export function usageViewSelection(params, now = new Date()) {
  const saved = initialUsageChartRange(params, now);
  if (saved.source === 'custom') return {...saved, period: 'Custom Range'};
  const period = USAGE_PRESETS.includes(params.get('period')) ? params.get('period') : 'Today';
  return {...usageChartRange(period, now), source: 'period', period};
}

export function usageChartBuckets({from, to, period}) {
  const buckets = [];
  if (period === 'Yearly') {
    for (let year = Number(from.slice(0, 4)); year <= Number(to.slice(0, 4)); year++) {
      const label = String(year);
      buckets.push({key: label, from: `${label}-01-01`, to: `${label}-12-31`, lines: [label], compact: [label], tooltip: label});
    }
  } else if (period === 'Weekly') {
    const first = dateOf(from);
    const monday = +first - ((first.getUTCDay() + 6) % 7) * DAY;
    for (let day = monday; day <= +dateOf(to); day += 7 * DAY) {
      const start = iso(new Date(day)), end = iso(new Date(day + 6 * DAY));
      const parts = value => shortDay(value).split(' ');
      const [startDay, startDate, startMonth] = parts(start), [endDay, endDate, endMonth] = parts(end);
      buckets.push({key: start, from: start < from ? from : start, to: end > to ? to : end,
        lines: [shortDay(start), `– ${shortDay(end)}`],
        compact: [`${startDay} ${startDate}`, startMonth, `${endDay} ${endDate}`, endMonth],
        tooltip: `${longDay(start)} – ${longDay(end)}`});
    }
  } else if (period === 'Monthly') {
    const year = Number(from.slice(0, 4));
    for (let month = 0; month < 12; month++) {
      const start = iso(new Date(Date.UTC(year, month, 1))), end = iso(new Date(Date.UTC(year, month + 1, 0)));
      const label = format(start, {month: 'short'});
      buckets.push({key: start.slice(0, 7), from: start, to: end, lines: [label], compact: [label], tooltip: format(start, {month: 'long', year: 'numeric'})});
    }
  } else {
    for (let day = +dateOf(from); day <= +dateOf(to); day += DAY) {
      const value = iso(new Date(day));
      buckets.push({key: value, from: value, to: value, lines: [shortDay(value)], compact: shortDay(value).split(' '), tooltip: longDay(value)});
    }
  }
  return buckets;
}

// Keep backend decimal cost snapshots exact while adding them. Only the final
// plotted coordinate converts to Number; tooltip and summary retain decimals.
export function sumUsageAmounts(values) {
  let total = 0n, scale = 0;
  for (const value of values) {
    if (value == null || value === '') return null;
    const match = String(value).match(/^(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
    if (!match) return null;
    const exponent = Number(match[3] || 0);
    if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) return null;
    let digits = BigInt(match[1] + (match[2] || ''));
    const places = (match[2] || '').length - exponent;
    const nextScale = Math.max(0, places);
    if (places < 0) digits *= 10n ** BigInt(-places);
    if (nextScale > scale) {total *= 10n ** BigInt(nextScale - scale); scale = nextScale;}
    total += digits * 10n ** BigInt(scale - nextScale);
  }
  const raw = total.toString().padStart(scale + 1, '0');
  return scale ? `${raw.slice(0, -scale)}.${raw.slice(-scale)}` : raw;
}

const emptyTotals = () => ({requests: 0, unknown_token_requests: 0, input_tokens: 0, output_tokens: 0, total_cost_usd: '0', total_cost_inr: '0'});
const noRequests = row => row.requests != null && row.requests !== '' && Number(row.requests) === 0;
const cost = (row, currency) => noRequests(row) ? '0' : row[`total_cost_${currency}`];

function mergeTotals(totals) {
  const result = emptyTotals();
  for (const field of ['requests', 'unknown_token_requests', 'input_tokens', 'output_tokens']) {
    const values = totals.map(item => noRequests(item) ? 0 : item[field]);
    const total = values.every(value => value != null && value !== '' && Number.isSafeInteger(Number(value)) && Number(value) >= 0)
      ? values.reduce((sum, value) => sum + Number(value), 0) : null;
    result[field] = Number.isSafeInteger(total) ? total : null;
  }
  const tokenTotals = totals.map(completeTokenTotal);
  const tokenSum = tokenTotals.every(value => value !== null)
    ? tokenTotals.reduce((sum, value) => sum + value, 0) : null;
  result.total_tokens = Number.isSafeInteger(tokenSum) ? tokenSum : null;
  result.total_tokens_complete = result.total_tokens !== null;
  for (const currency of ['usd', 'inr']) result[`total_cost_${currency}`] = sumUsageAmounts(totals.map(item => cost(item, currency)));
  return result;
}

export function usageReportPlan(selection, now = new Date()) {
  if (selection.period === 'Yearly') {
    const plan = [];
    for (let year = Number(selection.from.slice(0, 4)); year <= Number(selection.to.slice(0, 4)); year++) {
      const bounds = usageRangeBounds(`${year}-01-01`, `${year}-12-31`, now);
      if (bounds) plan.push({...bounds, group: 'monthly'});
    }
    return plan;
  }
  const bounds = usageRangeBounds(selection.from, selection.to, now);
  return bounds ? [{...bounds, group: (selection.period === 'Monthly' || selection.period === 'Yearly') ? 'monthly' : 'daily'}] : [];
}

export async function fetchUsageView(getJSON, selection, companyId, signal, now = new Date()) {
  const plan = usageReportPlan(selection, now);
  const reports = await Promise.all(['admin', 'client'].map(async application => {
    const parts = await Promise.all(plan.map(async interval => {
      const query = new URLSearchParams({application, kind: 'external', group: interval.group, start: interval.start, end: interval.end, timezone: 'Asia/Kolkata'});
      if (companyId) query.set('company_id', companyId);
      const result = await getJSON(`/ai-usage/report?${query}`, {cache: 'no-store', signal});
      if (result.timezone !== 'Asia/Kolkata' || result.application !== application || result.kind !== 'external'
        || result.group !== interval.group || (companyId ? String(result.company?.id) !== String(companyId) : result.company != null)) {
        throw new Error('Usage response scope does not match requested company/application/group.');
      }
      if (!result.totals || !Array.isArray(result.rows) || !Number.isSafeInteger(Number(result.totals.requests)) || Number(result.totals.requests) < 0 || result.totals.requests == null || result.totals.requests === '') {
        throw new Error('Usage response is incomplete.');
      }
      return result;
    }));
    return [application, {totals: parts.length === 1 ? parts[0].totals : mergeTotals(parts.map(part => part.totals)), rows: parts.flatMap(part => part.rows)}];
  }));
  return Object.fromEntries(reports);
}

// Today reuses the full-week daily report for its chart, while summary cards
// include only today's IST row. Weekly uses a separate full-month report.
export function todayUsageSummary(data, today = istDate()) {
  return Object.fromEntries(['admin', 'client'].map(application => [application, {
    ...data[application],
    totals: mergeTotals(data[application].rows.filter(row => row.label === today)),
  }]));
}

export function aggregateUsageChart(selection, data) {
  const buckets = usageChartBuckets(selection).map(bucket => ({...bucket, amounts: {usd: [], inr: []}}));
  for (const application of ['admin', 'client']) {
    for (const row of data[application].rows) {
      let bucket;
      if (selection.period === 'Yearly' && /^\d{4}-\d{2}$/.test(row.label)) {
        bucket = buckets.find(item => item.key === row.label.slice(0, 4));
      } else if (selection.period === 'Monthly') {
        bucket = buckets.find(item => item.key === row.label);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(row.label) && row.label >= selection.from && row.label <= selection.to) {
        bucket = buckets.find(item => row.label >= item.from && row.label <= item.to);
      }
      if (!bucket) continue;
      for (const currency of ['usd', 'inr']) bucket.amounts[currency].push(cost(row, currency));
    }
  }
  return buckets.map(({amounts, ...bucket}) => {
    const usdExact = sumUsageAmounts(amounts.usd), inrExact = sumUsageAmounts(amounts.inr);
    return {...bucket, usdExact, inrExact, usd: usdExact == null ? null : Number(usdExact), inr: inrExact == null ? null : Number(inrExact)};
  });
}
