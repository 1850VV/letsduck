import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {TAGS,personalityFromSeed,render} from '../../frontend/shared/duck-voice.js';
for(const [seed,expected] of [[0,'09a3d3ca9085d88572c3b10b84d9dbc756ec3e26c903c04e2bd3a805da45a59d'],[271828,'586ddd9fce78e4897c993104a80bd3c0a70877a46505fadbc2e6c1155bbb0efc']] satisfies [number,string][]){
 test(`voice f32/u64 PCM matches frozen JavaScript at seed ${seed}`,()=>{
  const hash=createHash('sha256'),personality=personalityFromSeed(seed);
  for(const tag of Object.keys(TAGS))for(const variant of [0,1]){const pcm=render(tag,personality,variant);hash.update(Buffer.from(pcm.buffer,pcm.byteOffset,pcm.byteLength));}
  assert.equal(hash.digest('hex'),expected);
 });
}
