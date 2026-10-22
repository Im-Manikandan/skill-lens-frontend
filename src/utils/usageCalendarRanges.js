const DAY = 86400000;
const iso = date => date.toISOString().slice(0, 10);

export function calendarMonthRange(year, month) {
  if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 0 || month > 11) {
    throw new RangeError('Unsupported calendar year or month');
  }
  // setUTCFullYear avoids Date.UTC treating years 1–99 as 1901–1999.
  const first = new Date(0), last = new Date(0);
  first.setUTCFullYear(year, month, 1);
  last.setUTCFullYear(year, month + 1, 0);
  return {from: iso(first), to: iso(last)};
}

export function calendarMonthWeeks(month) {
  const range = calendarMonthRange(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1);
  const first = new Date(`${range.from}T00:00:00Z`);
  const monday = +first - ((first.getUTCDay() + 6) % 7) * DAY;
  const weeks = [];
  for (let day = monday; day <= Date.parse(`${range.to}T00:00:00Z`); day += 7 * DAY) {
    weeks.push({from: iso(new Date(day)), to: iso(new Date(day + 6 * DAY))});
  }
  return weeks;
}

export function calendarYearRange(year) {
  return {from: calendarMonthRange(year, 0).from, to: calendarMonthRange(year, 11).to};
}

export const calendarYearPageStart = year => Math.max(1, Math.min(9988, year - 6));
export const calendarYearPage = start => Array.from({length: 12}, (_, index) => start + index);
