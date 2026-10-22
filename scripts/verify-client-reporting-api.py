import sys
from pathlib import Path
sys.path.insert(0,str(Path('../skill-lens-service').resolve()))
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.db.connection import get_db_cursor
from routes.ai_usage_route import ai_usage_router
from utils.jwt_auth import CurrentUser,get_current_user
with get_db_cursor() as cur:
 cur.execute('SELECT u.id,u.email,u.name FROM user_info u JOIN admin a ON a.user_id=u.id WHERE a.is_active AND u.is_active LIMIT 1');a=cur.fetchone()
 cur.execute('SELECT u.id,u.email,u.name,ca.client_id FROM user_info u JOIN client_admin ca ON ca.user_id=u.id JOIN clients c ON c.id=ca.client_id WHERE ca.is_active AND u.is_active AND c.is_active LIMIT 1');c=cur.fetchone()
admin=CurrentUser(user_id=a['id'],email=a['email'],name=a['name'],user_type='admin')
client=CurrentUser(user_id=c['id'],email=c['email'],name=c['name'],user_type='client')
app=FastAPI();app.include_router(ai_usage_router);app.dependency_overrides[get_current_user]=lambda:admin
http=TestClient(app)
base=dict(start='2026-10-19T00:00:00Z',end='2026-10-26T00:00:00Z',application='client')
r=http.get('/ai-usage/report',params=base);assert r.status_code==200,r.text
assert r.json()['totals']['total_tokens']==20336
assert r.json()['reporting_period']['effective_start'].startswith('2026-10-20T18:30:00')
assert http.get('/ai-usage/report',params={**base,'end':'2026-10-20T18:30:00Z'}).json()['totals']['requests']==0
assert http.get('/ai-usage/report',params={**base,'start':'2026-10-23T00:00:00Z','end':'2026-10-22T00:00:00Z'}).status_code==422
app.dependency_overrides[get_current_user]=lambda:client
assert http.get('/ai-usage/report',params={**base,'application':'admin','company_id':c['client_id']}).status_code==403
with get_db_cursor() as cur:
 cur.execute('SELECT id FROM clients WHERE is_active AND id NOT IN(SELECT client_id FROM client_admin WHERE user_id=%s AND is_active) LIMIT 1',(client.user_id,));other=cur.fetchone()
if other: assert http.get('/ai-usage/report',params={**base,'company_id':other['id']}).status_code==403
print('PASS: real DB API serialization/cutoff, empty prior period, invalid range rejection, client-to-admin denial, tenant isolation (when unassigned company exists). Auth dependency uses existing verified DB identities in test process; no login bypass added to app.')
