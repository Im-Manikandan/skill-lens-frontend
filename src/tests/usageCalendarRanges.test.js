import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarMonthRange, calendarMonthWeeks, calendarYearRange, calendarYearPageStart, calendarYearPage} from '../utils/usageCalendarRanges.js';

test('October shows all full Monday-to-Sunday calendar weeks', () => {
  assert.deepEqual(calendarMonthWeeks('2026-10'), [
    {from: '2026-09-28', to: '2026-10-04'},
    {from: '2026-10-05', to: '2026-10-11'},
    {from: '2026-10-12', to: '2026-10-18'},
    {from: '2026-10-19', to: '2026-10-25'},
    {from: '2026-10-26', to: '2026-11-01'},
  ]);
});

test('months support four, five, six weeks and cross-year boundaries without timezone shifts', () => {
  for (const [month, count] of [['2021-02', 4], ['2026-10', 5], ['2026-08', 6], ['2027-01', 5]]) {
    const weeks = calendarMonthWeeks(month);
    assert.equal(weeks.length, count);
    for (const week of weeks) {
      const start = new Date(`${week.from}T00:00:00Z`), end = new Date(`${week.to}T00:00:00Z`);
      assert.equal(start.getUTCDay(), 1);
      assert.equal(end.getUTCDay(), 0);
      assert.equal(+end - +start, 6 * 86400000);
    }
  }
  assert.deepEqual(calendarMonthWeeks('2027-01')[0], {from: '2026-12-28', to: '2027-01-03'});
});

test('all twelve months use real boundaries, including leap years and century rules', () => {
  for (let month = 0; month < 12; month++) {
    assert.equal(calendarMonthRange(2026, month).from, `2026-${String(month + 1).padStart(2, '0')}-01`);
  }
  assert.deepEqual(calendarMonthRange(2028, 1), {from: '2028-02-01', to: '2028-02-29'});
  assert.equal(calendarMonthRange(2000, 1).to, '2000-02-29');
  assert.equal(calendarMonthRange(2100, 1).to, '2100-02-28');
  assert.equal(calendarMonthRange(2026, 11).to, '2026-12-31');
});

test('year grids are dynamic and include earlier/current/later years, not example literals', () => {
  for (const selected of [1926, 2026, 2126, 9999, 1]) {
    const page = calendarYearPage(calendarYearPageStart(selected));
    assert.equal(page.length, 12);
    assert.ok(page.includes(selected));
    assert.ok(page.every(year => year >= 1 && year <= 9999));
    if (selected > 6 && selected < 9994) {
      assert.ok(page[0] < selected);
      assert.ok(page.at(-1) > selected);
    }
  }
});

test('selected years cover January 1 to December 31, including years below 100', () => {
  for (const year of [1, 99, 2024, 2026, 9999]) {
    const label = String(year).padStart(4, '0');
    assert.deepEqual(calendarYearRange(year), {from: `${label}-01-01`, to: `${label}-12-31`});
  }
  assert.throws(() => calendarYearRange(0), RangeError);
  assert.throws(() => calendarYearRange(10000), RangeError);
});
