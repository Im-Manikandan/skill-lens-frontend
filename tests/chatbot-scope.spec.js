import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  // Bootstrap configuration and every chatbot provider-facing request are mocked.
  await page.route('**/env.json', route => route.fulfill({json:{}}));
});

async function openChat(page, clientId) {
  await page.goto('/tests/fixtures/chatbot-scope.html');
  await page.waitForFunction(() => typeof window.selectChatClient === 'function');
  await page.evaluate(id => window.selectChatClient(id), clientId);
  await page.getByRole('button', {name:'Open Skill Lens AI', exact:true}).click();
}
async function send(page, question) {
  await page.getByRole('textbox', {name:'Message Skill Lens AI'}).fill(question);
  await page.getByRole('button', {name:'Send message', exact:true}).click();
}

test('actual message and export requests use selected Redux scope and auth headers', async ({page}) => {
  const calls = [];
  await page.route('**/chat', async route => {
    const request = route.request();
    calls.push({body:request.postDataJSON(), headers:request.headers()});
    await route.fulfill({json:{answer:'Scoped answer', profiles:[], export_options:{
      artifact_type:'pdf', recommended_template:'candidate_shortlist', templates:[{id:'candidate_shortlist'}],
    }}});
  });
  await openChat(page, 42);
  await send(page, 'Find engineers');
  await page.getByRole('button', {name:/Choose PDF template/}).click();
  await page.getByRole('button', {name:'Generate PDF', exact:true}).click();
  await expect.poll(() => calls.length).toBe(2);
  expect(calls[0].body).toEqual({question:'Find engineers', client_id:42});
  expect(calls[1].body.client_id).toBe(42);
  expect(calls[1].body.question).toMatch(/^__artifact_export__:/);
  for (const call of calls) {
    expect(call.headers['x-skill-lens-application']).toBe('client');
    expect(call.headers.authorization).toMatch(/^Bearer /);
  }
});

test('client switch clears conversation/export state and late responses cannot cross scopes', async ({page}) => {
  const calls = [];
  let release;
  const delayed = new Promise(resolve => {release = resolve;});
  await page.route('**/chat', async route => {
    const body = route.request().postDataJSON();
    calls.push(body);
    if (body.client_id === 42) await delayed;
    try {await route.fulfill({json:{answer:body.client_id === 42 ? 'Old tenant answer' : 'New tenant answer', profiles:[]}});} catch { /* Aborted old request. */ }
  });
  await openChat(page, 42);
  await send(page, 'Old tenant question');
  await expect.poll(() => calls.length).toBe(1);
  await page.evaluate(() => window.selectChatClient(79));
  await page.getByRole('button', {name:'Open Skill Lens AI', exact:true}).click();
  release();
  await send(page, 'New tenant question');
  await expect(page.getByText('New tenant answer', {exact:true})).toBeVisible();
  await expect(page.getByText('Old tenant question', {exact:true})).toHaveCount(0);
  await expect(page.getByText('Old tenant answer', {exact:true})).toHaveCount(0);
  expect(calls.map(body => body.client_id)).toEqual([42,79]);
});

test('missing selection sends no request; backend rejection is not retried under another client', async ({page}) => {
  const calls = [];
  await page.route('**/chat', async route => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({status:403, json:{detail:'Company access denied'}});
  });
  await openChat(page, null);
  await send(page, 'No scope question');
  await expect(page.getByText('Select a client before using the chatbot.', {exact:true})).toBeVisible();
  expect(calls).toHaveLength(0);
  await page.evaluate(() => window.selectChatClient(79));
  await page.getByRole('button', {name:'Open Skill Lens AI', exact:true}).click();
  await send(page, 'Forbidden client question');
  await expect(page.getByText('Sorry, I could not process your request.', {exact:true})).toBeVisible();
  expect(calls).toEqual([{question:'Forbidden client question', client_id:79}]);
});
