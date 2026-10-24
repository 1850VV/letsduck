import sys
import tempfile
import unittest
from pathlib import Path
sys.path[:0] = [str(Path(__file__).resolve().parents[1] / 'personal'), str(Path(__file__).resolve().parents[1] / 'backend')]
from schemes import PersonalStore

class BackupTests(unittest.TestCase):
    def test_roundtrip_and_keep_both(self):
        with tempfile.TemporaryDirectory() as folder:
            a = PersonalStore(Path(folder)/'a.db')
            b = PersonalStore(Path(folder)/'b.db')
            try:
                a.save_scheme('one', {'name':'Duck', 'design':{'colors':{'p':'#112233'},'assignments':{'p':None}}})
                bundle = a.export_backup({'draft':None, 'progress':[]})
                preview = b.preview_backup(bundle)
                result = b.import_backup(bundle, 'keep', preview['revision'])
                self.assertEqual(len(b.schemes()), 1)
                self.assertNotEqual(result['idMap']['one'], 'one')
                preview = b.preview_backup(bundle)
                self.assertEqual(len(preview['conflicts']), 1)
                b.import_backup(bundle, 'keep', preview['revision'])
                self.assertEqual(len(b.schemes()), 2)
            finally:
                a.close(); b.close()

    def test_corrupt_new_version_and_stale_preview_do_not_write(self):
        with tempfile.TemporaryDirectory() as folder:
            store = PersonalStore(Path(folder)/'a.db')
            try:
                bundle = store.export_backup({'draft':None,'progress':[]})
                broken = dict(bundle, version=99)
                with self.assertRaises(ValueError): store.preview_backup(broken)
                broken = dict(bundle, checksum='0'*64)
                with self.assertRaises(ValueError): store.preview_backup(broken)
                preview = store.preview_backup(bundle)
                store.save_scheme('x', {'name':'X','design':{'colors':{'p':'#ffffff'},'assignments':{'p':None}}})
                with self.assertRaises(ValueError): store.import_backup(bundle, 'keep', preview['revision'])
                self.assertEqual(len(store.schemes()), 1)
            finally: store.close()

    def test_overwrite_has_durable_recovery_and_concurrent_change_guard(self):
        with tempfile.TemporaryDirectory() as folder:
            a = PersonalStore(Path(folder)/'a.db'); b = PersonalStore(Path(folder)/'b.db')
            def row(color): return {'name':'Duck','design':{'colors':{'p':color},'assignments':{'p':None}}}
            try:
                a.save_scheme('a',row('#111111')); b.save_scheme('b',row('#222222'))
                before = b.schemes()
                bundle=a.export_backup({'draft':None,'progress':[]})
                preview=b.preview_backup(bundle)
                result=b.import_backup(bundle,'overwrite',preview['revision'],'a'*32)
                self.assertEqual(result['idMap']['a'],'b')
                self.assertEqual(b.schemes()[0]['design']['colors']['p'],'#111111')
                recovery=b.recovery_backup('a'*32, {'draft':None,'progress':[]})
                self.assertEqual(recovery['schemes'],before)
                b.close(); b=PersonalStore(Path(folder)/'b.db')
                self.assertTrue(b.restore_backup('a'*32)['ok'])
                self.assertEqual(b.schemes(), before)
                preview=b.preview_backup(bundle)
                result=b.import_backup(bundle,'overwrite',preview['revision'])
                b.save_scheme('b',row('#333333'))
                with self.assertRaises(ValueError):b.restore_backup(result['recovery'])
                self.assertEqual(b.schemes()[0]['design']['colors']['p'],'#333333')
            finally:a.close();b.close()

    def test_invalid_relationships_ids_and_failed_transaction_are_atomic(self):
        import copy
        from backup import digest, STEP_IDS
        with tempfile.TemporaryDirectory() as folder:
            store=PersonalStore(Path(folder)/'a.db')
            try:
                store.save_scheme('x',{'name':'X','design':{'colors':{'p':'#ffffff'},'assignments':{'p':None}}})
                bundle=store.export_backup({'draft':None,'progress':[]})
                for bad_id in ('../file', [], 4, None):
                    bad=copy.deepcopy(bundle);bad['schemes'][0]['id']=bad_id
                    bad['checksum']=digest({k:v for k,v in bad.items() if k!='checksum'})
                    with self.assertRaises(ValueError):store.preview_backup(bad)
                bad=copy.deepcopy(bundle)
                bad['browser']['progress']=[{'scope':'scheme:missing','tutorial':'hardware-v3','stepIds':STEP_IDS,'view':{'step':0,'progress':1},'seen':[],'built':[]}]
                bad['checksum']=digest({k:v for k,v in bad.items() if k!='checksum'})
                with self.assertRaises(ValueError):store.preview_backup(bad)
                before=store.schemes();preview=store.preview_backup(bundle)
                store.db.execute("CREATE TRIGGER fail_import BEFORE INSERT ON backup_recovery BEGIN SELECT RAISE(ABORT,'disk failure'); END")
                with self.assertRaises(Exception):store.import_backup(bundle,'keep',preview['revision'])
                self.assertEqual(store.schemes(),before)
            finally:store.close()

