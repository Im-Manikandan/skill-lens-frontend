import {chromium, expect} from '@playwright/test';
// Browser-only fixtures. No test events are written to backend or application data.
const origin = process.env.USAGE_TEST_ORIGIN || 'http://localhost:3001';
const calls = [], errors = [];
const baseEvents = [
  ['2026-01-03T12:00:00+05:30', 0.5], ['2026-09-30T23:59:00+05:30', 9000],
  ['2026-10-01T00:00:00+05:30', 1], ['2026-10-04T23:59:00+05:30', 2],
  ['2026-10-05T00:00:00+05:30', 4], ['2026-10-14T12:00:00+05:30', 8],
  ['2026-10-19T12:00:00+05:30', 16], ['2026-10-21T23:59:00+05:30', 32],
  ['2026-10-22T00:00:00+05:30', 64], ['2026-10-22T03:59:00+05:30', 128],
  ['2026-10-22T04:00:00+05:30', 256], ['2026-10-22T07:59:00+05:30', 512],
  ['2026-10-22T08:00:00+05:30', 1024], ['2026-10-22T11:29:00+05:30', 2048],
  ['2026-10-22T11:31:00+05:30', 4096], ['2026-11-01T00:00:00+05:30', 9000],
];
const events = ['admin', 'client'].flatMap((application, index) => baseEvents.map(([at, usd]) => ({application, company: '1', at: Date.parse(at), usd: usd * (index + 1), inr: usd * (index + 1) * 80})));
const total = rows => ({requests: rows.length, unknown_token_requests: 0, input_tokens: rows.length * 10, output_tokens: rows.length * 5, total_cost_usd: String(rows.reduce((sum, e) => sum + e.usd, 0)), total_cost_inr: String(rows.reduce((sum, e) => sum + e.inr, 0))});
let spoof = false, unknown = false;
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage({viewport: {width: 1672, height: 1000}});
  await page.addInitScript(() => {
    const RealDate = Date;
    window.Date = class extends RealDate {constructor(...args) {super(...(args.length ? args : ['2026-10-22T06:00:00Z']));}};
  });
  page.on('pageerror', e => {errors.push(String(e));console.log('BROWSER ERROR',String(e));});
  page.on('console', msg => {if(msg.type() === 'error' && !msg.text().includes('same key')) console.log('CONSOLE',msg.text());});
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()), q = Object.fromEntries(url.searchParams);
    if (!url.pathname.startsWith('/api/')) return route.continue();
    let data = [];
    if (url.pathname.endsWith('/ai-usage/companies')) data = [{id: 1, name: 'Test Client', total_employees: 2}, {id: 2, name: 'Empty Client', total_employees: 0}];
    if (url.pathname.endsWith('/ai-usage/report')) {
      calls.push(q);
      const records = events.filter(e => e.application === q.application && (!q.company_id || e.company === q.company_id) && e.at >= Date.parse(q.start) && e.at < Date.parse(q.end));
      const grouped = new Map();
      for (const event of records) {
        const day = new Date(event.at + 330 * 60000).toISOString().slice(0, 10);
        const label = q.group === 'monthly' ? day.slice(0, 7) : day;
        grouped.set(label, [...(grouped.get(label) || []), event]);
      }
      data = {application: q.application, kind: 'external', timezone: 'Asia/Kolkata', group: q.group,
        company: q.company_id ? {id: spoof ? 999 : Number(q.company_id)} : null,
        totals: total(records), rows: [...grouped].map(([label, values]) => ({label, ...total(values)}))};
      if (unknown && q.application === 'client') {
        data.totals.total_cost_usd = null; data.totals.unknown_token_requests = 1; data.totals.input_tokens = null;
        data.rows = data.rows.map(row => ({...row, total_cost_usd: null}));
      }
      // Hold new views briefly to verify chart dimensions during loading too.
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(data)});
  });
  await page.goto(`${origin}/auth/login/admin`);
  await page.getByRole('button', {name: 'Sign In', exact: true}).waitFor();
  await page.evaluate(async () => {
    const {store, persistor} = await import('/src/store/Store.js');
    const {default: ApiUtils} = await import('/src/api/ApiUtils.jsx');
    ApiUtils.setCookie('accessToken', 'isolated-ui-test');
    store.dispatch({type: 'auth/setAuthToken', payload: {access_token: 'isolated-ui-test'}});
    store.dispatch({type: 'userType/setUserType', payload: 'admin'});
    await persistor.flush();
  });
  await page.goto(`${origin}/admin/ai-usage?from=2026-10-20&to=2026-10-23`);
  const picker = page.getByRole('button', {name: /^Chart date range/});
  const period = page.getByLabel('Time period', {exact: true});
  const popup = page.getByRole('dialog', {name: 'Choose chart date range'});
  const ticks = page.locator('.recharts-xAxis-tick-labels text');
  const chart = page.locator('.usage-chart');
  const stage = page.locator('.usage-chart-stage');
  const summary = page.locator('.usage-tokens .usage-metric strong').nth(2);
  const usd = page.locator('.usage-costs .usage-metric strong').nth(0);
  const inr = page.locator('.usage-costs .usage-metric strong').nth(1);
  const weekLabels = ['Mon 19 Oct', 'Tue 20 Oct', 'Wed 21 Oct', 'Thu 22 Oct', 'Fri 23 Oct', 'Sat 24 Oct', 'Sun 25 Oct'];
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  await expect(ticks).toHaveText(weekLabels);
  await expect(picker).toContainText('19 Oct 2026 \u2013 25 Oct 2026');
  expect(calls.length).toBe(2);
  const initialSize = await chart.boundingBox();
  const initialStage = await stage.boundingBox();
  async function sameSize() {
    const size = await chart.boundingBox(), inner = await stage.boundingBox();
    expect(size.width).toBe(initialSize.width); expect(size.height).toBe(initialSize.height);
    expect(inner.width).toBe(initialStage.width); expect(inner.height).toBe(300);
    expect(await page.locator('.usage-chart-scroll').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
  }
  async function hoverTick(index, dollars, rupees) {
    await page.waitForTimeout(150);
    const label = await ticks.nth(index).boundingBox(), box = await page.locator('.recharts-wrapper').boundingBox();
    await page.locator('.recharts-wrapper').hover({position: {x: label.x + label.width / 2 - box.x, y: 80}});
    const tooltip = page.locator('.recharts-tooltip-wrapper');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(dollars);
    await expect(tooltip).toContainText(rupees);
  }


  async function selectPeriod(value, range, labels, expectedRequests) {
    const before = calls.length;
    await period.selectOption(value);
    await expect(period).toHaveValue(value);
    await sameSize();
    await expect(chart).toHaveAttribute('aria-busy', 'false');
    await expect(picker).toContainText(range);
    await expect(ticks).toHaveText(labels);
    expect(calls.slice(before).length).toBe(expectedRequests);
    const keys = calls.slice(before).map(q => JSON.stringify(q));
    expect(new Set(keys).size).toBe(keys.length);
    await sameSize();
  }
  await hoverTick(2, '$96.00', '7,680.00');
  await selectPeriod('Today', '19 Oct 2026 \u2013 25 Oct 2026', weekLabels, 0);
  await expect(summary).toHaveText('180');
  await expect(usd).toHaveText('$12,096.00');
  await expect(inr).toHaveText('\u20b99,67,680.00');
  await hoverTick(0, '$48.00', '3,840.00');
  await hoverTick(2, '$96.00', '7,680.00');
  await hoverTick(3, '$12,096.00', '9,67,680.00');
  await hoverTick(6, '$0.00', '0.00');
  await page.mouse.move(10, 10);
  await page.waitForTimeout(1600);
  await page.screenshot({path: 'artifacts/usage-today-current-week.png', fullPage: true});
  await selectPeriod('Weekly', '19 Oct 2026 \u2013 25 Oct 2026', weekLabels, 0);
  await expect(summary).toHaveText('240');
  await selectPeriod('Monthly', '01 Oct 2026 \u2013 31 Oct 2026', [
    'Mon 28 Sep\u2013 Sun 04 Oct', 'Mon 05 Oct\u2013 Sun 11 Oct', 'Mon 12 Oct\u2013 Sun 18 Oct', 'Mon 19 Oct\u2013 Sun 25 Oct', 'Mon 26 Oct\u2013 Sun 01 Nov',
  ], 2);
  await expect(usd).toHaveText('$12,285.00');
  await hoverTick(0, '$9.00', '720.00');
  await hoverTick(4, '$0.00', '0.00');
  await page.mouse.move(10, 10);
  await page.waitForTimeout(1600);
  await page.screenshot({path: 'artifacts/usage-period-monthly.png', fullPage: true});
  await selectPeriod('Yearly', '01 Jan 2026 \u2013 31 Dec 2026', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], 2);
  await expect(usd).toHaveText('$39,286.50');
  await hoverTick(0, '$1.50', '120.00');
  await hoverTick(9, '$12,285.00', '9,82,800.00');
  await hoverTick(11, '$0.00', '0.00');
  await page.mouse.move(10, 10);
  await page.waitForTimeout(1600);
  await page.screenshot({path: 'artifacts/usage-period-yearly.png', fullPage: true});
  // One calendar, no external date inputs. First click never fetches/commits.
  await expect(page.locator('input[type="date"]')).toHaveCount(0);
  await period.selectOption('Weekly');
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  await picker.click();
  const before = calls.length;
  await popup.locator('[data-date="2026-10-14"]').click();
  await popup.locator('[data-date="2026-10-25"]').hover();
  await expect(popup.locator('.is-in-range')).toHaveCount(12);
  expect(calls.length).toBe(before);
  await expect(period).toHaveValue('Weekly');
  await expect(picker).toContainText('19 Oct 2026 \u2013 25 Oct 2026');
  await popup.locator('[data-date="2026-10-25"]').click();
  await expect(popup).toHaveCount(0);
  await expect(picker).toBeFocused();
  await expect(period).toHaveValue('Custom Range');
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  await expect(picker).toContainText('14 Oct 2026 \u2013 25 Oct 2026');
  await expect(usd).toHaveText('$12,264.00');
  expect(calls.length - before).toBe(2);
  await sameSize();
  await page.evaluate(async () => {const {queryClient} = await import('/src/config/query-config.jsx');await queryClient.refetchQueries({queryKey: ['ai-dashboard'], type: 'active'});});
  await expect(picker).toContainText('14 Oct 2026 \u2013 25 Oct 2026');
  await expect(period).toHaveValue('Custom Range');
  await page.reload();
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  await expect(picker).toContainText('14 Oct 2026 \u2013 25 Oct 2026');
  await expect(period).toHaveValue('Custom Range');
  // Active client scope follows every view; missing provider costs stay unknown.
  await page.getByLabel('Client', {exact: true}).selectOption('1');
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  await expect.poll(() => calls.slice(-2).every(q => q.company_id === '1')).toBeTruthy();
  const scoped = calls.slice(-2);
  expect(scoped.every(q => q.company_id === '1' && q.timezone === 'Asia/Kolkata' && q.kind === 'external')).toBeTruthy();
  expect(scoped.map(q => q.application).sort()).toEqual(['admin', 'client']);
  unknown = true;
  await period.selectOption('Monthly');
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  await expect(summary).toHaveText('Unknown');
  await expect(usd).toHaveText('Unknown');
  await expect(inr).toHaveText('\u20b99,82,800.00');
  await hoverTick(0, 'Unknown', '720.00');
  unknown = false;
  await page.getByLabel('Client', {exact: true}).selectOption('2');
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  await expect(summary).toHaveText('0');
  await expect(usd).toHaveText('$0.00');
  spoof = true;
  await period.selectOption('Yearly');
  await expect(page.getByRole('alert')).toContainText('scope does not match');
  await expect(usd).toHaveText('Unknown');
  await expect(ticks).toHaveCount(0);
  spoof = false;
  await page.getByLabel('Client', {exact: true}).selectOption('');
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  // Every yearly month fits even on a narrow viewport; compact labels don't overlap.
  await page.setViewportSize({width: 390, height: 844});
  await expect(ticks).toHaveCount(12);
  const boxes = await Promise.all((await ticks.all()).map(t => t.boundingBox()));
  expect(boxes.slice(1).every((box, i) => boxes[i].x + boxes[i].width <= box.x)).toBeTruthy();
  expect(await page.locator('.usage-chart-scroll').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
  await page.screenshot({path: 'artifacts/usage-period-yearly-mobile.png', fullPage: true});
  for (const [view, count] of [['Monthly', 5], ['Weekly', 7], ['Today', 7]]) {
    await period.selectOption(view);
    await expect(period).toHaveValue(view);
    await expect(ticks).toHaveCount(count);
    const labelBoxes = await Promise.all((await ticks.all()).map(t => t.boundingBox()));
    expect(labelBoxes.slice(1).every((b, i) => labelBoxes[i].x + labelBoxes[i].width <= b.x)).toBeTruthy();
    expect(await stage.evaluate(el => el.getBoundingClientRect().height)).toBe(300);
    expect(await page.locator('.usage-chart-scroll').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
  }
  // Six calendar weeks must fit too, without growing chart width or height.
  await page.evaluate(() => {
    const CurrentDate = Date;
    window.Date = class extends CurrentDate {constructor(...args) {super(...(args.length ? args : ['2026-08-15T06:00:00Z']));}};
  });
  await period.selectOption('Monthly');
  await expect(period).toHaveValue('Monthly');
  await expect(picker).toContainText('01 Aug 2026 \u2013 31 Aug 2026');
  await expect(ticks).toHaveCount(6);
  const sixBoxes = await Promise.all((await ticks.all()).map(t => t.boundingBox()));
  await page.screenshot({path: 'artifacts/usage-period-six-weeks-mobile.png', fullPage: true});
  expect(sixBoxes.slice(1).every((b, i) => sixBoxes[i].x + sixBoxes[i].width <= b.x)).toBeTruthy();
  await page.screenshot({path: 'artifacts/usage-period-six-weeks-mobile.png', fullPage: true});
  // New calendar views share the same popup and existing commit/data path.
  await page.evaluate(() => {
    const CurrentDate = Date;
    window.Date = class extends CurrentDate {constructor(...args) {super(...(args.length ? args : ['2026-10-22T06:00:00Z']));}};
  });
  await period.selectOption('Weekly');
  await expect(picker).toContainText('19 Oct 2026 \u2013 25 Oct 2026');
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  await picker.click();
  const modes = popup.getByRole('group', {name: 'Calendar selection mode'});
  const switchMode = value => modes.getByRole('button', {name: value, exact: true}).click();
  const browseStart = calls.length;
  await switchMode('Week');
  const weekChoices = popup.locator('[data-calendar-option="week"]');
  await expect(weekChoices).toHaveText([
    'Week 1Mon 28 Sep \u2013 Sun 4 Oct', 'Week 2Mon 5 Oct \u2013 Sun 11 Oct',
    'Week 3Mon 12 Oct \u2013 Sun 18 Oct', 'Week 4Mon 19 Oct \u2013 Sun 25 Oct', 'Week 5Mon 26 Oct \u2013 Sun 1 Nov',
  ]);
  await expect(weekChoices.nth(3)).toHaveAttribute('aria-pressed', 'true');
  const calendarWidth = (await popup.boundingBox()).width;
  expect(calendarWidth).toBe(320);
  await popup.getByRole('button', {name: 'Previous month', exact: true}).click();
  await expect(popup.locator('.usage-range-month strong')).toHaveText('September 2026');
  await popup.getByRole('button', {name: 'Next month', exact: true}).click();
  await expect(weekChoices).toHaveCount(5);
  expect(calls.length).toBe(browseStart);
  await page.screenshot({path: 'artifacts/usage-calendar-week-mobile.png', fullPage: true});
  await weekChoices.nth(0).click();
  await expect(popup).toHaveCount(0);
  await expect(picker).toContainText('28 Sep 2026 \u2013 04 Oct 2026');
  await expect(period).toHaveValue('Custom Range');
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  await expect(usd).toHaveText('$27,009.00');
  await expect(summary).toHaveText('90');
  await expect.poll(() => calls.slice(-2).every(q => q.start === '2026-09-27T18:30:00.000Z' && q.end === '2026-10-04T18:30:00.000Z')).toBeTruthy();
  await picker.click();
  // Retain October browsing context when its first week starts in September.
  await expect(popup.locator('.usage-range-month strong')).toHaveText('October 2026');
  await expect(weekChoices.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await switchMode('Month');
  const monthChoices = popup.locator('[data-calendar-option="month"]');
  await expect(monthChoices).toHaveText(['January','February','March','April','May','June','July','August','September','October','November','December']);
  await popup.getByRole('button', {name: 'Previous year', exact: true}).click();
  await expect(popup.locator('.usage-range-month strong')).toHaveText('2025');
  await popup.getByRole('button', {name: 'Next year', exact: true}).click();
  await expect(popup.locator('.usage-range-month strong')).toHaveText('2026');
  await page.screenshot({path: 'artifacts/usage-calendar-month-mobile.png', fullPage: true});
  await monthChoices.nth(9).click();
  await expect(picker).toContainText('01 Oct 2026 \u2013 31 Oct 2026');
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  await expect(usd).toHaveText('$12,285.00');
  await expect(summary).toHaveText('360');
  await picker.click();
  await expect(monthChoices.nth(9)).toHaveAttribute('aria-pressed', 'true');
  await switchMode('Year');
  const yearChoices = popup.locator('[data-calendar-option="year"]');
  await expect(yearChoices).toHaveCount(12);
  await expect(yearChoices.filter({hasText: /^2026$/})).toHaveAttribute('aria-pressed', 'true');
  const years = await yearChoices.allTextContents();
  await popup.getByRole('button', {name: 'Previous year range', exact: true}).click();
  expect(Number((await yearChoices.allTextContents())[0])).toBe(Number(years[0]) - 12);
  await popup.getByRole('button', {name: 'Next year range', exact: true}).click();
  await expect(yearChoices).toHaveText(years);
  await page.screenshot({path: 'artifacts/usage-calendar-year-mobile.png', fullPage: true});
  await page.setViewportSize({width: 1672, height: 1000});
  await page.screenshot({path: 'artifacts/usage-calendar-year-desktop.png', fullPage: true});
  await yearChoices.filter({hasText: /^2026$/}).click();
  await expect(picker).toContainText('01 Jan 2026 \u2013 31 Dec 2026');
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  await expect(usd).toHaveText('$39,286.50');
  await expect(summary).toHaveText('420');
  // Custom range remains available after every new mode, including keyboard.
  await picker.click();
  await switchMode('Range');
  await popup.getByRole('button', {name: 'Next month', exact: true}).click();
  await expect(popup.locator('.usage-range-month strong')).toHaveText('February 2026');
  await expect(popup.locator('[data-date="2026-02-01"]')).toBeFocused();
  await popup.locator('[data-date="2026-02-02"]').click();
  await popup.locator('[data-date="2026-02-04"]').click();
  await expect(picker).toContainText('02 Feb 2026 \u2013 04 Feb 2026');
  await expect(popup).toHaveCount(0);
  await expect(chart).toHaveAttribute('aria-busy', 'false');
  await expect(usd).toHaveText('$0.00');
  // Arbitrary supported year selection; chosen range remains unchanged on refresh.
  await picker.click();
  await switchMode('Year');
  await yearChoices.filter({hasText: /^2028$/}).click();
  await expect(picker).toContainText('01 Jan 2028 \u2013 31 Dec 2028');
  await page.reload();
  await expect(picker).toContainText('01 Jan 2028 \u2013 31 Dec 2028');
  await expect(period).toHaveValue('Custom Range');
  expect(errors).toEqual([]);
  console.log('PASS: Today week labels with today-only summary; full week; current-month calendar weeks; 12 months; fixed dimensions; unique requests; single calendar/custom persistence; Week/Month/Year selection and navigation; scope rejection; unknown vs zero; mobile no scrolling');
} finally {await browser.close();}
