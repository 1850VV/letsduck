"""A bounded export executor must retain admission slots through cancellation and failure."""
import asyncio
import importlib.util
import sys
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))


def fixture_export(payload):
    time.sleep(0.15)
    if payload.get('fail'):
        raise ValueError('invalid fixture')
    return b'fixture-3mf', {'ok': True}


class ExportQueueTest(unittest.IsolatedAsyncioTestCase):
    def manager(self, **kwargs):
        self.assertIsNotNone(importlib.util.find_spec('export_jobs'), 'bounded export executor is missing')
        from export_jobs import ExportManager
        return ExportManager(worker=fixture_export, **kwargs)

    async def test_active_plus_waiting_jobs_have_a_hard_bound(self):
        manager = self.manager(workers=1, queue_size=1)
        from export_jobs import ExportBusy
        try:
            results = await asyncio.gather(*(manager.run({}) for _ in range(6)), return_exceptions=True)
            self.assertEqual(sum(isinstance(x, ExportBusy) for x in results), 4)
            self.assertEqual(sum(isinstance(x, tuple) for x in results), 2)
        finally:
            await manager.close()

    async def test_cancelled_http_request_does_not_release_running_job_slot(self):
        manager = self.manager(workers=1, queue_size=0)
        from export_jobs import ExportBusy
        try:
            task = asyncio.create_task(manager.run({}))
            await asyncio.sleep(0.01)
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await task
            with self.assertRaises(ExportBusy):
                await manager.run({})
            await manager.wait_idle()
            self.assertEqual((await manager.run({}))[0], b'fixture-3mf')
        finally:
            await manager.close()

    async def test_failed_export_releases_capacity_and_shutdown_drains_accepted_jobs(self):
        manager = self.manager(workers=1, queue_size=0)
        with self.assertRaises(ValueError):
            await manager.run({'fail': True})
        self.assertEqual((await manager.run({}))[0], b'fixture-3mf')
        await manager.close()
        from export_jobs import ExportBusy
        with self.assertRaises(ExportBusy):
            await manager.run({})


if __name__ == '__main__':
    unittest.main()
