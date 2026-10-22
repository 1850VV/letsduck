"""Bounded process exports; HTTP cancellation never releases a running job's slot."""
import asyncio
import multiprocessing
from concurrent.futures import ProcessPoolExecutor

class ExportBusy(Exception):
    pass

def export_payload(payload):
    import exporter
    return exporter.export_3mf(payload)

class ExportManager:
    def __init__(self, workers=1, queue_size=2, worker=export_payload):
        if workers < 1 or queue_size < 0:
            raise ValueError('Export workers must be positive and queue size must be non-negative')
        self.capacity = workers + queue_size
        self.worker = worker
        self.executor = ProcessPoolExecutor(max_workers=workers, mp_context=multiprocessing.get_context('spawn'))
        self.pending = set()
        self.closed = False

    async def run(self, payload):
        if self.closed or len(self.pending) >= self.capacity:
            raise ExportBusy('导出任务较多，请稍后重试')
        future = asyncio.get_running_loop().run_in_executor(self.executor, self.worker, payload)
        self.pending.add(future)
        def completed(result):
            self.pending.discard(result)
            if not result.cancelled():
                result.exception()
        future.add_done_callback(completed)
        return await asyncio.shield(future)

    async def wait_idle(self):
        if self.pending:
            await asyncio.gather(*(asyncio.shield(f) for f in tuple(self.pending)), return_exceptions=True)

    async def close(self):
        self.closed = True
        await self.wait_idle()
        await asyncio.to_thread(self.executor.shutdown, wait=True, cancel_futures=False)
