/** Import locally owned assembly media against the reviewed manifest, without network access. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, lstat, stat, mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { isJsonObject } from '@letsduck/domain';
import { exists, publish } from './asset-files.js';
export class AssetMissing extends Error { constructor(name: string) { super('Missing assembly asset: ' + name); } }
export interface AssetMetadata { bytes: number; sha256: string }
export interface AssemblyManifest { gitPath?: string; files: Record<string, AssetMetadata>; optionalFiles?: Record<string, AssetMetadata> }
export type AssetReader = (name: string) => Uint8Array | Promise<Uint8Array>;
const root = resolve(import.meta.dirname, '..'), sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
export async function loadManifest(): Promise<AssemblyManifest> {
  const raw: unknown = JSON.parse(await readFile(join(root, 'scripts/assembly-assets.json'), 'utf8'));
  if (!isJsonObject(raw) || !isJsonObject(raw.files)) throw new Error('Invalid assembly manifest');
  const parse = (input: unknown): Record<string, AssetMetadata> => {
    if (!isJsonObject(input)) throw new Error('Invalid assembly manifest entries');
    return Object.fromEntries(Object.entries(input).map(([name, meta]) => { if (!isJsonObject(meta) || typeof meta.bytes !== 'number' || typeof meta.sha256 !== 'string') throw new Error('Invalid assembly manifest entry: ' + name); return [name, { bytes: meta.bytes, sha256: meta.sha256 }]; }));
  };
  return { files: parse(raw.files), ...(raw.optionalFiles === undefined ? {} : { optionalFiles: parse(raw.optionalFiles) }), ...(typeof raw.gitPath === 'string' ? { gitPath: raw.gitPath } : {}) };
}
export function readFolder(source: string): AssetReader {
  return async name => { const file = join(source, name); try { if (!(await stat(file)).isFile() || (await lstat(file)).isSymbolicLink()) throw new AssetMissing(name); return await readFile(file); } catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') throw new AssetMissing(name); throw error; } };
}
export function readGit(ref: string, manifest: AssemblyManifest): AssetReader {
  return name => { try { const meta = manifest.files[name] ?? manifest.optionalFiles?.[name]; return execFileSync('git', ['cat-file', 'blob', ref + ':' + manifest.gitPath + '/' + name], { cwd: root, maxBuffer: (meta?.bytes ?? 1_000_000_000) + 1024 }); } catch { throw new AssetMissing(name); } };
}
export async function importAssemblyAssets(read: AssetReader, target: string, manifest: AssemblyManifest): Promise<number> {
  const files = { ...manifest.files }, optional = new Map<string, Uint8Array>();
  for (const [name, meta] of Object.entries(manifest.optionalFiles ?? {})) {
    let bytes: Uint8Array; try { bytes = await read(name); } catch (error) { if (error instanceof AssetMissing) continue; throw error; }
    if (bytes.length !== meta.bytes || sha(bytes) !== meta.sha256) throw new Error('Assembly reference does not match the manifest: ' + name);
    files[name] = meta; optional.set(name, bytes);
  }
  for (const [name, meta] of Object.entries(files)) { const dest = join(target, name); if (await exists(dest) && ((await lstat(dest)).isSymbolicLink() || sha(await readFile(dest)) !== meta.sha256)) throw new Error('Different assembly asset already exists: ' + name); }
  await mkdir(target, { recursive: true }); const stage = await mkdtemp(join(target, '.import-'));
  try {
    for (const [name, meta] of Object.entries(files)) {
      if (await exists(join(target, name))) continue;
      const bytes = optional.get(name) ?? await read(name);
      if (bytes.length !== meta.bytes || sha(bytes) !== meta.sha256) throw new Error('Assembly asset does not match the manifest: ' + name);
      const path = join(stage, name); await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes);
    }
    await publish(stage, target);
  } finally { await rm(stage, { recursive: true, force: true }); }
  return Object.values(files).reduce((total, meta) => total + meta.bytes, 0);
}
async function main() {
  let args: ReturnType<typeof parseArgs<{ options: { git: { type: 'string' }; target: { type: 'string' }; help: { type: 'boolean' } }; allowPositionals: true }>>;
  try { args = parseArgs({ allowPositionals: true, options: { git: { type: 'string' }, target: { type: 'string' }, help: { type: 'boolean' } } }); if (args.values.help) { console.log('Usage: tsx scripts/import_assembly_assets.ts SOURCE | --git REF [--target DIR]'); return; } if ((args.values.git ? 1 : 0) + args.positionals.length !== 1) throw new Error('Choose one source folder or --git REF'); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 2; return; }
  try { const manifest = await loadManifest(), target = args.values.target ?? join(root, 'assets/assembly'); const size = await importAssemblyAssets(args.values.git ? readGit(args.values.git, manifest) : readFolder(args.positionals[0]!), target, manifest); console.log('Imported assembly assets (' + (size / 1e6).toFixed(1) + ' MB) into ' + target + '.'); console.log('Retain the accompanying asset notices when replacing project resources.'); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
