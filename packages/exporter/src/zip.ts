import { inflateRawSync, deflateRawSync, crc32 } from 'node:zlib';
import { unzipSync, zipSync } from 'fflate';

export interface ZipEntry { name: string; local: Buffer; central: Buffer; method: number; size: number; crc: number; compressed: Buffer }
export class ZipArchive {
  readonly entries = new Map<string, ZipEntry>();
  readonly comment: Buffer;
  constructor(readonly data: Buffer) {
    let end = data.length - 22;
    while (end >= Math.max(0, data.length - 65557) && (data.readUInt32LE(end) !== 0x06054b50 || end + 22 + data.readUInt16LE(end + 20) !== data.length)) end--;
    if (end < Math.max(0, data.length - 65557)) throw new Error('Invalid ZIP directory');
    const count = data.readUInt16LE(end + 10), start = data.readUInt32LE(end + 16);
    if (count === 65535 || start === 0xffffffff || data.readUInt32LE(end + 4) !== 0) throw new Error('ZIP64 or split archive');
    this.comment = data.subarray(end + 22);
    const rows: { name: string; offset: number; central: Buffer }[] = []; let position = start;
    for (let index = 0; index < count; index++) {
      if (data.readUInt32LE(position) !== 0x02014b50) throw new Error('Invalid central directory');
      const length = data.readUInt16LE(position + 28), extra = data.readUInt16LE(position + 30), comment = data.readUInt16LE(position + 32), last = position + 46 + length + extra + comment;
      if (last > end || data.readUInt16LE(position + 34) || [20, 24, 42].some(at => data.readUInt32LE(position + at) === 0xffffffff)) throw new Error('Unsupported ZIP record');
      rows.push({ name: data.toString('utf8', position + 46, position + 46 + length), offset: data.readUInt32LE(position + 42), central: data.subarray(position, last) }); position = last;
    }
    const offsets = rows.map(row => row.offset).sort((a, b) => a - b), ends = new Map(offsets.map((offset, index) => [offset, offsets[index + 1] ?? start]));
    for (const row of rows) {
      const local = data.subarray(row.offset, ends.get(row.offset)), method = row.central.readUInt16LE(10);
      if (this.entries.has(row.name) || local.readUInt32LE(0) !== 0x04034b50 || ![0, 8].includes(method) || row.central.readUInt16LE(8) & 1) throw new Error('Unsupported ZIP entry');
      const begin = 30 + local.readUInt16LE(26) + local.readUInt16LE(28), length = row.central.readUInt32LE(20);
      if (begin + length > local.length) throw new Error('Truncated ZIP entry');
      this.entries.set(row.name, { name: row.name, local, central: row.central, method, size: row.central.readUInt32LE(24), crc: row.central.readUInt32LE(16), compressed: local.subarray(begin, begin + length) });
    }
  }
  read(name: string): Buffer {
    const entry = this.entries.get(name); if (!entry) throw new Error(`Missing ZIP entry: ${name}`);
    const bytes = entry.method === 0 ? entry.compressed : inflateRawSync(entry.compressed, { chunkSize: Math.max(64, entry.size), maxOutputLength: Math.max(1, entry.size) });
    if (bytes.length !== entry.size || crc32(bytes) !== entry.crc) throw new Error('ZIP checksum mismatch');
    return bytes;
  }
}
export function repackZip(source: Buffer, replacements: Record<string, Buffer>): Buffer {
  let original: ZipArchive;
  try { original = new ZipArchive(source); }
  catch { return Buffer.from(zipSync({ ...unzipSync(source), ...replacements }, { level: 6 })); }
  const locals: Buffer[] = [], central: Buffer[] = []; let offset = 0;
  for (const name of new Set([...original.entries.keys(), ...Object.keys(replacements)])) {
    const old = original.entries.get(name), replacement = replacements[name]; let local: Buffer, directory: Buffer;
    if (replacement === undefined) { local = old!.local; directory = Buffer.from(old!.central); }
    else if (old) {
      const bytes = old.method === 0 ? replacement : deflateRawSync(replacement, { level: 6 });
      const begin = 30 + old.local.readUInt16LE(26) + old.local.readUInt16LE(28), header = Buffer.from(old.local.subarray(0, begin));
      directory = Buffer.from(old.central);
      header.writeUInt16LE(header.readUInt16LE(6) & ~8, 6); directory.writeUInt16LE(directory.readUInt16LE(8) & ~8, 8);
      const crc = crc32(replacement);
      for (const [at, value] of [[14, crc], [18, bytes.length], [22, replacement.length]] as const) header.writeUInt32LE(value, at);
      for (const [at, value] of [[16, crc], [20, bytes.length], [24, replacement.length]] as const) directory.writeUInt32LE(value, at);
      local = Buffer.concat([header, bytes]);
    } else {
      const small = new ZipArchive(Buffer.from(zipSync({ [name]: replacement }, { level: 6 }))), entry = small.entries.get(name)!;
      local = entry.local; directory = Buffer.from(entry.central);
    }
    directory.writeUInt32LE(offset, 42); locals.push(local); central.push(directory); offset += local.length;
  }
  const directory = Buffer.concat(central), footer = Buffer.alloc(22);
  footer.writeUInt32LE(0x06054b50); footer.writeUInt16LE(locals.length, 8); footer.writeUInt16LE(locals.length, 10);
  footer.writeUInt32LE(directory.length, 12); footer.writeUInt32LE(offset, 16); footer.writeUInt16LE(original.comment.length, 20);
  return Buffer.concat([...locals, directory, footer, original.comment]);
}
