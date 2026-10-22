import sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from store import Store, Invalid

class LocalizedErrors(unittest.TestCase):
    def test_machine_codes_do_not_depend_on_display_language(self):
        with tempfile.TemporaryDirectory() as tmp:
            store=Store(Path(tmp)/'db.sqlite',part_ids=['P1'])
            for action,code in [(lambda:store.login('unknown','wrong'),'auth.invalid_credentials'),(lambda:store.register('abc','x'),'auth.password_short')]:
                with self.assertRaises(Invalid) as caught:action()
                self.assertEqual(getattr(caught.exception,'code',None),code)
            store.db.close()
