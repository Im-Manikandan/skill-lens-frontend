import sys,json
from pathlib import Path
from datetime import datetime,timezone,timedelta
sys.path.insert(0,str(Path('../skill-lens-service').resolve()))
import base_util
from app.db.connection import get_db_cursor
from app.services.ai_usage_store import report
from routes.ai_usage_route import companies
from utils.jwt_auth import CurrentUser
with get_db_cursor() as cur:
 cur.execute('SELECT u.id,u.email,u.name FROM user_info u JOIN admin a ON a.user_id=u.id WHERE a.is_active AND u.is_active LIMIT 1')
 row=cur.fetchone()
user=CurrentUser(user_id=row['id'],email=row['email'],name=row['name'],user_type='admin')
now=datetime.now(timezone.utc); start=now.replace(hour=0,minute=0,second=0,microsecond=0)-timedelta(days=now.weekday()); end=start+timedelta(days=7)
cs=companies(user)
reports={}
for cid in [None,*[c['id'] for c in cs]]:
 for app in ['admin','client']:
  data=report(user,cid,start,end,'daily',application=app)
  assert data['application']==app and data['kind']=='external'
  assert sum(r['requests'] for r in data['rows'])==data['totals']['requests']
  reports[f'{cid}:{app}']=data
Path('artifacts').mkdir(exist_ok=True)
Path('artifacts/usage-real-data.json').write_text(json.dumps(dict(companies=cs,reports=reports,from_date=start.date().isoformat(),to_date=(end-timedelta(days=1)).date().isoformat()),default=str))
print('PASS: real DB company counts and daily aggregates, both application scopes;',len(cs),'companies')
for app in ['admin','client']:
 print(app,json.dumps(reports[f'None:{app}']['totals'],default=str))

# Validate authorization without changing users, memberships, or ledger records.
from fastapi import HTTPException
client_identity=CurrentUser(user_id=user.user_id,email=user.email,name=user.name,user_type='client')
try:
 report(client_identity,None,start,end,'daily',application='admin')
 raise AssertionError('Client identity unexpectedly obtained system-wide Admin usage')
except HTTPException as exc:
 assert exc.status_code==403
print('PASS: client identity denied system-wide Admin analytics')
with get_db_cursor() as cur:
 for app in ['admin','client']:
  cur.execute("""SELECT sum(u.input_tokens+u.output_tokens) AS tokens FROM ai_usage_logs u
   JOIN ai_models m ON m.id=u.model_id JOIN ai_providers p ON p.id=m.provider_id
   WHERE p.kind='external' AND u.units->>'_application'=%s AND u.occurred_at >= %s AND u.occurred_at < %s
   AND (u.status='success' OR u.input_tokens IS NOT NULL OR u.output_tokens IS NOT NULL OR u.units ? '_provider_billing')""",(app,max(start,__import__('app.services.ai_usage_reporting',fromlist=['client_reporting_start']).client_reporting_start()) if app=='client' else start,end))
  raw=cur.fetchone()['tokens']
  total=reports[f'None:{app}']['totals']
  if total['unknown_token_requests']==0:
   assert (raw or 0)==total['total_tokens']
print('PASS: Admin/Client token totals independently match external ledger SQL')
