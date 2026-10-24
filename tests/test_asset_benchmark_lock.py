"""A contended benchmark lock must prevent browser startup, not just emit an error."""
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from run_asset_benchmark import run


class BenchmarkLockTest(unittest.TestCase):
    def test_busy_lock_does_not_start_child_or_remove_other_owner(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            lock = root / 'lock';lock.mkdir()
            (lock / 'owner').write_text('other task')
            marker = root / 'started'
            self.assertEqual(run([sys.executable, '-c', 'from pathlib import Path;Path(%r).touch()' % str(marker)], lock), 75)
            self.assertFalse(marker.exists())
            self.assertEqual((lock / 'owner').read_text(), 'other task')

    def test_owned_lock_is_released_after_failed_child(self):
        with tempfile.TemporaryDirectory() as folder:
            lock = Path(folder) / 'lock'
            self.assertEqual(run([sys.executable, '-c', 'raise SystemExit(3)'], lock), 3)
            self.assertFalse(lock.exists())
