"""Actual personal API/storage; synthetic numbering, disconnected hardware, separate DB."""
import argparse
import json
import signal
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'personal'))
import app
from servo_setup import Offline


class NoDevice:
    def connect(self):
        raise Offline('PDF browser fixture has no physical device')

    def request(self, *_):
        raise AssertionError('PDF browser checks must not operate hardware')

    def close(self):
        pass


class FixtureHandler(app.Handler):
    def api(self, method, path):
        if path == '/api/duck-debug/numbering' and method == 'GET':
            return self.server.numbering
        if path == '/api/fixture/numbering' and method == 'POST':
            missing = self.read_json().get('missingIds', [])
            value = self.server.numbering
            value.update(ready=not missing, missingIds=missing, reviewIds=missing,
                         verifiedIds=[i for i in value['expectedIds'] if i not in missing])
            return value
        if path == '/api/fixture/receipt':
            return {'mutations': self.server.mutations}
        if method != 'GET':
            self.server.mutations.append({'method': method, 'path': path})
        if path.startswith('/api/servo-setup'):
            raise AssertionError('Assembly must not invoke hardware setup')
        return super().api(method, path)

    def do_GET(self):
        if urlparse(self.path).path == '/debug/':
            return self.send_body(200, b'<!doctype html><title>Debug fixture</title><p>Test-only Debug Duck destination. No hardware.</p>', 'text/html')
        return super().do_GET()


parser = argparse.ArgumentParser()
parser.add_argument('--db', required=True)
args = parser.parse_args()
server = app.create_server('127.0.0.1', 0, db=args.db, servo_runtime=NoDevice())
server.RequestHandlerClass = type('PDFHandler', (FixtureHandler,), {'store': server.store})
ids = [10, 11, 12, 13, 14, 20, 21, 22, 23, 24, 30, 31, 32, 33, 34]
records = [dict(id=i, state='verified', mapVersion='tutorial-reference-1', sourceId=i,
                profile=dict(kp=5, kd=20), readback=dict(ok=True, target_id=i, kp=5, kd=20),
                verifiedAt=1) for i in ids]
server.numbering = dict(board='pdf-test-only', ready=True, expectedIds=ids,
                        verifiedIds=ids, missingIds=[], reviewIds=[], records=records)
server.mutations = []
server.store.save_servo_preparation([dict(id=14, state='picked'), dict(id=24, state='installed')])


def stop(*_):
    raise SystemExit(0)


signal.signal(signal.SIGTERM, stop)
print(json.dumps({'url': 'http://127.0.0.1:%d' % server.server_address[1]}), flush=True)
try:
    server.serve_forever()
finally:
    server.server_close()
    server.store.close()
