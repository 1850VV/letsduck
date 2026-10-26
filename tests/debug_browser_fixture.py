"""Optional local UI fixture. Uses only a fake runtime and a temporary database."""
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / 'personal'), str(ROOT / 'tests')]
from test_duck_debug import Firmware
from servo_setup import IDS, MAP_VERSION
import app


class BrowserFirmware(Firmware):
    def request(self, method, path, body=None):
        if getattr(self, 'offline', False):
            raise ValueError('隔离测试控制器已断开')
        if body and body.get('action') == 'ping':
            time.sleep(.008)
        return super().request(method, path, body)


def main():
    runtime = BrowserFirmware()
    with tempfile.TemporaryDirectory() as tmp:
        server = app.create_server(port=8896, search=1, db=Path(tmp)/'test.db', servo_runtime=runtime)
        def seed():
            for sid in IDS:
                server.store.save_servo_record('test-board', dict(id=sid, sourceId=sid, state='verified',
                    mapVersion=MAP_VERSION, profile=dict(kp=5, kd=sid),
                    readback=dict(ok=True, target_id=sid, kp=5, kd=sid, raw_pos=2200+sid),
                    verifiedAt='fixture', midEvidence='existing'))
        seed()
        handler, original = server.RequestHandlerClass, server.RequestHandlerClass.api
        def api(self, method, path):
            if method == 'POST' and path == '/api/fixture/offline':
                runtime.offline = self.read_json()['offline']
                return dict(ok=True)
            if method == 'POST' and path == '/api/fixture/reset':
                server.debug.scan_stop.set()
                if server.debug.scan_worker:
                    server.debug.scan_worker.join(5)
                runtime.__dict__.update(BrowserFirmware().__dict__)
                runtime.offline = False
                server.debug.readbacks.clear()
                server.debug.pending_readback.clear()
                server.debug.held.clear()
                server.debug.owned = server.debug.calibrating = False
                server.debug.scan = dict(active=False, checked=0, total=254, found=[], stopped=False, error='')
                with server.store.lock:
                    server.store.db.execute('DELETE FROM servo_setup')
                seed()
                return dict(ok=True)
            if method == 'GET' and path == '/api/fixture':
                return dict(calls=runtime.calls, motors=runtime.motors)
            return original(self, method, path)
        handler.api = api
        print('Isolated debug fixture (no hardware): http://127.0.0.1:8896', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()
            server.store.close()


if __name__ == '__main__':
    main()
