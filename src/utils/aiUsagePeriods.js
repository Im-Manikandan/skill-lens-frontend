// Calendar dates are in Asia/Kolkata; query instants are explicit UTC timestamps.
const DAY = 86400000;
const IST_OFFSET = 330 * 60000;
export const USAGE_PRESETS = ['Today', 'Weekly', 'Monthly', 'Yearly'];
export const istDate = (now = new Date()) => new Date(+now + IST_OFFSET).toISOString().slice(0, 10);
export function usagePeriodRange(period, now = new Date()) {
  const today = istDate(now);
  const day = new Date(`${today}T00:00:00Z`);
  let start = day, end = day;
  if (period === 'Weekly') {
    start = new Date(+day - ((day.getUTCDay() + 6) % 7) * DAY);
    end = new Date(+start + 6 * DAY);
  } else if (period === 'Monthly') {
    start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1));
    end = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + 1, 0));
  } else if (period === 'Yearly') {
    start = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
    end = new Date(Date.UTC(day.getUTCFullYear(), 11, 31));
  } else if (period !== 'Today') {
    throw new Error('Unsupported usage period');
  }
  return {from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10)};
}
export function usageRangeBounds(from, to, now = new Date()) {
  const start = Date.parse(`${from}T00:00:00+05:30`);
  const end = Math.min(Date.parse(`${to}T00:00:00+05:30`) + DAY, +now);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return null;
  return {start: new Date(start).toISOString(), end: new Date(end).toISOString()};
}

// Legacy URLs contain automatically populated dates without recording whether
// the user selected them. Only explicitly committed calendar selections restore
// a custom range; stale/default URL dates must not override the current IST week.
export function initialUsageChartRange(params, now = new Date()) {
  const from = params.get('from'), to = params.get('to');
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '')
    && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if (params.get('chart_range') === 'custom' && validDate(from) && validDate(to)
    && from <= to && (Date.parse(to) - Date.parse(from)) / DAY < 731) {
    return {from, to, source: 'custom'};
  }
  return {...usagePeriodRange('Weekly', now), source: 'week'};
}
