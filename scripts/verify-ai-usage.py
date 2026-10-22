import json
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
requests=[]
errors=[]
def api(route):
 p=urlparse(route.request.url); q=parse_qs(p.query)
 if not p.path.startswith('/api/'):
  route.continue_(); return
 if p.path.endswith('/ai-usage/companies'): data=[{'id':4,'name':'Test Company'}]
 elif p.path.endswith('/admin/clients'): data=[{'id':4,'client_name':'Test Company','profiles_count':1}]
 elif p.path.endswith('/admin/profiles/4'):data=[{'id':1}]
 elif p.path.endswith('/ai-usage/report'):
  requests.append(q)
  totals=dict(requests=4,input_tokens=400,output_tokens=40,external_usd='2',external_inr='160',total_cost_usd='2',total_cost_inr='160',unknown_token_requests=0)
  data=dict(company={'id':4,'name':'Test Company'} if q.get('company_id') else None,totals=totals,rows=[])
 else:data=[]
 route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 page=browser.new_page()
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.route('**/api/**',api)
 page.goto('http://localhost:3000/auth/login/admin')
 page.get_by_role('button',name='Sign In',exact=True).wait_for()
 page.evaluate('''async()=>{
 const {store,persistor}=await import('/src/store/Store.js');
 const {default:ApiUtils}=await import('/src/api/ApiUtils.jsx');
 ApiUtils.setCookie('accessToken','isolated-ui-test');
 store.dispatch({type:'auth/setAuthToken',payload:{access_token:'isolated-ui-test'}});
 store.dispatch({type:'userType/setUserType',payload:'admin'});
 await persistor.flush();
 }''')
 page.goto('http://localhost:3000/admin/ai-usage')
 page.get_by_role('heading',name='AI Usage & Cost Dashboard').wait_for()
 page.get_by_text('440',exact=True).wait_for()
 assert page.locator('main .row section').count()==4
 assert page.get_by_text('Total AI Requests',exact=True).count()==0
 assert requests and 'company_id' not in requests[-1]
 page.get_by_label('Company',exact=True).select_option('4')
 page.wait_for_function("new URLSearchParams(location.search).get('company_id') === '4'")
 page.get_by_text('440',exact=True).wait_for()
 page.wait_for_timeout(500)
 assert requests[-1]['company_id']==['4']
 assert all('uploads_only' not in q and 'feature' not in q for q in requests)
 assert not errors,errors
 print('PASS: all-company + selected-company reports; tokens/cost cards; no upload-only filter; no runtime errors')
 browser.close()
