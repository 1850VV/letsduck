import io, json, sys, tempfile, unittest, zipfile
from pathlib import Path
from fastapi.testclient import TestClient
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
import server
from test_export import payload

from export_fixtures import multipart

class ExportTransportTest(unittest.TestCase):
    def test_multipart_and_legacy_json_produce_same_3mf_entries(self):
        with tempfile.TemporaryDirectory() as tmp,TestClient(server.create_app(database_url='sqlite:///'+tmp+'/api.db')) as client:
            p=payload();old=client.post('/api/export',json=p)
            response=client.post('/api/export',content=multipart(p),headers={'content-type':'multipart/form-data; boundary=duck-test'})
            self.assertEqual(response.status_code,200,response.text[:300] if response.status_code!=200 else '')
            with zipfile.ZipFile(io.BytesIO(old.content)) as a,zipfile.ZipFile(io.BytesIO(response.content)) as b:
                self.assertEqual(a.namelist(),b.namelist());self.assertIsNone(b.testzip())
                for name in a.namelist():
                    if name=='Metadata/duck_studio_materials.json':
                        x=json.loads(a.read(name));y=json.loads(b.read(name));x.pop('createdAt');y.pop('createdAt');self.assertEqual(x,y)
                    else:self.assertEqual(a.read(name),b.read(name),name)
    def test_invalid_multipart_is_rejected_before_export(self):
        with tempfile.TemporaryDirectory() as tmp,TestClient(server.create_app(database_url='sqlite:///'+tmp+'/api.db')) as client:
            for body,ctype in [(b'bad','multipart/form-data'),(b'bad','multipart/form-data; boundary=x'),(multipart(payload()).replace(b'name="cover"',b'name="plate1"'),'multipart/form-data; boundary=duck-test')]:
                r=client.post('/api/export',content=body,headers={'content-type':ctype});self.assertEqual(r.status_code,400)
            r=client.post('/api/export',content=b'x'*8_000_001,headers={'content-type':'multipart/form-data; boundary=x'});self.assertEqual(r.status_code,413)
