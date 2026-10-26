"""Real personal API and SQLite inventory; no hardware operation is needed."""
import json
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'personal'))
import app


class NoDevice:
    def request(self, *args):
        raise AssertionError('Physical inventory must not call a device')

    def close(self):
        pass


class PreparationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = Path(self.tmp.name) / 'personal.db'
        self.server = None
        self.start()

    def tearDown(self):
        self.stop()
        self.tmp.cleanup()

    def start(self):
        self.server = app.create_server('127.0.0.1', 0, db=self.db, servo_runtime=NoDevice())
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.base = 'http://127.0.0.1:%d' % self.server.server_address[1]

    def stop(self):
        if self.server:
            self.server.shutdown()
            self.server.server_close()
            self.server.store.close()
            self.server = None

    def call(self, method='GET', body=None):
        request = Request(self.base + '/api/servo-preparation', method=method,
                          data=json.dumps(body).encode() if body is not None else None,
                          headers={'Content-Type': 'application/json'})
        try:
            with urlopen(request) as response:
                return response.status, json.load(response)
        except HTTPError as error:
            return error.code, json.load(error)

    def test_pick_install_and_return_persist_without_rewriting_history(self):
        record = {'id': 10, 'state': 'reported', 'mapVersion': 'tutorial-reference-1'}
        self.server.store.save_servo_record('existing-board', record)
        parts = self.server.store.part_ids or {'P1-01'}
        scheme = self.server.store.save_scheme('existing', {'name': 'Existing scheme', 'voiceSalt': 7,
            'design': {'colors': {p: '#ffffff' for p in parts}, 'assignments': {p: None for p in parts}}})
        self.assertEqual(self.call(), (200, {'records': []}))
        self.assertEqual(self.call('POST', {'ids': [14], 'state': 'picked'})[0], 200)
        self.assertEqual(self.call('POST', {'ids': [12, 13], 'state': 'installed'})[0], 200)
        self.stop(); self.start()
        records = self.call()[1]['records']
        self.assertEqual([(r['id'], r['state']) for r in records], [(12, 'installed'), (13, 'installed'), (14, 'picked')])
        self.assertEqual(self.server.store.servo_records(), [record])
        self.assertEqual(self.server.store.schemes(), [scheme])
        self.call('POST', {'ids': [14], 'state': 'available'})
        self.assertEqual(next(r for r in self.call()[1]['records'] if r['id'] == 14)['state'], 'available')
        self.assertEqual(self.server.store.db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')

    def test_invalid_updates_do_not_partially_consume_parts(self):
        self.assertEqual(self.call()[0], 200)
        for body in [{'ids': [12, 99], 'state': 'installed'}, {'ids': [14], 'state': 'done'},
                     {'ids': [True], 'state': 'picked'}, {'ids': [], 'state': 'picked'},
                     {'ids': [12, 12], 'state': 'picked'}]:
            with self.subTest(body=body):
                self.assertEqual(self.call('POST', body)[0], 422)
                self.assertEqual(self.call()[1]['records'], [])

    def test_unknown_cables_cannot_be_claimed_as_prepared(self):
        self.assertEqual(self.call()[0], 200)
        self.assertEqual(self.call('POST', {'ids': [32], 'preparedLeads': ['assumed-long']})[0], 422)
        self.assertEqual(self.call()[1]['records'], [])
        self.assertEqual(self.call('POST', {'ids': [32], 'preparedLeads': []})[0], 200)
        self.assertEqual(self.call()[1]['records'][0]['preparedLeads'], [])


if __name__ == '__main__':
    unittest.main()
