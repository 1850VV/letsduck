import importlib.util, io, sys, unittest, zipfile, struct
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
try: from zip_reuse import repack_zip
except ImportError: repack_zip=None

class ZipReuseTest(unittest.TestCase):
    def test_replacements_keep_original_compressed_records_and_crc(self):
        self.assertTrue(callable(repack_zip),'ZIP raw-entry reuse is implemented')
        class Streaming(io.BytesIO):
            def seekable(self): return False
            def seek(self,*args): raise io.UnsupportedOperation()
        for buffer in (io.BytesIO(),Streaming()):
            with zipfile.ZipFile(buffer,'w') as z:
                z.comment=b'archive comment'
                z.writestr('mesh.xml',b'model geometry '*10000,compress_type=zipfile.ZIP_DEFLATED)
                z.writestr('config.json',b'old')
                z.writestr('中文.txt',b'untouched',compress_type=zipfile.ZIP_STORED)
            source=buffer.getvalue();result=repack_zip(source,{'config.json':b'new','new.txt':b'added'})
            with zipfile.ZipFile(io.BytesIO(source)) as old,zipfile.ZipFile(io.BytesIO(result)) as new:
                self.assertIsNone(new.testzip());self.assertEqual(new.comment,b'archive comment')
                self.assertEqual(new.read('config.json'),b'new');self.assertEqual(new.read('new.txt'),b'added')
                for name in ['mesh.xml','中文.txt']:
                    self.assertEqual(old.read(name),new.read(name));a=old.getinfo(name);b=new.getinfo(name)
                    self.assertEqual(a.CRC,b.CRC)
                    def compressed(data,info):
                        offset=info.header_offset;size=30+sum(struct.unpack_from('<HH',data,offset+26))
                        return data[offset:offset+size+info.compress_size]
                    self.assertEqual(compressed(source,a),compressed(result,b))
