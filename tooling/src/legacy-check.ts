import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const local = join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const python = process.env.PYTHON || (existsSync(local) ? local : 'python3');
const commands = process.argv.includes('--publication')
  ? [['scripts/publication_audit.py']]
  : [['-I', '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_personal.py', '-v'], ['-m', 'unittest', 'discover', '-s', 'tests', '-v']];
for (const args of commands) {
  const result = spawnSync(python, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
