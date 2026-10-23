"""Parser boundary checks with synthetic bytes, no licensed assets or server packages."""
import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from export_transport import parse_multipart, ExportBodyError
from export_fixtures import multipart

class MultipartTest(unittest.TestCase):
    def test_binary_parts_retain_bytes_without_base64_overhead(self):
        names=['cover']+[f'{kind}{i}' for kind in ('plate','top') for i in range(1,7)]
        body={'name':'测试','assignments':{},'thumbnails':{n:'data:image/png;base64,AA0K//4=' for n in names}}
        result=parse_multipart(multipart(body),'multipart/form-data; boundary="duck-test"')
        self.assertEqual(result['name'],'测试')
        self.assertEqual(set(result['thumbnails']),set(names))
        self.assertTrue(all(x==b'\0\r\n\xff\xfe' for x in result['thumbnails'].values()))
        data=multipart(body)
        for broken in [data.replace(b'name="cover"',b'name="plate1"'),data.replace(b'image/png',b'text/plain'),data[:-20]]:
            with self.assertRaises(ExportBodyError):parse_multipart(broken,'multipart/form-data; boundary=duck-test')
        with self.assertRaises(ExportBodyError):parse_multipart(data,'multipart/form-data; boundary=duck-test\r\nInjected: yes')
