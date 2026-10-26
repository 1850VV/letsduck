"""Browser fixture: actual API/storage with an intentionally disconnected device."""
import argparse
import json
import signal
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'personal'))
import app
from servo_setup import Offline


class DisconnectedRuntime:
    def connect(self):
        raise Offline('Fixture device is disconnected')

    def request(self, *args):
        raise AssertionError('Browser inventory checks must not issue device operations')

    def close(self):
        pass


parser = argparse.ArgumentParser()
parser.add_argument('--db', required=True)
args = parser.parse_args()
server = app.create_server('127.0.0.1', 0, db=args.db, servo_runtime=DisconnectedRuntime())
for sid, state in [(10, 'reported'), (11, 'verified')]:
    server.store.save_servo_record('fixture-board', dict(id=sid, state=state, sourceId=sid,
        actorId='t_motor'+str(sid), mapVersion='tutorial-reference-1', oldIdAbsent=True,
        profile=dict(kp=5, kd=20), readback=dict(id=sid, kp=5, kd=20, raw_pos=2047, center_pos=2047)))
server.store.save_servo_preparation([dict(id=14, state='picked'), dict(id=24, state='installed')])


def stop(*_):
    raise SystemExit(0)


signal.signal(signal.SIGTERM, stop)
print(json.dumps(dict(url='http://127.0.0.1:%d' % server.server_address[1])), flush=True)
try:
    server.serve_forever()
finally:
    server.server_close()
    server.store.close()
