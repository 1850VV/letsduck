import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const usage = 'Usage: node apps/server/dist/main.js [--host HOST] [--port PORT] [--static DIR] [--open]\n';
class UsageError extends Error {}

/** The browser is optional; readiness must come from the actual HTTP health endpoint. */
export async function waitAndOpen(
  url: string,
  open: (url: string) => Promise<void>,
  options: { timeoutMs?: number; pollMs?: number; requestTimeoutMs?: number; signal?: AbortSignal } = {},
): Promise<boolean> {
  const deadline = performance.now() + (options.timeoutMs ?? 15_000);
  const health = new URL('api/health', `${url.replace(/\/$/, '')}/`);
  while (performance.now() < deadline && !options.signal?.aborted) {
    let ready = false;
    try {
      const timeout = AbortSignal.timeout(Math.max(1, Math.floor(Math.min(options.requestTimeoutMs ?? 1_000, deadline - performance.now()))));
      const signal = options.signal ? AbortSignal.any([timeout, options.signal]) : timeout;
      const response = await fetch(health, { signal });
      ready = response.status === 200;
      await response.body?.cancel().catch(() => undefined);
    } catch { /* A server that has not bound yet is normal during startup. */ }
    if (ready && !options.signal?.aborted) { await open(url); return true; }
    try {
      await delay(Math.min(options.pollMs ?? 50, Math.max(0, deadline - performance.now())), undefined,
        options.signal ? { signal: options.signal } : {});
    } catch { return false; }
  }
  return false;
}

async function openBrowser(url: string): Promise<void> {
  const [command, args] = process.platform === 'darwin' ? ['open', [url]] as const
    : process.platform === 'win32' ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]] as const
      : ['xdg-open', [url]] as const;
  await new Promise<void>((accept, reject) => {
    execFile(command, [...args], { timeout: 5_000 }, error => error ? reject(error) : accept());
  });
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  let args: ReturnType<typeof parseArgs<{ options: {
    host: { type: 'string' }; port: { type: 'string' }; static: { type: 'string' };
    open: { type: 'boolean' }; help: { type: 'boolean' };
  } }>>;
  try {
    args = parseArgs({ options: {
      host: { type: 'string' }, port: { type: 'string' }, static: { type: 'string' },
      open: { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
    }, args: argv, allowPositionals: false });
  } catch (error) { throw new UsageError(error instanceof Error ? error.message : String(error)); }
  if (args.values.help) { process.stdout.write(usage); return; }
  const portText = args.values.port ?? process.env.PORT ?? '8876';
  const { parseListenPort, startServer } = await import('@letsduck/host');
  let port: number;
  try { port = parseListenPort(portText); }
  catch (error) { throw new UsageError(error instanceof Error ? error.message : String(error)); }
  const server = await startServer({
    assets: resolve(process.env.DUCK_ASSETS ?? `${root}/assets`),
    host: args.values.host ?? process.env.HOST ?? '127.0.0.1', port,
    ...(args.values.static === undefined ? {} : { frontend: resolve(args.values.static) }),
  });
  const abort = new AbortController();
  let closing: Promise<void> | undefined;
  const stop = () => {
    if (closing) return;
    abort.abort();
    closing = server.close().catch(error => {
      console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1;
    }).finally(() => { process.off('SIGINT', stop); process.off('SIGTERM', stop); });
  };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  console.log(`letsduck server ready: ${server.url}`);
  if (args.values.open) {
    try { await waitAndOpen(server.url, openBrowser, { signal: abort.signal }); }
    catch (error) { console.error(`Could not open browser: ${error instanceof Error ? error.message : String(error)}`); }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = error instanceof UsageError ? 2 : 1;
  });
}
