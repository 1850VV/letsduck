import { inflateRawSync, deflateRawSync, crc32 } from 'node:zlib';
import { unzipSync, zipSync } from 'fflate';

type Entry = { name: string; local: Buffer; central: Buffer; method: number; size: number; crc: number; compressed: Buffer };
export class ZipArchive {
  entries = new Map<string, Entry>();
  comment: Buffer;
  constructor(readonly data: Buffer) {
    let end = data.length - 22;
    while (end >= Math.max(0, data.length - 65557) && (data.readUInt32LE(end) !== 0x06054b50 || end + 22 + data.readUInt16LE(end + 20) !== data.length)) end--;
    if (end < Math.max(0, data.length - 65557)) throw new Error('Invalid ZIP directory');
    const count = data.readUInt16LE(end + 10), start = data.readUInt32LE(end + 16);
    if (count === 65535 || start === 0xffffffff || data.readUInt32LE(end + 4) !== 0) throw new Error('ZIP64 or split archive');
    this.comment = data.subarray(end + 22);
    const rows: { name: string; offset: number; central: Buffer }[] = []; let pos = start;
    for (let i = 0; i < count; i++) {
      if (data.readUInt32LE(pos) !== 0x02014b50) throw new Error('Invalid central directory');
      const n = data.readUInt16LE(pos + 28), x = data.readUInt16LE(pos + 30), c = data.readUInt16LE(pos + 32), last = pos + 46 + n + x + c;
      if (last > end || data.readUInt16LE(pos + 34) || [20, 24, 42].some(p => data.readUInt32LE(pos + p) === 0xffffffff)) throw new Error('Unsupported ZIP record');
      rows.push({ name: data.toString('utf8', pos + 46, pos + 46 + n), offset: data.readUInt32LE(pos + 42), central: data.subarray(pos, last) }); pos = last;
    }
    const offsets = rows.map(r => r.offset).sort((a, b) => a - b); const ends = new Map(offsets.map((p, i) => [p, offsets[i + 1] ?? start]));
    for (const r of rows) {
      const local = data.subarray(r.offset, ends.get(r.offset)), method = r.central.readUInt16LE(10);
      if (this.entries.has(r.name) || local.readUInt32LE(0) !== 0x04034b50 || ![0, 8].includes(method) || r.central.readUInt16LE(8) & 1) throw new Error('Unsupported ZIP entry');
      const begin = 30 + local.readUInt16LE(26) + local.readUInt16LE(28), length = r.central.readUInt32LE(20);
      if (begin + length > local.length) throw new Error('Truncated ZIP entry');
      this.entries.set(r.name, { name: r.name, local, central: r.central, method, size: r.central.readUInt32LE(24), crc: r.central.readUInt32LE(16), compressed: local.subarray(begin, begin + length) });
    }
  }
  read(name: string) {
    const e = this.entries.get(name); if (!e) throw new Error(`Missing ZIP entry: ${name}`);
    // The directory already gives the exact size. One output buffer avoids the
    // default 16 KiB chunks and a second full-size concatenation for model XML.
    const bytes = e.method === 0 ? e.compressed : inflateRawSync(e.compressed, { chunkSize: Math.max(64, e.size), maxOutputLength: Math.max(1, e.size) });
    if (bytes.length !== e.size || crc32(bytes) !== e.crc) throw new Error('ZIP checksum mismatch');
    return bytes;
  }
}

export function repackZip(source: Buffer, replacements: Record<string, Buffer>): Buffer {
  let original: ZipArchive;
  try { original = new ZipArchive(source); } catch {
    // Equivalent to the old implementation's conventional writer fallback.
    return Buffer.from(zipSync({ ...unzipSync(source), ...replacements }, { level: 6 }));
  }
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
      header.writeUInt32LE(crc, 14); header.writeUInt32LE(bytes.length, 18); header.writeUInt32LE(replacement.length, 22);
      directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(bytes.length, 20); directory.writeUInt32LE(replacement.length, 24);
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
