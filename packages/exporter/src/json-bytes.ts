/** The legacy JSON byte boundary accepts UTF-8, UTF-16 and UTF-32, with or without BOM. */
export function decodeJsonBytes(data: Buffer): string {
  let encoding: 'utf-8' | 'utf-16le' | 'utf-16be' | 'utf-32le' | 'utf-32be' = 'utf-8', offset = 0;
  if (data.length >= 4 && data.readUInt32BE(0) === 0x0000feff) { encoding = 'utf-32be'; offset = 4; }
  else if (data.length >= 4 && data.readUInt32LE(0) === 0x0000feff) { encoding = 'utf-32le'; offset = 4; }
  else if (data.length >= 2 && data.readUInt16BE(0) === 0xfeff) encoding = 'utf-16be';
  else if (data.length >= 2 && data.readUInt16LE(0) === 0xfeff) encoding = 'utf-16le';
  else if (data.length >= 4) {
    if (!data[0]) encoding = data[1] ? 'utf-16be' : 'utf-32be';
    else if (!data[1]) encoding = data[2] || data[3] ? 'utf-16le' : 'utf-32le';
  } else if (data.length === 2) {
    if (!data[0]) encoding = 'utf-16be'; else if (!data[1]) encoding = 'utf-16le';
  }
  if (encoding === 'utf-32le' || encoding === 'utf-32be') {
    if ((data.length - offset) % 4) throw new Error('Incomplete UTF-32 JSON');
    const text: string[] = [];
    for (; offset < data.length; offset += 4) {
      const point = encoding === 'utf-32le' ? data.readUInt32LE(offset) : data.readUInt32BE(offset);
      if (point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff)) throw new Error('Invalid UTF-32 JSON');
      text.push(String.fromCodePoint(point));
    }
    return text.join('');
  }
  return new TextDecoder(encoding, { fatal: true }).decode(data);
}
