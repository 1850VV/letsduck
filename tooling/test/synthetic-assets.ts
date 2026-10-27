import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { zipSync, strToU8 } from 'fflate';

/** Synthetic print structure, with no licensed model or manufacturer palette. */
export function writeSyntheticAssets(directory: string) {
  const ids = ['bambu-GFA00-10100', 'bambu-GFA00-10101', 'bambu-GFA00-10604', 'bambu-GFU03-51103'];
  const products = ids.map((id, index) => ({ id, brand: 'Example', name: `Color ${index}`, series: index === 3 ? 'TPU 90A' : 'PLA Basic', material: index === 3 ? 'TPU' : 'PLA', hex: ['#FFFFFF', '#000000', '#00FF00', '#888888'][index]! }));
  const parts: { id: string; uuid: string; name: string; originalName: string; material: string; color: string; plate: number; sourceObject: number; sourcePart: number }[] = [];
  let xml = '<config>';
  for (let object = 0; object < 25; object++) {
    xml += `<object id="${object}"><metadata key="extruder" value="1"/>`;
    for (let part = 0; part < (object < 10 ? 2 : 1); part++) {
      const index = parts.length, product = products[index % 4]!;
      parts.push({ id: `p${index}`, uuid: `synthetic-${index}`, name: `Part ${index}`, originalName: `Part ${index}`, material: product.series, color: product.hex, plate: index % 6 + 1, sourceObject: object, sourcePart: part });
      xml += `<part id="${part}" uuid="synthetic-${index}"><metadata key="extruder" value="1"/></part>`;
    }
    xml += '</object>';
  }
  for (let plate = 1; plate <= 6; plate++) xml += `<plate><metadata key="plate_id" value="${plate}"/></plate>`;
  xml += '</config>';
  const config = { filament_type: ['PLA', 'PLA', 'PLA', 'TPU'], filament_vendor: ['Example', 'Example', 'Example', 'Example'], filament_ids: ['a', 'b', 'c', 'd'], nozzle_temperature: ['220', '220', '220', '225'], filament_settings_id: ['a', 'b', 'c', 'd'], filament_colour: ['#FFFFFF', '#000000', '#00FF00', '#888888'], filament_multi_colour: ['#FFFFFF', '#000000', '#00FF00', '#888888'], filament_extruder_variant: ['1', '1', '1', '1'], filament_self_index: ['1', '2', '3', '4'], flush_volumes_matrix: Array.from({ length: 16 }, (_, index) => index % 5 === 0 ? '0' : '100'), flush_volumes_vector: ['1', '2', '3', '4', '5', '6', '7', '8'] };
  const source = zipSync({ '3D/model.model': strToU8('<model><mesh>synthetic geometry</mesh></model>'), '[Content_Types].xml': strToU8('<Types></Types>'), 'Metadata/project_settings.config': strToU8(JSON.stringify(config)), 'Metadata/model_settings.config': strToU8(xml) }, {mtime:new Date(2001,1,3,4,5,6)});
  writeFileSync(join(directory, 'source.3mf'), source);
  writeFileSync(join(directory, 'model.json'), JSON.stringify({ source_sha256: createHash('sha256').update(source).digest('hex'), parts }));
  writeFileSync(join(directory, 'catalog.json'), JSON.stringify({ version: 'synthetic', products }));
  writeFileSync(join(directory, 'export-schema.json'), JSON.stringify({ filamentChunks: Object.fromEntries(['filament_type', 'filament_vendor', 'filament_ids', 'filament_settings_id', 'nozzle_temperature', 'filament_colour', 'filament_multi_colour', 'filament_extruder_variant'].map(key => [key, [1, 1, 1, 1]])) }));
}
