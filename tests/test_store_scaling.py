"""Bound gallery database work and enforce permissions during concurrent writes."""
import concurrent.futures
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from store import Store, Invalid

DESIGN = {'colors': {'P1-01': '#FFFFFF'}, 'assignments': {'P1-01': 'pla-white'}}


class ScalingTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.tmp.name) / 'store.db', part_ids=['P1-01'])
        self.a = self.store.register('Alice', 'pass')['user']['id']
        self.b = self.store.register('Bob', 'pass')['user']['id']

    def tearDown(self):
        close = getattr(self.store, 'close', None)
        close() if close else self.store.db.close()
        self.tmp.cleanup()

    def test_gallery_uses_bounded_queries_and_preserves_stats(self):
        root = self.store.publish(self.a, {'title': 'Root', 'design': DESIGN, 'schemeId': 'private'})
        self.store.rate(self.b, root['id'], 4)
        for i in range(20):
            self.store.publish(self.b, {'title': 'Fork ' + str(i), 'design': DESIGN, 'parentId': root['id']})
        statements = []
        if hasattr(self.store, 'engine'):
            from sqlalchemy import event
            def capture(conn, cursor, statement, params, context, executemany):
                if statement.lstrip().upper().startswith('SELECT'):
                    statements.append(statement)
            event.listen(self.store.engine, 'before_cursor_execute', capture)
        else:
            self.store.db.set_trace_callback(lambda s: statements.append(s) if s.lstrip().upper().startswith('SELECT') else None)
        rows = self.store.works(self.b)
        self.assertLessEqual(len(statements), 4, 'gallery queries must not grow with the number of works')
        result = next(w for w in rows if w['id'] == root['id'])
        self.assertEqual(result['rating'], {'count': 1, 'average': 4.0, 'mine': 4})
        self.assertEqual(result['forks'], 20)
        self.assertIsNone(result['schemeId'])

    def test_concurrent_scheme_saves_cannot_exceed_account_quota(self):
        for i in range(29):
            self.store.save_scheme(self.a, 'old-' + str(i), {'name': 'Old', 'design': DESIGN})
        def save(i):
            try:
                self.store.save_scheme(self.a, 'new-' + str(i), {'name': 'New', 'design': DESIGN})
                return True
            except Invalid:
                return False
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            result = list(pool.map(save, range(8)))
        self.assertEqual(sum(result), 1)
        self.assertEqual(len(self.store.schemes(self.a)), 30)


if __name__ == '__main__':
    unittest.main()
