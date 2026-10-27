"""Temporary migration reference: frozen Python handler, synthetic files and no runtime."""
from pathlib import Path
import json
import sys
import threading

repo = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(repo / 'personal'))
import app

root = Path(sys.argv[1])
app.FRONTEND = root / 'frontend'
app.ASSETS = root / 'assets'
app.ASSEMBLY = {'clip.mp4': {}}
app.ASSEMBLY_REFERENCES = {'horn-reference/main.jpg': {}}
app.exporter = None
snapshot = {'phase': 'idle', 'running': False, 'records': [], 'telemetry': {}}


class Setup:
    def inspect(self):
        return snapshot

    def start(self, target=None):
        return snapshot

    def pause(self):
        return snapshot

    halt = pause
    refresh = pause

    def audit(self, sid):
        return snapshot

    repair = audit
    queue = audit

    def close(self):
        pass


class Debug:
    def numbering(self):
        return {'ready': False, 'verifiedIds': [], 'records': []}

    def status(self):
        return {'connected': False, 'transport': 'usb', 'error': None,
                'devices': [], 'numbering': {'ready': False}}

    def action(self, body):
        return {'ok': True, 'input': body}

    def close(self):
        pass


store = app.PersonalStore(root / 'python.db')
handler = type('SyntheticHandler', (app.Handler,), {'store': store})
server = app.Server(('127.0.0.1', 0), handler)
server.servo = Setup()
server.debug = Debug()
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
print(json.dumps({'port': server.server_address[1]}), flush=True)
try:
    sys.stdin.readline()
finally:
    server.shutdown()
    server.server_close()
    thread.join()
    store.close()
