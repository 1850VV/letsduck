import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as exporter from '@letsduck/exporter';
import { pythonString, readJsonField } from '@letsduck/domain';
const names = ['cover', ...Array.from({ length: 6 }, (_, index) => [`plate${index + 1}`, `top${index + 1}`]).flat()];
function multipart(plan: string | Buffer = '{"name":"测试","assignments":{}}', image = Buffer.from([0, 13, 10, 255, 254]), filename = true): Buffer {
  const parts = [Buffer.concat([Buffer.from('--duck-test\r\nContent-Disposition: form-data; name="plan"\r\n\r\n'), Buffer.isBuffer(plan) ? plan : Buffer.from(plan)])];
  for (const name of names) parts.push(Buffer.concat([Buffer.from('\r\n--duck-test\r\nContent-Disposition: form-data; name="' + name + '"' + (filename ? '; filename="preview.png"' : '') + '\r\nContent-Type: image/png\r\n\r\n'), image]));
  return Buffer.concat([...parts, Buffer.from('\r\n--duck-test--\r\n')]);
}
test('multipart retains raw binary parts, optional filenames and raw numeric plan semantics', async () => {
  assert.equal(typeof exporter.parseMultipart, 'function', 'The shared multipart decoder is missing');
  for (const filename of [true, false]) {
    const body = multipart('{"name":1.0,"assignments":{}}', Buffer.from([0, 13, 10, 255, 254]), filename);
    const value = await exporter.parseMultipart(body, 'multipart/form-data; boundary="duck-test"');
    assert.equal(pythonString(readJsonField(value, 'name')), '1.0');
    assert.deepEqual(Object.keys(value.thumbnails).sort(), [...names].sort());
    for (const image of Object.values(value.thumbnails)) assert.deepEqual(image, Buffer.from([0, 13, 10, 255, 254]));
  }
  const image = Buffer.from('content-transfer-encoding: base64\r\nThis is image data, not a header');
  const value = await exporter.parseMultipart(multipart(undefined, image), 'multipart/form-data; boundary=duck-test');
  assert.deepEqual(value.thumbnails.cover, image);
});
test('multipart rejects malformed headers, duplicates, limits and invalid plans', async () => {
  assert.equal(typeof exporter.parseMultipart, 'function', 'The shared multipart decoder is missing');
  const data = multipart(), text = data.toString('latin1'), type = 'multipart/form-data; boundary=duck-test';
  const bad = [
    Buffer.from(text.replace('name="cover"', 'name="plate1"'), 'latin1'),
    Buffer.from(text.replaceAll('image/png', 'text/plain'), 'latin1'), data.subarray(0, -20),
    Buffer.from(text.replace('Content-Disposition: form-data; name="plan"', 'Content-Disposition: form-data; name="plan"\r\nContent-Disposition: form-data; name="plan"'), 'latin1'),
    Buffer.from(text.replace('Content-Type: image/png', 'Content-Type: image/png\r\nContent-Transfer-Encoding: binary'), 'latin1'),
    multipart('{"thumbnails":{}}'), multipart('[]'), multipart('1.0'), multipart('not json'), multipart('{"name":"' + 'a'.repeat(200_000) + '"}'), multipart(undefined, Buffer.alloc(600_001)),
  ];
  for (const body of bad) await assert.rejects(exporter.parseMultipart(body, type), error => error instanceof exporter.ExportBodyError && error.status === 400 && error.body.code === 'request.format');
  await assert.rejects(exporter.parseMultipart(data, type + '\r\nInjected: yes'), exporter.ExportBodyError);
  await assert.rejects(exporter.parseMultipart(Buffer.alloc(8_000_001), type), error => error instanceof exporter.ExportBodyError && error.status === 413 && error.body.code === 'request.too_large');
});

test('multipart plans retain Python-supported UTF byte encodings', async () => {
  const source = '{"name":"测试🦆","assignments":{}}';
  const utf16le = Buffer.concat([Buffer.from([255, 254]), Buffer.from(source, 'utf16le')]), utf16be = Buffer.from(utf16le).swap16();
  const points = Array.from(source), le = Buffer.alloc((points.length + 1) * 4), be = Buffer.alloc(le.length);
  le.writeUInt32LE(0xfeff, 0); be.writeUInt32BE(0xfeff, 0);
  for (const [index, char] of points.entries()) { le.writeUInt32LE(char.codePointAt(0)!, (index + 1) * 4); be.writeUInt32BE(char.codePointAt(0)!, (index + 1) * 4); }
  for (const bytes of [utf16le, utf16be, utf16le.subarray(2), utf16be.subarray(2), le, be, le.subarray(4), be.subarray(4)]) {
    const value = await exporter.parseMultipart(multipart(bytes), 'multipart/form-data; boundary=duck-test');
    assert.equal(value.name, '测试🦆');
  }
});
