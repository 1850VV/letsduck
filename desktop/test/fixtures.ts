import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { deflateSync, crc32 } from 'node:zlib';
import { zipSync, strToU8 } from 'fflate';

export function png() {
  function chunk(tag: string, data: Buffer) { const type = Buffer.from(tag), n = Buffer.alloc(4), crc = Buffer.alloc(4); n.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([type, data]))); return Buffer.concat([n, type, data, crc]); }
  const header = Buffer.alloc(13); header.writeUInt32BE(512); header.writeUInt32BE(512, 4); header[8] = 8; header[9] = 2;
  const pixels = Buffer.alloc((512 * 3 + 1) * 512, 255); for (let i = 0; i < 512; i++) pixels[i * (512 * 3 + 1)] = 0;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}

export function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'duck-desktop-')); const assets = join(root, 'assets'), frontend = join(root, 'frontend');
  mkdirSync(assets); mkdirSync(frontend); mkdirSync(join(assets, 'assembly')); mkdirSync(join(frontend, 'assemble'));
  writeFileSync(join(frontend, 'home.html'), '<h1>来做鸭</h1>'); writeFileSync(join(frontend, 'index.html'), '<h1>涂装</h1>');
  writeFileSync(join(frontend, 'assemble/index.html'), '<h1>组装</h1>'); writeFileSync(join(frontend, 'module.mjs'), 'export const duck=1');
  writeFileSync(join(assets, 'assembly/video.mp4'), '0123456789');
  const ids = ['bambu-GFA00-10100', 'bambu-GFA00-10101', 'bambu-GFA00-10604', 'bambu-GFU03-51103', 'red', 'blue'];
  const products = ids.map((id, i) => ({ id, name: id, series: i === 3 || i === 5 ? 'TPU 90A' : 'PLA Basic', material: i === 3 || i === 5 ? 'TPU' : 'PLA', hex: ['#FFFFFF', '#000000', '#00FF00', '#888888', '#FF0000', '#0000FF'][i] }));
  const parts: any[] = []; let xml = '<config>';
  for (let object = 0; object < 25; object++) {
    xml += `<object id="${object}"><metadata key="extruder" value="1"/><metadata key="name" value="fixture-${object}"/>`;
    for (let n = 0; n < (object < 10 ? 2 : 1); n++) {
      const i = parts.length, product = products[i < 6 ? 3 : i % 3]!;
      const part = { id: `p${i}`, uuid: `fixture-${i}`, name: `零件${i}`, originalName: `original-${i}`, material: product.series, color: product.hex, plate: i < 6 ? 1 : 2 + i % 5, sourceObject: object, sourcePart: n };
      parts.push(part); xml += `<part id="${n}" uuid="${part.uuid}"><metadata key="name" value="fixture-part"/><metadata key="extruder" value="1"/></part>`;
    }
    xml += '</object>';
  }
  for (let i = 1; i <= 6; i++) xml += `<plate><metadata key="plate_id" value="${i}"/></plate>`;
  xml += '</config>';
  const config = { filament_type: ['PLA', 'PLA', 'PLA', 'TPU'], filament_colour: ['#fff', '#000', '#0f0', '#888'], filament_multi_colour: ['#fff', '#000', '#0f0', '#888'], filament_extruder_variant: ['1', '1', '1', '1'], filament_self_index: ['1', '2', '3', '4'], nozzle_temperature: ['220', '220', '220', '225'], flush_volumes_matrix: Array.from({ length: 16 }, (_, i) => i % 5 === 0 ? '0' : '100'), flush_volumes_vector: ['1', '2', '3', '4', '5', '6', '7', '8'], different_settings_to_system: ['print', 'a', 'b', 'c', 'd', 'printer'], machine_max_speed_x: ['500'], print_settings_id: 'must-survive' };
  const entries: Record<string, Uint8Array> = { '3D/model.model': strToU8('<model><mesh>do not change these geometry bytes</mesh></model>'), 'Metadata/project_settings.config': strToU8(JSON.stringify(config)), 'Metadata/model_settings.config': strToU8(xml), '[Content_Types].xml': strToU8('<Types></Types>'), 'Auxiliaries/.thumbnails/cover.png': png() };
  const source = zipSync(entries); const sha = createHash('sha256').update(source).digest('hex');
  const model = { source_sha256: sha, parts };
  const catalog = { version: 'synthetic-1', sourceUrl: 'https://example.invalid/catalog', sourceSha256: 'synthetic', scope: 'synthetic', products };
  const schema = { filamentChunks: Object.fromEntries(['filament_type', 'filament_colour', 'filament_multi_colour', 'filament_extruder_variant', 'nozzle_temperature'].map(k => [k, [1, 1, 1, 1]])) };
  for (const [name, value] of Object.entries({ 'model.json': model, 'catalog.json': catalog, 'export-schema.json': schema })) writeFileSync(join(assets, name), JSON.stringify(value));
  writeFileSync(join(assets, 'source.3mf'), source);
  const image = 'data:image/png;base64,' + png().toString('base64');
  const payload = { source_sha256: sha, assignments: Object.fromEntries(parts.map(p => [p.id, products.find(x => x.series === p.material && x.hex === p.color)!.id])), thumbnails: Object.fromEntries(['cover', ...Array.from({ length: 6 }, (_, i) => [`plate${i + 1}`, `top${i + 1}`]).flat()].map(n => [n, image])) };
  return { root, assets, frontend, payload, model, catalog, source, config, xml };
}
