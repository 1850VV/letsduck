/** Import an existing, lawfully obtained local asset pack. No network access. */
import { createHash } from 'node:crypto';
import { lstat, stat, readFile, mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { isJsonObject, parseWireJson } from '@letsduck/domain';
import { ZipArchive } from '@letsduck/exporter';
import { exists, publish } from './asset-files.js';
export const FILES = ['source.3mf', 'geometry.bin', 'model.json', 'catalog.json', 'export-schema.json'] as const;
export const OPTIONAL_FILES = ['filament-catalog.json', 'filament-profiles.json'] as const;
const root = resolve(import.meta.dirname, '..');
const json = (bytes: Buffer): unknown => parseWireJson(bytes.toString('utf8'));
async function regular(path: string): Promise<boolean> { try { return (await stat(path)).isFile(); } catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false; throw error; } }
export async function importAssets(source: string, target: string): Promise<string> {
  source = resolve(source); target = resolve(target);
  const missing: string[] = [];
  for (const name of FILES) { const file = join(source, name); if (!(await regular(file)) || (await lstat(file)).isSymbolicLink()) missing.push(name); }
  if (missing.length) throw new Error('Incomplete local asset pack: ' + missing.join(', '));
  const files = new Map<string, Buffer>();
  for (const name of [...FILES, ...OPTIONAL_FILES]) {
    const file = join(source, name); if (!FILES.includes(name as typeof FILES[number]) && !(await regular(file))) continue;
    if ((await lstat(file)).isSymbolicLink()) throw new Error('Local asset cannot be a symlink: ' + name);
    files.set(name, await readFile(file));
  }
  const get = (name: string) => { const bytes = files.get(name); if (!bytes) throw new Error('Missing asset: ' + name); return bytes; };
  const model = json(get('model.json')), digest = createHash('sha256').update(get('source.3mf')).digest('hex');
  if (!isJsonObject(model) || model.source_sha256 !== digest) throw new Error('3MF does not match model manifest');
  if (!Array.isArray(model.parts) || model.parts.length !== 35 || new Set(model.parts.map(part => isJsonObject(part) ? part.id : undefined)).size !== 35) throw new Error('Expected the reviewed 35-part model pack');
  const archive = new ZipArchive(get('source.3mf')); for (const name of archive.entries.keys()) archive.read(name);
  const catalog = json(get('catalog.json')); if (!isJsonObject(catalog) || !Array.isArray(catalog.products) || !catalog.products.length) throw new Error('Missing consumables catalog');
  const schema = json(get('export-schema.json')); if (!isJsonObject(schema) || !isJsonObject(schema.filamentChunks) || !Array.isArray(schema.variantKeys)) throw new Error('Invalid export schema');
  if (!get('geometry.bin').length) throw new Error('Empty geometry');
  for (const name of OPTIONAL_FILES) if (files.has(name)) json(get(name));
  for (const [name, bytes] of files) {
    const destination = join(target, name);
    if (await exists(destination) && ((await lstat(destination)).isSymbolicLink() || !(await readFile(destination)).equals(bytes))) throw new Error('Different local asset already exists: ' + name);
  }
  await mkdir(target, { recursive: true }); const stage = await mkdtemp(join(target, '.import-'));
  try { for (const [name, bytes] of files) await writeFile(join(stage, name), bytes); await publish(stage, target); }
  finally { await rm(stage, { recursive: true, force: true }); }
  return digest;
}
async function main() {
  let source: string, target: string;
  try {
    const args = parseArgs({ allowPositionals: true, options: { target: { type: 'string' }, help: { type: 'boolean' } } });
    if (args.values.help) { console.log('Usage: tsx scripts/import_local_assets.ts SOURCE [--target DIR]'); return; }
    if (args.positionals.length !== 1) throw new Error('One existing workbench assets directory is required; a 3MF alone is insufficient');
    source = args.positionals[0]!; target = args.values.target ?? join(root, 'assets');
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 2; return; }
  try {
    const digest = await importAssets(source, target); console.log('Imported local-only assets (five required, plus any optional catalogue and presets). Source SHA-256: ' + digest); console.log('These assets retain their own terms; do not force-add them to Git.');
    try { const { writePack } = await import('./pack_geometry.js'); console.log('Packed the geometry for faster loading: geometry.pack.bin, ' + await writePack(target) + ' bytes.'); }
    catch (error) { console.log('Could not pack the geometry (' + (error instanceof Error ? error.message : String(error)) + '); the site uses geometry.bin.'); }
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
