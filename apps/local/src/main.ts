import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parseListenPort, startHost, loadAssemblyManifest } from '@letsduck/host';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
export async function main(argv = process.argv.slice(2)): Promise<void> {
  const { values } = parseArgs({ args: argv, options: { host: { type: 'string', default: process.env.HOST ?? '127.0.0.1' }, port: { type: 'string', default: process.env.PORT ?? '8876' }, 'no-open': { type: 'boolean' }, help: { type: 'boolean', short: 'h' } } });
  if (values.help) { console.log('来做鸭 letsduck personal edition\n--host HOST  --port PORT  --no-open'); return; }
  const assets = resolve(process.env.DUCK_ASSETS ?? join(repo, 'assets'));
  const missing: string[] = [];
  for (const name of ['source.3mf', 'geometry.bin', 'model.json', 'catalog.json', 'export-schema.json']) {
    try { if (!(await stat(join(assets, name))).isFile()) missing.push(name); } catch { missing.push(name); }
  }
  if (missing.length) { console.error('还缺少模型资产包（单独授权，不随源码提供）：' + missing.join(', ')); console.error('请参考 docs/local-assets.md 导入已授权的资产包。'); process.exitCode = 2; return; }
  const port = parseListenPort(values.port!);
  const assemblyManifest = loadAssemblyManifest(resolve(process.env.DUCK_ASSEMBLY_MANIFEST ?? join(repo, 'scripts/assembly-assets.json')));
  const host = await startHost({ ...(assemblyManifest === undefined ? {} : {assemblyManifest}), assets, frontend: resolve(process.env.DUCK_FRONTEND ?? join(repo, 'frontend/dist')), host: values.host!, port, legacy: process.env.DUCK_DB || join(repo, 'backend/data/doodleduck.db') });
  console.log('来做鸭 letsduck 个人版已启动：' + host.url);
  console.log('方案保存在：' + host.storePath);
  if (host.imported) console.log('已从旧版本带入 ' + host.imported + ' 套方案。');
  if (!host.exportAvailable) console.log('提示：没有加载模型资产包，3MF 导出暂不可用。');
  console.log('关闭这个窗口（或按 Ctrl+C）即可退出。');
  const stop = () => { void host.close().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop); process.once('SIGHUP', stop);
  if (!values['no-open']) {
    const executable = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'rundll32.exe' : 'xdg-open';
    const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', host.url] : [host.url];
    execFile(executable, args, { timeout: 5_000 }, () => {});
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
