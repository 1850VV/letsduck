"""HTTP compatibility: exercise actual routes and storage, with disposable accounts."""
import sys
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
import server


class ApiTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        factory = getattr(server, 'create_app', None)
        self.assertTrue(callable(factory), 'API must run through a FastAPI application factory')
        self.app = factory(database_url=self.database_url())
        self.client = TestClient(self.app)
        self.client.__enter__()
        self.a = self.client.post('/api/auth/register', json={'name': 'Alpha', 'password': 'pass-a'}).json()
        self.b = self.client.post('/api/auth/register', json={'name': 'Beta', 'password': 'pass-b'}).json()
        self.auth = {'Authorization': 'Bearer ' + self.a['token']}
        self.other = {'Authorization': 'Bearer ' + self.b['token']}
        parts = self.app.state.store.part_ids or ['P1-01']
        self.design = {'colors': {p: '#FFFFFF' for p in parts}, 'assignments': {p: 'pla-white' for p in parts}}

    def database_url(self):
        return 'sqlite:///' + self.tmp.name + '/api.db'

    def tearDown(self):
        if hasattr(self, 'client'):
            self.client.__exit__(None, None, None)
        self.tmp.cleanup()

    def test_existing_account_scheme_work_rating_and_logout_contract(self):
        self.assertEqual(self.client.get('/api/me', headers=self.auth).json(), self.a['user'])
        saved = self.client.put('/api/schemes/s-1', headers=self.auth, json={'name': '白鸭', 'design': self.design})
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(saved.json()['id'], 's-1')
        self.assertEqual(self.client.get('/api/schemes', headers=self.other).json(), [])
        work = self.client.post('/api/works', headers=self.auth, json={'title': '白鸭', 'design': self.design, 'schemeId': 's-1'}).json()
        wid = work['id']
        self.assertEqual(self.client.get('/api/works/' + wid).json()['schemeId'], None)
        self.assertEqual(self.client.get('/api/works/' + wid, headers=self.auth).json()['schemeId'], 's-1')
        rating = self.client.put('/api/works/' + wid + '/rating', headers=self.other, json={'stars': 4})
        self.assertEqual(rating.status_code, 200)
        self.assertEqual(rating.json()['rating'], {'count': 1, 'average': 4.0, 'mine': 4})
        self.assertEqual(self.client.get('/api/works', headers=self.other).json()[0]['rating']['mine'], 4)
        self.assertEqual(self.client.delete('/api/works/' + wid, headers=self.other).status_code, 422)
        self.assertEqual(self.client.delete('/api/works/' + wid, headers=self.auth).json(), {'ok': True})
        self.assertEqual(self.client.delete('/api/schemes/s-1', headers=self.auth).json(), {'ok': True})
        self.assertEqual(self.client.post('/api/auth/logout', headers=self.auth, json={}).json(), {'ok': True})
        self.assertEqual(self.client.get('/api/me', headers=self.auth).status_code, 401)

    def test_error_statuses_body_limits_and_headers_stay_compatible(self):
        self.assertEqual(self.client.get('/api/me').json(), {'error':'请先登录','code':'auth.required','params':{}})
        cases = [(b'{}', 'text/plain', 415), (b'{bad', 'application/json', 400),
                 (b'[]', 'application/json', 400), (b' ' * 8_000_001, 'application/json', 413)]
        for body, kind, status in cases:
            r = self.client.post('/api/auth/login', content=body, headers={'Content-Type': kind})
            self.assertEqual(r.status_code, status)
            self.assertEqual(set(r.json()), {'error','code','params'})
            self.assertEqual(r.headers['cache-control'], 'no-store')
            self.assertEqual(r.headers['x-content-type-options'], 'nosniff')
        self.assertEqual(self.client.get('/api/missing').status_code, 404)
        self.assertEqual(self.client.get('/api/works/not.valid').status_code, 404)

    def test_optional_pagination_preserves_array_and_author_filter(self):
        for i in range(4):
            self.client.post('/api/works', headers=self.auth, json={'title': str(i), 'design': self.design})
        first = self.client.get('/api/works?limit=2&offset=0').json()
        second = self.client.get('/api/works?limit=2&offset=2').json()
        self.assertEqual(len(first), 2)
        self.assertEqual(len(second), 2)
        self.assertEqual(len({w['id'] for w in first + second}), 4)
        self.assertEqual(self.client.get('/api/works?author=' + self.b['user']['id']).json(), [])
        for query in ['limit=0', 'limit=201', 'offset=-1', 'limit=oops']:
            r = self.client.get('/api/works?' + query)
            self.assertEqual(r.status_code, 422)
            self.assertEqual(set(r.json()), {'error','code','params'})

    def test_body_limit_also_applies_without_content_length(self):
        with self.client.stream('POST', '/api/auth/login', content=iter([b' ' * 4_100_000] * 2),
                                headers={'Content-Type': 'application/json'}) as response:
            self.assertEqual(response.status_code, 413)


if __name__ == '__main__':
    unittest.main()
