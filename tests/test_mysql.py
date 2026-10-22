"""Run the same behavior tests against real MySQL; only disposable test databases allowed."""
import os
import tempfile
import unittest
from sqlalchemy.engine import make_url
import test_api
import test_migration
import test_store
import test_store_scaling
from database import metadata, open_database
from store import Store

URL = os.environ.get('DUCK_TEST_DATABASE_URL')


def clean_mysql():
    url = make_url(URL)
    if url.get_backend_name() != 'mysql' or not url.database.startswith('duck_test_'):
        raise ValueError('Tests require a disposable MySQL database named duck_test_*')
    engine = open_database(URL)
    metadata.drop_all(engine)
    engine.dispose()


@unittest.skipUnless(URL, 'DUCK_TEST_DATABASE_URL not configured')
class MySQLStoreTest(test_store.StoreTest):
    def setUp(self):
        clean_mysql()
        self.tmp = tempfile.TemporaryDirectory()
        self.store = Store(database_url=URL, part_ids=test_store.PARTS)
        self.a = self.store.register('小鸭A','pass-a')
        self.b = self.store.register('小鸭B','pass-b')

    def test_two_accounts_cannot_claim_the_same_new_scheme(self):
        from concurrent.futures import ThreadPoolExecutor
        import threading
        from sqlalchemy import event
        from store import Invalid
        barrier = threading.Barrier(2)
        def overlap(conn, cursor, statement, parameters, context, executemany):
            if statement.startswith('SELECT') and 'schemes.id =' in statement and not conn.info.get('overlapped'):
                conn.info['overlapped'] = True
                barrier.wait(timeout=5)
        event.listen(self.store.engine, 'after_cursor_execute', overlap)
        def save(uid):
            try:
                self.store.save_scheme(uid, 'same-new-id', {'name': 'Private', 'design': test_store.DESIGN})
                return uid
            except Invalid:
                return None
        try:
            with ThreadPoolExecutor(max_workers=2) as pool:
                winners = [x for x in pool.map(save, [self.a['user']['id'], self.b['user']['id']]) if x]
        finally:
            event.remove(self.store.engine, 'after_cursor_execute', overlap)
        self.assertEqual(len(winners), 1)
        self.assertEqual(self.store.schemes(winners[0])[0]['id'], 'same-new-id')


@unittest.skipUnless(URL, 'DUCK_TEST_DATABASE_URL not configured')
class MySQLApiTest(test_api.ApiTest):
    def database_url(self):
        clean_mysql()
        return URL

    def test_empty_mysql_cannot_hide_unmigrated_local_accounts(self):
        from pathlib import Path
        from unittest.mock import patch
        from fastapi.testclient import TestClient
        import server
        self.client.__exit__(None, None, None)
        del self.client
        clean_mysql()
        source = Path(self.tmp.name) / 'unmigrated.db'
        test_migration.legacy_database(source)
        with patch.dict(os.environ, {'DUCK_DB': str(source)}):
            with self.assertRaisesRegex(RuntimeError, 'migrate_database'):
                with TestClient(server.create_app(database_url=URL, edition='server')):
                    pass


@unittest.skipUnless(URL, 'DUCK_TEST_DATABASE_URL not configured')
class MySQLScalingTest(test_store_scaling.ScalingTest):
    def setUp(self):
        clean_mysql()
        self.tmp = tempfile.TemporaryDirectory()
        self.store = Store(database_url=URL, part_ids=['P1-01'])
        self.a = self.store.register('Alice','pass')['user']['id']
        self.b = self.store.register('Bob','pass')['user']['id']


@unittest.skipUnless(URL, 'DUCK_TEST_DATABASE_URL not configured')
class MySQLMigrationTest(test_migration.MigrationTest):
    def setUp(self):
        super().setUp()
        clean_mysql()
        self.target = URL
