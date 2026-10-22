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

 robot=page.get_by_role('button',name='Say hi to Skill Lens AI robot')
 original=robot.bounding_box()
 robot.click();page.get_by_text('Hi!',exact=True).wait_for();page.wait_for_timeout(400)
 assert page.locator('.usage-robot-wave-arm').evaluate("el => getComputedStyle(el).transform")!='none'
 assert robot.bounding_box()==original
 page.screenshot(path='artifacts/robot-wave.png',full_page=True)
 page.wait_for_timeout(2400)
 assert page.get_by_text('Hi!',exact=True).count()==0
 robot.focus();page.keyboard.press('Enter');page.get_by_text('Hi!',exact=True).wait_for()
 page.emulate_media(reduced_motion='reduce')
 assert page.locator('.usage-robot-wave-arm').evaluate("el => getComputedStyle(el).animationName")=='none'
 page.emulate_media(reduced_motion='no-preference')
 page.dispatch_event('.usage-robot','click',{'pointerType':'touch'})
 page.get_by_text('Hi!',exact=True).wait_for()
 print('PASS: click/touch greeting, hand wave, fixed robot position, keyboard greeting, reduced motion, timed reset')

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

 mode['unknown']=True
 page.get_by_label('Company',exact=True).select_option('');page.reload()
 page.get_by_text('Unknown',exact=True).first.wait_for()
 assert page.locator('.usage-yellow strong').inner_text()!='Unknown'
 assert page.locator('.usage-purple strong').inner_text()=='Unknown'
 assert page.locator('.usage-pink strong').inner_text()=='Unknown'
 assert not errors,errors
 print('PASS: real-ledger response rendering, scoped company queries, refresh, mobile overflow, unknown tokens and independent INR/USD completeness; no runtime errors. Browser transport isolated; live login not tested.')
 browser.close()
