import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {unzipSync} from 'fflate';
import {ZipArchive,repackZip} from '@letsduck/exporter';
const fixture=JSON.parse(readFileSync(new URL('./oracles/streaming-zip.json',import.meta.url),'utf8')) as {schema:string;cases:{mode:string;sha256:string;source:string}[]};
assert.equal(fixture.schema,'letsduck-synthetic-python-zip/1');
for(const item of fixture.cases)test('Python '+item.mode+' ZIP retains compressed records, CRC, descriptors and archive comment',()=>{
 const source=Buffer.from(item.source,'base64');assert.equal(createHash('sha256').update(source).digest('hex'),item.sha256);
 const old=new ZipArchive(source),result=repackZip(source,{'config.json':Buffer.from('new'),'new.txt':Buffer.from('added')}),current=new ZipArchive(result),independent=unzipSync(result);
 assert.deepEqual(current.comment,Buffer.from('archive comment'));assert.equal(current.read('config.json').toString(),'new');assert.equal(current.read('new.txt').toString(),'added');
 for(const name of ['mesh.xml','中文.txt']){
  const before=old.entries.get(name),after=current.entries.get(name);assert.ok(before&&after);
  assert.deepEqual(old.read(name),current.read(name));assert.equal(after.crc,before.crc);assert.deepEqual(after.local,before.local);assert.deepEqual(after.compressed,before.compressed);assert.deepEqual(Buffer.from(independent[name]!),old.read(name));
  assert.equal(Boolean(before.local.readUInt16LE(6)&8),item.mode==='streaming');
 }
 for(const name of current.entries.keys())current.read(name);
});
