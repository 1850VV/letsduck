/** Shared baseline collector owns services, fake hardware, requests and cleanup. Node is the default engine. */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { root, stopChild } from './check-support.js';

const args = process.argv.slice(2);
if (!args.some(value => value === '--output' || value.startsWith('--output='))) args.push('--output', process.env.DUCK_TEST_OUTPUT || join(root, 'output/desktop-benchmark'));
if (!args.some(value => value === '--assets' || value.startsWith('--assets='))) args.push('--assets', process.env.DUCK_REAL_ASSETS || process.env.DUCK_ASSETS || join(root, 'assets'));
const child = spawn(process.execPath, ['--import', 'tsx', join(root, 'tooling/src/baseline.ts'), ...args], { cwd: root, stdio: 'inherit', env: process.env });
const interrupt = () => { void stopChild(child).then(() => process.exit(130)); };
const terminate = () => { void stopChild(child).then(() => process.exit(143)); };
process.once('SIGINT', interrupt); process.once('SIGTERM', terminate);
try {
  const code = await new Promise<number>((ok, no) => { child.once('error', no); child.once('exit', (code, signal) => signal ? no(new Error('Baseline terminated: ' + signal)) : ok(code ?? 1)); });
  if (code !== 0) throw new Error('Shared baseline exited ' + code);
} finally { process.off('SIGINT', interrupt); process.off('SIGTERM', terminate); await stopChild(child); }
