import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { migrateSqlite } from '@letsduck/storage';

const description = 'Copy a SQLite snapshot into an empty configured database and verify every original field';
export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  try {
    const parsed = parseArgs({ args, allowPositionals: true, options: { backup: { type: 'string' }, help: { type: 'boolean', short: 'h' } } });
    if (parsed.values.help) {
      process.stdout.write(description + '\nUsage: migrate-database SOURCE [--backup PATH]\n');
      return;
    }
    if (parsed.positionals.length !== 1) throw new Error('Usage: migrate-database SOURCE [--backup PATH]');
    const result = await migrateSqlite(parsed.positionals[0]!, undefined, parsed.values.backup);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + '\n');
    process.exitCode = 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
