"""Personal deployments persist without login and never expose account-owned data."""
import os
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
import server
from store import Store


class PersonalTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / 'personal.db'
        self.url = 'sqlite:///' + str(self.path)

    def tearDown(self):
        self.tmp.cleanup()

    def app(self):
        # Use the same factory as the real entry point, with the deployment setting.
        with patch.dict(os.environ, {'DUCK_EDITION': 'personal'}):
            return server.create_app(database_url=self.url, static=str(server.ROOT.parent / 'frontend'))

    def design(self, client):
        parts = client.app.state.store.part_ids or ['P1-01']
        return {'colors': {p: '#FFFFFF' for p in parts}, 'assignments': {p: None for p in parts}}

    def test_scheme_survives_new_application_and_browser_without_login(self):
        with TestClient(self.app()) as client:
            response = client.put('/api/schemes/personal-1', json={
                'name': '我的个人方案', 'design': self.design(client), 'voiceSalt': 7})
            self.assertEqual(response.status_code, 200)
            created = response.json()
        # A new app / client has no token, cookie or browser storage.
        with TestClient(self.app()) as client:
            self.assertEqual(client.get('/api/schemes').json(), [created])
            renamed = client.put('/api/schemes/personal-1', json={
                **created, 'name': '已改名'}).json()
            self.assertEqual(renamed['created'], created['created'])
            self.assertEqual(renamed['voiceSalt'], 7)
            self.assertEqual(renamed['name'], '已改名')
            self.assertEqual(client.delete('/api/schemes/personal-1').json(), {'ok': True})
            self.assertEqual(client.get('/api/schemes').json(), [])
        with sqlite3.connect(self.path) as conn:
            self.assertEqual(conn.execute('PRAGMA integrity_check').fetchone()[0], 'ok')

    def test_personal_routes_ignore_old_tokens_and_leave_account_data_private(self):
        with TestClient(self.app()) as client:
            store = client.app.state.store
            old = store.register('原有账号', 'old-password')
            private = store.save_scheme(old['user']['id'], 'account-1', {
                'name': '账号私有方案', 'design': self.design(client)})
            headers = {'Authorization': 'Bearer ' + old['token']}
            self.assertEqual(client.get('/api/schemes', headers=headers).json(), [])
            denied = client.put('/api/schemes/account-1', headers=headers,
                json={'name': '覆盖', 'design': self.design(client)})
            self.assertEqual(denied.status_code, 422)
            for method, path in [('POST', '/api/auth/register'), ('POST', '/api/auth/login'),
                    ('POST', '/api/auth/logout'), ('GET', '/api/me'), ('PATCH', '/api/me'),
                    ('GET', '/api/works'), ('POST', '/api/works'), ('GET', '/api/works/old-id'),
                    ('DELETE', '/api/works/old-id'), ('PUT', '/api/works/old-id/rating')]:
                with self.subTest(path=path, method=method):
                    self.assertEqual(client.request(method, path, json={}, headers=headers).status_code, 404)
            self.assertEqual(store.schemes(old['user']['id']), [private])
            self.assertEqual(store.login('原有账号', 'old-password')['user'], old['user'])

    def test_site_and_direct_gallery_access_use_the_same_edition(self):
        with TestClient(self.app()) as client:
            site = client.get('/api/site').json()
            self.assertEqual(site.get('edition'), 'personal')
            self.assertEqual(site['publicUrl'], '')
            self.assertEqual(client.get('/api/gallery-access').status_code, 403)
            for path in ['/gallery', '/gallery/', '/gallery/index.html']:
                response = client.get(path, follow_redirects=False)
                self.assertEqual(response.status_code, 303)
                self.assertEqual(response.headers['location'], '/')
            self.assertEqual(client.get('/api/health').status_code, 200)

    def test_default_is_personal_and_unknown_edition_refuses_startup(self):
        with patch.dict(os.environ, {}, clear=True):
            with TestClient(server.create_app(database_url=self.url)) as client:
                self.assertEqual(client.get('/api/site').json().get('edition'), 'personal')
        with patch.dict(os.environ, {'DUCK_EDITION': 'typo'}):
            with self.assertRaisesRegex(ValueError, 'DUCK_EDITION'):
                with TestClient(server.create_app(database_url=self.url)):
                    pass


if __name__ == '__main__':
    unittest.main()
