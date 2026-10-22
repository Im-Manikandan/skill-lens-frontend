import json
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
fixture=json.loads(Path('artifacts/usage-real-data.json').read_text())
errors=[]; calls=[]; mode={'unknown':False}
def api(route):
 p=urlparse(route.request.url); q=parse_qs(p.query)
 if not p.path.startswith('/api/'):
  route.continue_(); return
 if p.path.endswith('/ai-usage/companies'): data=fixture['companies']
 elif p.path.endswith('/ai-usage/report'):
  calls.append(q)
  data=json.loads(json.dumps(fixture['reports'][f"{q.get('company_id',['None'])[0]}:{q['application'][0]}"]))
  if mode['unknown'] and q['application'][0]=='client': data['totals']['unknown_token_requests']=1;data['totals']['total_cost_inr']=None
 else: data=[]
 route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 page=browser.new_page(viewport={'width':1672,'height':1000},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/**',api)
 page.goto('http://localhost:3002/auth/login/admin')
 page.get_by_role('button',name='Sign In',exact=True).wait_for()
 page.evaluate('''async()=>{const {store,persistor}=await import('/src/store/Store.js');const {default:ApiUtils}=await import('/src/api/ApiUtils.jsx');ApiUtils.setCookie('accessToken','isolated-ui-test');store.dispatch({type:'auth/setAuthToken',payload:{access_token:'isolated-ui-test'}});store.dispatch({type:'userType/setUserType',payload:'admin'});await persistor.flush();}''')
 page.goto('http://localhost:3002/admin/ai-usage')
 page.get_by_text('43,827',exact=True).wait_for()
 assert page.locator('.usage-metric').count()==5
 assert page.get_by_text('Local AI Usage',exact=True).count()==0

 day=fixture['from_date']
 page.get_by_label('To Date (UTC)').fill(day)
 page.wait_for_timeout(700)
 ticks=page.locator('.recharts-cartesian-axis-tick-value').filter(has_text='Mon 19 Oct')
 assert ticks.count()==1,ticks.all_text_contents()
 assert ticks.text_content()=='Mon 19 Oct',ticks.text_content()
 assert calls[-1]['start']==[day+'T00:00:00Z']
 page.reload();page.get_by_role('heading',name='AI Usage & Cost Dashboard').wait_for()
 page.wait_for_timeout(600)
 assert page.get_by_label('To Date (UTC)').input_value()==day
 assert page.locator('.recharts-cartesian-axis-tick-value').filter(has_text='Mon 19 Oct').count()==1
 assert not errors,errors
 print('PASS: weekday + exact date, one selected day only, exact API date scope, refresh persistence')
 browser.close()
