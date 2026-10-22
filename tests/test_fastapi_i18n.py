"""New FastAPI lifecycle retains additive, machine-readable localization errors."""
import sys,tempfile,unittest
from pathlib import Path
from fastapi.testclient import TestClient
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
import server,exporter
from export_jobs import ExportBusy

class BusyExports:
    async def run(self,payload):raise ExportBusy('导出任务较多，请稍后重试')
    async def close(self):pass

class FastApiLocaleTests(unittest.TestCase):
    def test_queue_busy_and_pagination_preserve_status_code_and_retry(self):
        with tempfile.TemporaryDirectory() as tmp:
            with TestClient(server.create_app(database_url='sqlite:///'+tmp+'/i18n.db',exports=BusyExports(),edition='server')) as client:
                payload={'source_sha256':exporter.MODEL['source_sha256'],'assignments':{p['id']:next(x['id'] for x in exporter.PRODUCTS.values() if x['series']==p['material'] and x['hex']==p['color']) for p in exporter.PARTS.values()}}
                response=client.post('/api/export',json=payload)
                self.assertEqual(response.status_code,503)
                self.assertEqual(response.headers['retry-after'],'2')
                self.assertEqual(response.json()['code'],'export.busy')
                response=client.get('/api/works?limit=201')
                self.assertEqual(response.status_code,422)
                self.assertEqual(response.json()['code'],'request.pagination')
