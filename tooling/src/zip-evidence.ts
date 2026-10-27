import { createHash } from 'node:crypto';
import { crc32 } from 'node:zlib';
import { unzipSync } from 'fflate';

const digest = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');

/** Validate the ordinary ZIP format used by the fixed model and retain both kinds of evidence. */
export function describeExport(archive: Buffer) {
  let end = -1;
  for (let at = archive.length - 22; at >= Math.max(0, archive.length - 65557); at--) {
    if (archive.readUInt32LE(at) === 0x06054b50 && at + 22 + archive.readUInt16LE(at + 20) === archive.length) { end = at; break; }
  }
  if (end < 0 || archive.readUInt32LE(end + 4) !== 0) throw new Error('Invalid or split ZIP archive');
  const count = archive.readUInt16LE(end + 10), start = archive.readUInt32LE(end + 16);
  if (count === 65535 || count !== archive.readUInt16LE(end + 8) || start + archive.readUInt32LE(end + 12) !== end) throw new Error('Unsupported ZIP directory');
  const contents = unzipSync(archive);
  if (!contents['[Content_Types].xml'] || !contents['Metadata/duck_studio_materials.json'] || !Object.keys(contents).some(name => name.startsWith('3D/') && name.endsWith('.model'))) throw new Error('Missing 3MF model or BOM');
  const records: { name: string; offset: number; bytes: number; sha256: string }[] = [];
  let at = start;
  for (let index = 0; index < count; index++) {
    if (at + 46 > end || archive.readUInt32LE(at) !== 0x02014b50) throw new Error('Invalid ZIP entry');
    const nameLength = archive.readUInt16LE(at + 28), name = archive.subarray(at + 46, at + 46 + nameLength).toString('utf8');
    const value = contents[name], offset = archive.readUInt32LE(at + 42);
    if (!value || archive.readUInt32LE(offset) !== 0x04034b50 || value.length !== archive.readUInt32LE(at + 24)) throw new Error('Invalid ZIP local record');
    if (crc32(value) !== archive.readUInt32LE(at + 16)) throw new Error('ZIP CRC mismatch: ' + name);
    records.push({ name, offset, bytes: value.length, sha256: digest(value) });
    at += 46 + nameLength + archive.readUInt16LE(at + 30) + archive.readUInt16LE(at + 32);
  }
  if (at !== end || new Set(records.map(record => record.name)).size !== count) throw new Error('Invalid ZIP entry count');
  const offsets = records.map(record => record.offset).sort((a, b) => a - b);
  const ends = new Map(offsets.map((offset, index) => [offset, offsets[index + 1] ?? start]));
  const entries = records.map(({ offset, ...record }) => ({ ...record, compressedRecordSha256: digest(archive.subarray(offset, ends.get(offset))) }));
  const bom: unknown = JSON.parse(Buffer.from(contents['Metadata/duck_studio_materials.json']).toString('utf8'));
  return { bytes: archive.length, sha256: digest(archive), entries, bom };
}
