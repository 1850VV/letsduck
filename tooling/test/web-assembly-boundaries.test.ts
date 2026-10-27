import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAssemblyManifest} from '../../frontend/assemble/assembly-manifest.js';
import {parseSetupState} from '../../frontend/assemble/servo-types.js';
import {parseResponseJson,jsonStringify} from '../../frontend/shared/json.js';

test('assembly geometry validates offsets, counts and vectors before creating binary views',()=>{
 const part={id:'fixture',sourceId:'fixture-source',sourceName:'fixture part',positionOffset:0,indexOffset:36,vertexCount:3,indexCount:3,size:[1,2,3],rotationZ:.25};
 assert.deepEqual(parseAssemblyManifest({parts:[part]}),{parts:[part]});
 for(const replacement of [{vertexCount:2.5},{positionOffset:-1},{indexCount:NaN},{size:[1,2]},{id:42},{sourceId:42}])assert.throws(()=>parseAssemblyManifest({parts:[{...part,...replacement}]}));
});

test('MCU observations retain exact raw integers at the response and display boundary',async()=>{
 const state=parseSetupState(await parseResponseJson(new Response('{"phase":"idle","records":[{"id":10,"readback":{"raw_pos":18446744073709551615}}],"telemetry":{"known":true,"ids":[10],"readings":{"10":{"raw_pos":9223372036854775807}}}}')));
 assert.equal(state.records[0]!.readback!.raw_pos,18446744073709551615n);
 assert.equal(state.telemetry!.readings!['10']!.raw_pos,9223372036854775807n);
 assert.match(jsonStringify(state),/"raw_pos":18446744073709551615/);
});

test('status projections retain supplementary server records and exact evidence metadata',()=>{
 const state=parseSetupState({phase:'idle',records:[{id:10,labelled:null,installed:false,evidence:{counter:18446744073709551615n}}],board:'fixture-board',extensions:{sequence:9223372036854775807n}});
 assert.equal(state.board,'fixture-board');
 assert.deepEqual(state.records[0]!.evidence,{counter:18446744073709551615n});
 assert.equal(state.records[0]!.labelled,null);
 assert.deepEqual(state.extensions,{sequence:9223372036854775807n});
});
