import { constants } from 'node:fs';
import { copyFile, lstat, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
export async function exists(path: string): Promise<boolean> { try { await lstat(path); return true; } catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false; throw error; } }
/** Publishing starts only after every staged file has been validated. */
export async function publish(stage: string, target: string): Promise<void> {
  for (const entry of (await readdir(stage, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const source = join(stage, entry.name), destination = join(target, entry.name);
    if (entry.isDirectory()) { await mkdir(destination, { recursive: true }); await publish(source, destination); }
    else if (!(await exists(destination))) { await mkdir(dirname(destination), { recursive: true }); await copyFile(source, destination, constants.COPYFILE_EXCL); }
  }
}
