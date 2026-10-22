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
 expected=sum(int(fixture['reports'][f'None:{app}']['totals']['total_tokens']) for app in ['admin','client'])
 page.locator('.usage-pink strong').filter(has_text=f'{expected:,}').wait_for()

 assert page.locator('.usage-metric').count()==5
 page.get_by_label('Company',exact=True).select_option(str(fixture['companies'][0]['id']))
 page.wait_for_timeout(700)
 assert any(q.get('company_id')==[str(fixture['companies'][0]['id'])] and q['application']==['client'] for q in calls)
 page.evaluate("async()=>{const {store,persistor}=await import('/src/store/Store.js');store.dispatch({type:'userType/setUserType',payload:'client'});await persistor.flush();}")
 page.goto('http://localhost:3002/client/dashboard')
 page.get_by_role('link',name='Switch Account',exact=True).wait_for()
 assert page.get_by_role('link',name='AI Usage & Cost',exact=True).count()==0
 for name in ['Home','Search','My Account','Switch Account']:
  assert page.get_by_role('link',name=name,exact=True).count()==1
 page.goto('http://localhost:3002/client/ai-usage')
 page.wait_for_url('**/error/404')
 assert page.get_by_role('heading',name='AI Usage & Cost Dashboard').count()==0
 assert not errors,errors
 print('PASS: updated Admin real-ledger totals, company scope, Client navigation preserved, Client AI page removed/404')
 browser.close()
