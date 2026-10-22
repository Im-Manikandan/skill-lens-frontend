import sys
from pathlib import Path
from datetime import datetime,timezone,timedelta
from types import SimpleNamespace
from contextlib import contextmanager
import pytest
sys.path.insert(0,str(Path('../skill-lens-service').resolve()))
from app.services.ai_usage_reporting import client_reporting_start,reporting_start
from app.services import ai_usage_store as store
UTC=timezone.utc
START=datetime(2026,10,19,tzinfo=UTC)
CUTOFF=datetime(2026,10,20,18,30,tzinfo=UTC)

def test_kolkata_midnight():
 assert client_reporting_start()==CUTOFF

@pytest.mark.parametrize('app,kind,start,expected',[
 ('client','external',START,CUTOFF),
 ('client','external',CUTOFF,CUTOFF),
 ('client','external',CUTOFF+timedelta(seconds=1),CUTOFF+timedelta(seconds=1)),
 ('admin','external',START,START),('client','local',START,START)])
def test_intersection(app,kind,start,expected):
 assert reporting_start(app,kind,start)==expected

@pytest.mark.parametrize('end',[CUTOFF-timedelta(seconds=1),CUTOFF,CUTOFF+timedelta(days=1)])
def test_report_sql_applies_cutoff_without_changing_selected_dates(monkeypatch,end):
 queries=[]
 class Cursor:
  def execute(self,sql,params): queries.append((sql,params))
  def fetchone(self): return dict(requests=0,unknown_usd_costs=0,unknown_external_costs=0,external_usd=0,external_inr=0,input_tokens=0,output_tokens=0)
  def fetchall(self):return []
 @contextmanager
 def cursor():yield Cursor()
 monkeypatch.setattr(store,'authorize',lambda *args:True)
 monkeypatch.setattr(store,'get_db_cursor',cursor)
 result=store.report(SimpleNamespace(user_type='admin'),None,START,end,'daily',application='client')
 assert all(params[:3]==['external',CUTOFF,end] for _,params in queries)
 assert result['reporting_period']['selected_start']==START
 assert result['totals']['total_tokens']==0
 assert not any(word in sql.upper() for sql,_ in queries for word in ['DELETE ','UPDATE ','INSERT '])
