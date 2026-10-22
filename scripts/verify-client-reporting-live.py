import sys,json,os,uuid
from pathlib import Path
from datetime import datetime,timezone,timedelta
from unittest.mock import patch
sys.path.insert(0,str(Path('../skill-lens-service').resolve()))
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
import base_util
from app.db.connection import get_db_cursor
from app.services import ai_usage as ai,ai_usage_store as store
from app.services.ai_usage_reporting import client_reporting_start
from utils.jwt_auth import CurrentUser
with get_db_cursor() as cur:
 cur.execute('SELECT u.id,u.email,u.name FROM user_info u JOIN admin a ON a.user_id=u.id WHERE u.is_active AND a.is_active LIMIT 1')
 a=cur.fetchone()
 cur.execute("SELECT u.id,u.email,u.name,c.id AS company_id,c.industry_id FROM user_info u JOIN client_admin ca ON ca.user_id=u.id JOIN clients c ON c.id=ca.client_id WHERE u.is_active AND ca.is_active AND c.is_active AND EXISTS(SELECT 1 FROM profiles p WHERE p.client_id=c.id AND p.source='talent') LIMIT 1")
 c=cur.fetchone()
assert c,'No authorized client with searchable profiles'
admin=CurrentUser(user_id=a['id'],email=a['email'],name=a['name'],user_type='admin')
client=CurrentUser(user_id=c['id'],email=c['email'],name=c['name'],user_type='client')
store.authorize(client,c['company_id'])
start=datetime(2026,10,19,tzinfo=timezone.utc);end=start+timedelta(days=7);cutoff=client_reporting_start()
def snapshot():
 with get_db_cursor() as cur:
  cur.execute("SELECT count(*) AS n FROM ai_usage_logs WHERE occurred_at<%s",(cutoff,));history=cur.fetchone()['n']
  cur.execute('SELECT count(*) AS n FROM ai_cost_records');costs=cur.fetchone()['n']
  cur.execute("SELECT count(*) AS n FROM ai_usage_logs u JOIN ai_models m ON m.id=u.model_id JOIN ai_providers p ON p.id=m.provider_id WHERE p.kind='external'");external=cur.fetchone()['n']
 return history,costs,external
before=snapshot()
results={}
for app in ['admin','client']:
 result=store.report(admin,None,start,end,'daily',application=app)
 effective=max(start,cutoff) if app=='client' else start
 with get_db_cursor() as cur:
  cur.execute("""SELECT count(*) AS n,coalesce(sum(u.input_tokens+u.output_tokens),0) AS tokens FROM ai_usage_logs u JOIN ai_models m ON m.id=u.model_id JOIN ai_providers p ON p.id=m.provider_id WHERE p.kind='external' AND u.units->>'_application'=%s AND u.occurred_at>=%s AND u.occurred_at<%s AND (u.status='success' OR u.input_tokens IS NOT NULL OR u.output_tokens IS NOT NULL OR u.units ? '_provider_billing')""",(app,effective,end))
  raw=cur.fetchone()
 assert raw['n']==result['totals']['requests']
 if not result['totals']['unknown_token_requests']:assert raw['tokens']==result['totals']['total_tokens']
 results[app]=result['totals']
old=store.report(admin,None,start,cutoff,'daily',application='client')
assert old['totals']['requests']==0 and old['totals']['total_tokens']==0
assert snapshot()==before
print('PASS: real ledger cutoff and raw SQL reconciliation; pre-cutoff history/costs preserved',flush=True)
from app.services.search.service import get_search_service
local=[]
def persist_local(event):
 assert event['kind']=='local','Unexpected paid AI operation blocked'
 assert event['units'].get('_application')=='client'
 store.persist_event(event);local.append(event['id'])
ctx=ai.usage_context.set(dict(application='client',actor_role='client',user_id=client.user_id,company_id=c['company_id'],feature='verification:client-semantic-search',request_id=str(uuid.uuid4()),attribution='authenticated'))
try:
 with patch.object(ai,'enqueue',persist_local):
  profiles=get_search_service().semantic_search('data privacy lawyer',top_k=3,client_id=c['company_id'],industry_id=c['industry_id'],source='talent')
finally:ai.usage_context.reset(ctx)
assert local,'No real local inference recorded'
with get_db_cursor() as cur:
 cur.execute("SELECT u.input_tokens,u.output_tokens,p.kind,c.cost_kind,c.inr_cost FROM ai_usage_logs u JOIN ai_models m ON m.id=u.model_id JOIN ai_providers p ON p.id=m.provider_id LEFT JOIN ai_cost_records c ON c.usage_id=u.id WHERE u.id=ANY(%s::uuid[])",(local,))
 rows=cur.fetchall()
 assert all(r['input_tokens'] is None and r['output_tokens'] is None and r['kind']=='local' and (r['inr_cost'] is None or r['inr_cost']==0) for r in rows)
assert snapshot()[0]==before[0] and snapshot()[2]==before[2]
assert store.report(admin,None,start,end,'daily',application='admin')['totals']==results['admin']
assert store.report(admin,None,start,end,'daily',application='client')['totals']==results['client']
print('PASS: actual local semantic search returned',len(profiles),'profiles;',len(local),'real local inference events saved; no external tokens/calls; Admin/Client external totals unchanged',flush=True)
Path('artifacts/client-reporting-verification.json').write_text(json.dumps(dict(cutoff_utc=cutoff,selected_start=start,selected_end=end,totals=results,local_events=len(local),profiles_returned=len(profiles),historical_events_before_cutoff=before[0]),default=str,indent=2))
