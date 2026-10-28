import {test, expect} from '@playwright/test';

const counts = {requests:10, unknown_token_requests:0, input_tokens:6678, output_tokens:4736,
  total_tokens:11414, total_cost_usd:'0.01350336', total_cost_inr:'1.2826841664'};
const empty = {requests:0, unknown_token_requests:0, input_tokens:0, output_tokens:0,
  total_tokens:0, total_cost_usd:'0', total_cost_inr:'0'};
const metric = (page, name) => page.locator('.usage-metric').filter({has:page.getByRole('heading',{name,exact:true})}).locator('strong');

async function dashboard(page, query, clientTotals = counts) {
  await page.clock.setFixedTime(new Date('2026-10-28T08:00:00Z'));
  await page.route('**/env.json', route => route.fulfill({json:{}}));
  await page.route('**/ai-usage/companies', route => route.fulfill({json:[{id:42,name:'Fixture client',total_employees:1}]}));
  const queries = [];
  await page.route('**/ai-usage/report?**', async route => {
    const q = new URL(route.request().url()).searchParams;
    queries.push(q);
    expect(q.get('company_id')).toBe('42');
    expect(q.get('kind')).toBe('external');
    expect(q.get('timezone')).toBe('Asia/Kolkata');
    const totals = q.get('application') === 'admin' ? empty : typeof clientTotals === 'function' ? clientTotals(q) : clientTotals;
    await route.fulfill({json:{application:q.get('application'),kind:'external',timezone:'Asia/Kolkata',
      group:q.get('group'),company:{id:42},totals,rows:totals.requests ? [{...totals,label:totals.day || '2026-10-27'}] : []}});
  });
  await page.goto('/tests/fixtures/dashboard-usage.html?company_id=42&'+query);
  await page.waitForFunction(() => typeof window.mountUsageDashboard === 'function');
  await page.evaluate(() => window.mountUsageDashboard());
  await expect(page.locator('.usage-summary')).toHaveAttribute('aria-busy','false');
  return queries;
}

test('Today cards correctly show no external usage while week chart retains 27 October cost', async ({page}) => {
  const queries = await dashboard(page,'period=Today');
  for (const title of ['Admin Token Usage','Client Token Usage','Total Token Usage']) await expect(metric(page,title)).toHaveText('0');
  await expect(metric(page,'AI Cost (USD $)')).toHaveText('$0.00');
  await expect(metric(page,'AI Cost (INR ₹)')).toHaveText('₹0.00');
  await expect(page.locator('path.recharts-line-curve')).toHaveCount(2);
  // The only nonzero fixture row is 27 October: a non-flat curve proves the
  // historical cost is plotted even though today's summary is genuinely zero.
  await expect.poll(() => page.locator('path.recharts-line-curve').first().evaluate(path => path.getBBox().height)).toBeGreaterThan(0);
  expect(queries).toHaveLength(2);
  for (const q of queries) expect(q.get('start')).toBe('2026-10-25T18:30:00.000Z');
});

test('custom 27 October range uses inclusive IST dates; cards show actual historical report totals', async ({page}) => {
  const queries = await dashboard(page,'chart_range=custom&period=Custom%20Range&from=2026-10-27&to=2026-10-27');
  await expect(metric(page,'Client Token Usage')).toHaveText('11,414');
  await expect(metric(page,'Total Token Usage')).toHaveText('11,414');
  await expect(metric(page,'AI Cost (USD $)')).toHaveText('$0.0135');
  await expect(metric(page,'AI Cost (INR ₹)')).toHaveText('₹1.2827');
  for (const q of queries) {
    expect(q.get('start')).toBe('2026-10-26T18:30:00.000Z');
    expect(q.get('end')).toBe('2026-10-27T18:30:00.000Z');
  }
});

test('provider total is authoritative; unknown USD/INR remain Unknown in real dashboard cards', async ({page}) => {
  await dashboard(page,'chart_range=custom&period=Custom%20Range&from=2026-10-27&to=2026-10-27',
    {...counts,requests:1,input_tokens:20,output_tokens:7,total_tokens:29,cached_tokens:8,
      reasoning_tokens:5,total_cost_usd:null,total_cost_inr:null});
  await expect(metric(page,'Client Token Usage')).toHaveText('29');
  await expect(metric(page,'Total Token Usage')).toHaveText('29');
  await expect(metric(page,'AI Cost (USD $)')).toHaveText('Unknown');
  await expect(metric(page,'AI Cost (INR ₹)')).toHaveText('Unknown');
});


const savedChatUsage = {...counts,requests:1,input_tokens:3410,output_tokens:757,total_tokens:4167,
  total_cost_usd:'0.002908',total_cost_inr:'0.27623092',day:'2026-10-28'};

test('return from Client chatbot refreshes saved usage despite disabled production focus defaults', async ({page, context}) => {
  let saved = empty;
  const queries = await dashboard(page,'period=Today',() => saved);
  await expect(metric(page,'Client Token Usage')).toHaveText('0');
  await page.evaluate(() => window.setUsageFocused(false));
  const clientPage = await context.newPage();
  await clientPage.route('**/env.json', route => route.fulfill({json:{}}));
  await clientPage.route('**/chat', async route => {
    expect(route.request().postDataJSON()).toEqual({question:'Find Python engineers',client_id:42});
    expect(route.request().headers()['x-skill-lens-application']).toBe('client');
    saved = savedChatUsage; // Simulated server persistence after actual UI POST.
    await route.fulfill({json:{answer:'Search complete',profiles:[]}});
  });
  await clientPage.goto('/tests/fixtures/chatbot-scope.html');
  await clientPage.waitForFunction(() => typeof window.selectChatClient === 'function');
  await clientPage.evaluate(() => window.selectChatClient(42));
  await clientPage.getByRole('button',{name:'Open Skill Lens AI',exact:true}).click();
  await clientPage.getByRole('textbox',{name:'Message Skill Lens AI'}).fill('Find Python engineers');
  await clientPage.getByRole('button',{name:'Send message',exact:true}).click();
  await expect(clientPage.getByText('Search complete',{exact:true})).toBeVisible();
  await clientPage.close();
  await page.bringToFront();
  await page.evaluate(() => window.setUsageFocused(true));
  await expect(metric(page,'Client Token Usage')).toHaveText('4,167');
  await expect(metric(page,'AI Cost (USD $)')).toHaveText('$0.0029');
  expect(queries.length).toBeGreaterThanOrEqual(4);
});

test('reconnecting refreshes server usage without manual reload', async ({page}) => {
  let saved = empty;
  await dashboard(page,'period=Today',() => saved);
  await expect(metric(page,'Total Token Usage')).toHaveText('0');
  await page.evaluate(() => window.setUsageOnline(false));
  saved = savedChatUsage;
  await page.evaluate(() => window.setUsageOnline(true));
  await expect(metric(page,'Total Token Usage')).toHaveText('4,167');
});

test('Monthly to same-date custom view refetches daily data instead of reusing monthly cache', async ({page}) => {
  const queries = await dashboard(page,'period=Monthly');
  await expect.poll(() => queries.some(q => q.get('group') === 'monthly')).toBe(true);
  await page.evaluate(() => {
    window.history.pushState({},'', '?company_id=42&chart_range=custom&period=Custom%20Range&from=2026-01-01&to=2026-12-31');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect.poll(() => queries.some(q => q.get('group') === 'daily')).toBe(true);
});
