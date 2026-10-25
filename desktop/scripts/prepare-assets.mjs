import { readFile, copyFile, mkdir, rm, stat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname, '../..'), source = resolve(process.env.DUCK_DISTRIBUTABLE_ASSETS || join(root, 'assets')), target = join(root, 'desktop/build/assets');
await rm(target, { recursive: true, force: true });
if (process.env.DUCK_PACKAGE_WITHOUT_ASSETS === '1') { console.log('Source-only development build: model and tutorial assets are not included.'); }
else {
  const manifest = JSON.parse(await readFile(join(root, 'scripts/assembly-assets.json'), 'utf8'));
  const names = ['source.3mf', 'model.json', 'catalog.json', 'export-schema.json', 'geometry.bin', 'geometry.pack.bin', 'geometry.positions.bin', ...Object.keys(manifest.files).map(n => 'assembly/' + n)];
  const model = JSON.parse(await readFile(join(source, 'model.json'), 'utf8')); let bytes = 0;
  for (const name of names) {
    const path = join(source, name), info = await stat(path); if (!info.isFile()) throw Error(`Missing asset: ${name}`);
    const expected = name === 'source.3mf' ? model.source_sha256 : manifest.files[name.replace(/^assembly\//, '')]?.sha256;
    if (expected && createHash('sha256').update(await readFile(path)).digest('hex') !== expected) throw Error(`Asset does not match the application: ${name}`);
    const destination = join(target, name); await mkdir(dirname(destination), { recursive: true }); await copyFile(path, destination); bytes += info.size;
  }
  console.log(JSON.stringify({ included: names.length, bytes, sourceModelAndTutorialVideos: true }));
}
