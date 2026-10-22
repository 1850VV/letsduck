"""Accounts, schemes, works and ratings. Synthetic data; no asset pack needed."""
import sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from store import Store, Invalid

PARTS = ['P1-01', 'P1-02', 'P2-01']
DESIGN = {'colors': {p: '#FFFFFF' for p in PARTS}, 'assignments': {p: 'pla-white' for p in PARTS}}


class StoreTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.tmp.name) / 'test.db', part_ids=PARTS)
        self.a = self.store.register('小鸭A', 'pass-a')
        self.b = self.store.register('小鸭B', 'pass-b')

    def tearDown(self):
        self.store.close()
        self.tmp.cleanup()

    def test_accounts(self):
        with self.assertRaises(Invalid):
            self.store.register('小鸭a', 'other')  # nicknames are unique, ignoring case
        with self.assertRaises(Invalid):
            self.store.login('小鸭A', 'wrong')
        token = self.store.login('小鸭a', 'pass-a')['token']
        self.assertEqual(self.store.user_for(token)['name'], '小鸭A')
        self.store.logout(token)
        self.assertIsNone(self.store.user_for(token))
        from database import users
        from sqlalchemy import select
        with self.store.engine.connect() as conn:
            row = conn.execute(select(users.c.pw_hash).where(users.c.name == '小鸭A')).one()
        self.assertNotIn('pass-a', row[0])

    def test_schemes_are_private(self):
        uid = self.a['user']['id']
        self.store.save_scheme(uid, 's-1', {'name': '方案一', 'design': DESIGN})
        self.assertEqual([s['name'] for s in self.store.schemes(uid)], ['方案一'])
        self.assertEqual(self.store.schemes(self.b['user']['id']), [])
        with self.assertRaises(Invalid):
            self.store.save_scheme(self.b['user']['id'], 's-1', {'name': '抢', 'design': DESIGN})
        with self.assertRaises(Invalid):
            self.store.save_scheme(uid, 's-2', {'name': '坏', 'design': {'colors': {}, 'assignments': {}}})

    def test_large_legacy_provenance_and_unicode_survive_storage(self):
        provenance = {'note': '🦆' * 25000}
        uid = self.a['user']['id']
        saved = self.store.save_scheme(uid, 's-large', {'name': '大方案', 'design': DESIGN, 'provenance': provenance})
        self.assertEqual(saved['provenance'], provenance)
        published = self.store.publish(uid, {'title': '大作品', 'design': DESIGN, 'provenance': provenance})
        self.assertEqual(published['provenance'], provenance)

    def test_invalid_password_update_cannot_partially_change_profile(self):
        uid = self.a['user']['id']
        with self.assertRaises(Invalid):
            self.store.update_user(uid, {'name': 'Changed', 'password': 'x'})
        self.assertEqual(self.store.user_for(self.a['token'])['name'], '小鸭A')

    def test_publish_rate_fork_delete(self):
        ua, ub = self.a['user']['id'], self.b['user']['id']
        work = self.store.publish(ua, {'title': '蓝白', 'design': DESIGN})
        with self.assertRaises(Invalid):
            self.store.rate(ua, work['id'], 5)  # not your own
        self.assertEqual(self.store.rate(ub, work['id'], 4)['rating'], {'count': 1, 'average': 4.0, 'mine': 4})
        fork = self.store.publish(ub, {'title': '改编', 'design': DESIGN, 'parentId': work['id']})
        self.assertEqual(fork['parentId'], work['id'])
        self.assertEqual(self.store.work(work['id'])['forks'], 1)
        with self.assertRaises(Invalid):
            self.store.delete_work(ub, work['id'])
        self.store.delete_work(ua, work['id'])
        self.assertIsNone(self.store.work(fork['id'])['parentId'])
        unmatched = {'colors': DESIGN['colors'], 'assignments': {**DESIGN['assignments'], 'P1-01': None}}
        with self.assertRaises(Invalid):
            self.store.publish(ua, {'title': '没配完', 'design': unmatched})


if __name__ == '__main__':
    unittest.main()
