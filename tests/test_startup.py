"""The local launcher's browser opens only after API readiness."""
import sys
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
import server


class StartupTest(unittest.TestCase):
    def test_browser_waits_for_successful_health_response(self):
        ready, observed = threading.Event(), threading.Event()
        class Health(BaseHTTPRequestHandler):
            def do_GET(self):
                observed.set()
                self.send_response(200 if ready.is_set() else 503)
                self.end_headers()
            def log_message(self, *args):
                pass
        http = ThreadingHTTPServer(('127.0.0.1', 0), Health)
        serving = threading.Thread(target=http.serve_forever, daemon=True)
        serving.start()
        try:
            opener = getattr(server, 'open_when_ready', None)
            self.assertTrue(callable(opener), 'local browser launch must wait for API readiness')
            url = 'http://127.0.0.1:' + str(http.server_port) + '/'
            with patch.object(server.webbrowser, 'open') as opened:
                thread = threading.Thread(target=opener, args=(url,), daemon=True)
                thread.start()
                self.assertTrue(observed.wait(3))
                opened.assert_not_called()
                ready.set()
                thread.join(3)
                self.assertFalse(thread.is_alive())
                opened.assert_called_once_with(url)
        finally:
            http.shutdown()
            http.server_close()
            serving.join(3)


if __name__ == '__main__':
    unittest.main()
