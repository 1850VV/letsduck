"""Real HTTP validation and private scheme round trip in a temporary SQLite database."""
import json,os,socket,subprocess,sys,tempfile,time,unittest,urllib.request,urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class HttpLocaleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory()
        with socket.socket() as s:s.bind(('127.0.0.1',0));cls.port=s.getsockname()[1]
        cls.process=subprocess.Popen([sys.executable,str(ROOT/'backend/server.py'),'--port',str(cls.port)],env={**os.environ,'DUCK_DB':str(Path(cls.tmp.name)/'db.sqlite'),'DUCK_QUIET':'1','DUCK_EDITION':'server'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:cls.request('GET','/health');break
            except OSError:time.sleep(.05)
        else:raise RuntimeError('Test HTTP server did not start')
    @classmethod
    def tearDownClass(cls):
        cls.process.terminate();cls.process.wait(timeout=5);cls.tmp.cleanup()
    @classmethod
    def request(cls,method,path,body=None,token=None):
        request=urllib.request.Request('http://127.0.0.1:'+str(cls.port)+'/api'+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Content-Type':'application/json',**({'Authorization':'Bearer '+token} if token else {})})
        try:
            with urllib.request.urlopen(request,timeout=5) as r:return r.status,json.load(r)
        except urllib.error.HTTPError as r:return r.code,json.load(r)
    def test_anonymous_error_has_stable_code(self):
        status,data=self.request('GET','/me')
        self.assertEqual(status,401);self.assertEqual(data.get('code'),'auth.required')
    def test_private_scheme_round_trip_keeps_chinese_user_text(self):
        status,data=self.request('POST','/auth/register',{'name':'作者猫','password':'test-password'})
        self.assertEqual(status,200)
        token=data['token'];model=json.loads((ROOT/'assets/model.json').read_text())
        design={'colors':{p['id']:p['color'] for p in model['parts']},'assignments':{p['id']:None for p in model['parts']}}
        status,data=self.request('PUT','/schemes/s-i18n-test',{'name':'我的猫 <海风>','design':design},token)
        self.assertEqual(status,200,data);self.assertEqual(data['name'],'我的猫 <海风>')
        status,data=self.request('GET','/schemes',token=token);self.assertEqual(data[0]['name'],'我的猫 <海风>')