class BackupAPITests(unittest.TestCase):
    def test_two_independent_databases_and_invalid_http_requests(self):
        import app
        import threading
        import json
        from urllib.request import Request, urlopen
        from urllib.error import HTTPError
        from backup import STEP_IDS
        with tempfile.TemporaryDirectory() as folder:
            servers=[app.create_server(port=0,db=Path(folder)/(name+'.db')) for name in ('a','b')]
            for server in servers:threading.Thread(target=server.serve_forever,daemon=True).start()
            def call(index,path,body):
                request=Request('http://127.0.0.1:%d/api/%s'%(servers[index].server_address[1],path),data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
                with urlopen(request) as response:return json.load(response)
            try:
                ids=servers[0].store.part_ids or {'p'}
                design={'colors':{p:'#ABCDEF' for p in ids},'assignments':{p:None for p in ids}}
                servers[0].store.save_scheme('one',{'name':'API Duck','design':design})
                browser={'draft':{'name':'API Duck','design':design,'activeId':'one','draftId':'draft1'},'progress':[{'scope':'scheme:one','tutorial':'hardware-v3','stepIds':STEP_IDS,'view':{'step':2,'progress':.4},'seen':[STEP_IDS[0]],'built':[STEP_IDS[1]]}]}
                bundle=call(0,'backup/export',browser)
                preview=call(1,'backup/preview',bundle)
                result=call(1,'backup/import',{'bundle':bundle,'mode':'keep','revision':preview['revision']})
                rows=servers[1].store.schemes();self.assertEqual(len(rows),1)
                self.assertEqual(rows[0]['design']['colors'],design['colors'])
                self.assertEqual(result['idMap']['one'],rows[0]['id'])
                with self.assertRaises(HTTPError) as caught:call(1,'backup/preview',{'version':99})
                self.assertEqual(caught.exception.code,422)
                self.assertEqual(len(servers[1].store.schemes()),1)
            finally:
                for server in servers:server.shutdown();server.server_close();server.store.close()

class OptimisticSaveTests(unittest.TestCase):
    def test_stale_named_save_cannot_overwrite_imported_or_newer_scheme(self):
        with tempfile.TemporaryDirectory() as folder:
            s=PersonalStore(Path(folder)/'a.db')
            body={'name':'Duck','design':{'colors':{'p':'#111111'},'assignments':{'p':None}}}
            try:
                original=s.save_scheme('x',body)
                newer=dict(body,design={'colors':{'p':'#222222'},'assignments':{'p':None}})
                s.save_scheme('x',newer)
                with self.assertRaises(ValueError):s.save_scheme('x',dict(body,expectedRevision=original['revision']))
                self.assertEqual(s.schemes()[0]['design']['colors']['p'],'#222222')
                current=s.schemes()[0]
                s.delete_scheme('x',current['revision'])
                recreated=s.save_scheme('x',dict(newer,expectedRevision=None))
                self.assertEqual(recreated['design'],current['design'])
            finally:s.close()
