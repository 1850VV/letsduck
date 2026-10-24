"""Opt-in local diagnostic service; run with REPO_ROOT and OUTPUT_JSON on isolated port 8904."""
import sys,os,time,json,threading
from pathlib import Path
repo=Path(sys.argv[1]).resolve();sys.path.insert(0,str(repo/'personal'))
os.environ['DUCK_ASSETS']=str(repo/'assets')
import app
metrics=[];local=threading.local()
for name in ('compressed','valid_pack','prepared_gzip'):
 if not hasattr(app,name):continue
 original=getattr(app,name)
 def wrap(*args,_name=name,_fn=original,**kwargs):
  start=time.perf_counter()
  try:return _fn(*args,**kwargs)
  finally:
   spans=getattr(local,'spans',{});spans[_name]=spans.get(_name,0)+(time.perf_counter()-start)*1000;local.spans=spans
 setattr(app,name,wrap)
original_get=app.Handler.do_GET
original_body=app.Handler.send_body
def get(self):
 local.start=time.perf_counter();local.spans={}
 try:return original_get(self)
 finally:
  metrics.append({'path':self.path,'totalMs':(time.perf_counter()-local.start)*1000,**local.spans})
def body(self,status,data,content_type='application/json; charset=utf-8',headers=()):
 spans=getattr(local,'spans',{})
 extra=[('Server-Timing',', '.join(k+';dur='+str(round(v,3)) for k,v in spans.items()))] if spans else []
 return original_body(self,status,data,content_type,list(headers)+extra)
app.Handler.do_GET=get;app.Handler.send_body=body
server=app.create_server(port=8904,search=1,db='/tmp/duck-assets-diagnostic.db',legacy=None)
print('READY '+str(repo),flush=True)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:
 server.server_close();server.store.close()
 Path(sys.argv[2]).write_text(json.dumps(metrics,indent=2))
