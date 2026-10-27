import type { FastifyReply } from 'fastify';
/** Socket close does not imply an accepted asynchronous handler has finished. */
export function requestTracker() {
  const requests = new Set<Promise<unknown>>();
  return {
    get size() { return requests.size; },
    async waitRequests() { while (requests.size) await Promise.allSettled([...requests]); },
    run(reply: FastifyReply, operation: () => Promise<FastifyReply>): Promise<FastifyReply> {
      const delivered = new Promise<void>(resolve => {
        const response = reply.raw;
        const done = () => { response.off('finish', done); response.off('close', done); resolve(); };
        if (response.writableFinished || response.destroyed) done();
        else { response.once('finish', done); response.once('close', done); }
      });
      const task = operation(), settled = Promise.allSettled([task, delivered]);
      requests.add(settled); void settled.then(() => requests.delete(settled));
      return task;
    },
  };
}
