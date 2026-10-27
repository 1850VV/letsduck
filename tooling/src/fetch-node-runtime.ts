/** Build-time vendor download; portable applications never fetch or install their runtime. */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, lstat, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { unzipSync } from 'fflate';

const version = '24.20.0';
type Platform = 'darwin' | 'win32';
type Architecture = 'arm64' | 'x64';
interface RuntimeOptions { platform: Platform; arch: Architecture; target: string; fetcher?: typeof fetch }

export async function fetchNodeRuntime(options: RuntimeOptions) {
  if (options.platform === 'win32' && options.arch !== 'x64') throw new Error('Only Windows x64 and macOS arm64/x64 are supported.');
  const target = resolve(options.target);
  try { await lstat(target); throw new Error('Runtime destination already exists; choose an empty new destination.'); }
  catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
  const platform = options.platform === 'win32' ? 'win' : 'darwin';
  const prefix = `node-v${version}-${platform}-${options.arch}`;
  const filename = prefix + (options.platform === 'win32' ? '.zip' : '.tar.gz');
  const base = `https://nodejs.org/dist/v${version}/`, source = base + filename;
  const fetcher = options.fetcher ?? fetch;
  const checksums = await fetcher(base + 'SHASUMS256.txt', { signal: AbortSignal.timeout(120_000) });
  if (!checksums.ok) throw new Error(`Official Node checksums returned HTTP ${checksums.status}.`);
  const expected = (await checksums.text()).split(/\r?\n/).map(line => /^([a-f0-9]{64})\s+(.+)$/.exec(line)).find(match => match?.[2] === filename)?.[1];
  if (!expected) throw new Error('Official Node archive checksum is missing.');
  const response = await fetcher(source, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Official Node archive returned HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer()), sha256 = createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== expected) throw new Error('Official Node archive checksum mismatch.');
  await mkdir(dirname(target), { recursive: true });
  const temporary = await mkdtemp(join(dirname(target), '.duck-node-download-'));
  try {
    const contents = join(temporary, 'runtime'); await mkdir(contents);
    const executable = options.platform === 'win32' ? 'node.exe' : 'bin/node';
    if (options.platform === 'win32') {
      const wanted = new Set([prefix + '/node.exe', prefix + '/LICENSE']);
      const files = unzipSync(bytes, { filter: file => wanted.has(file.name) });
      for (const name of ['node.exe', 'LICENSE']) {
        const value = files[prefix + '/' + name]; if (!value) throw new Error('Official Node archive lacks ' + name);
        await writeFile(join(contents, name), value);
      }
    } else {
      const archive = join(temporary, filename); await writeFile(archive, bytes);
      await promisify(execFile)('tar', ['-xzf', archive, '-C', contents, '--strip-components=1', prefix + '/bin/node', prefix + '/LICENSE']);
      await chmod(join(contents, executable), 0o755);
    }
    if (!(await lstat(join(contents, executable))).isFile() || !(await readFile(join(contents, 'LICENSE'))).length) throw new Error('Official Node runtime is incomplete.');
    await rename(contents, target);
    return { version, platform: options.platform, arch: options.arch, directory: target, executable: join(target, executable), sha256, source };
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { platform: { type: 'string' }, arch: { type: 'string' }, output: { type: 'string' } } });
    if ((values.platform !== 'darwin' && values.platform !== 'win32') || (values.arch !== 'arm64' && values.arch !== 'x64') || !values.output) throw new Error('Usage: --platform darwin|win32 --arch arm64|x64 --output NEW_DIRECTORY');
    console.log(JSON.stringify(await fetchNodeRuntime({ platform: values.platform, arch: values.arch, target: values.output }), null, 2));
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
