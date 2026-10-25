import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { JsonObject } from '../rules.js';

export class Assets {
  model: JsonObject | null = null;
  catalog: JsonObject | null = null;
  readonly publicNames = new Set(['model.json', 'catalog.json', 'geometry.bin', 'geometry.pack.bin', 'geometry.positions.bin', 'export-schema.json']);
  readonly assemblyNames: Set<string>;
  constructor(readonly path: string, readonly frontend: string, assembly: string[]) {
    this.assemblyNames = new Set(assembly);
    try { this.model = JSON.parse(readFileSync(join(path, 'model.json'), 'utf8')); this.catalog = JSON.parse(readFileSync(join(path, 'catalog.json'), 'utf8')); } catch { /* Missing packs keep the homepage and local schemes available. */ }
  }
  get partIds(): string[] { return this.model?.parts?.map((p: JsonObject) => p.id) ?? []; }
  get assemblyReady() { return existsSync(join(this.frontend, 'assemble/index.html')) && [...this.assemblyNames].every(n => existsSync(join(this.path, 'assembly', n))); }
}
