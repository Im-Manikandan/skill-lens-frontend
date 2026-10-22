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
 assert page.get_by_text('Local AI Usage',exact=True).count()==0
 page.screenshot(path='artifacts/approved-dashboard-desktop.png',full_page=True)
 cid=str(fixture['companies'][0]['id'])
 page.get_by_label('Company',exact=True).select_option(cid)
 page.wait_for_timeout(800)
 assert any(q.get('company_id')==[cid] and q['application']==['client'] for q in calls)
 page.get_by_label('From Date (UTC)').fill(fixture['from_date'])
 page.reload();page.get_by_role('heading',name='AI Usage & Cost Dashboard').wait_for()
 assert page.get_by_label('Company',exact=True).input_value()==cid
 assert page.get_by_label('From Date (UTC)').input_value()==fixture['from_date']
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(800)
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 page.screenshot(path='artifacts/approved-dashboard-mobile.png',full_page=True)
 mode['unknown']=True
 page.get_by_label('Company',exact=True).select_option('');page.reload()
 page.get_by_text('Unknown',exact=True).first.wait_for()
 assert page.locator('.usage-yellow strong').inner_text()!='Unknown'
 assert page.locator('.usage-purple strong').inner_text()=='Unknown'
 assert page.locator('.usage-pink strong').inner_text()=='Unknown'
 assert not errors,errors
 print('PASS: real-ledger response rendering, scoped company queries, refresh, mobile overflow, unknown tokens and independent INR/USD completeness; no runtime errors. Browser transport isolated; live login not tested.')
 browser.close()
