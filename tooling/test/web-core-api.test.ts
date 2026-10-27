import assert from 'node:assert/strict';
import { test } from 'node:test';
import { api, getToken, setToken } from '../../frontend/shared/api.js';
import { jsonStringify } from '../../frontend/shared/json.js';

const wire='{"id":"s","name":"fixture","design":{"colors":{"p":"#112233"},"assignments":{"p":null},"finishes":{}},"provenance":{"legacy":[9007199254740993]},"voiceSalt":18446744073709551615,"created":1.0,"updated":2}';
test('API reads and writes exact scheme integers and retains raw provenance',async()=>{
  const saved=globalThis.fetch;let sent:unknown;
  globalThis.fetch=async(_input,init)=>{sent=init?.body;return new Response(wire,{status:200});};
  try{
    const rows=await api('PUT','/schemes/s',{voiceSalt:18446744073709551615n});
    assert.equal(rows.voiceSalt,18446744073709551615n);
    assert.equal(jsonStringify(rows),wire);
    assert.equal(sent,'{"voiceSalt":18446744073709551615}');
  }finally{globalThis.fetch=saved;}
});
test('API clears a rejected session and keeps structured error fields',async()=>{
  const saved=globalThis.fetch;setToken('synthetic-session');
  globalThis.fetch=async()=>new Response('{"code":"auth.required","params":{}}',{status:401});
  try{await assert.rejects(api('GET','/me'),{code:'auth.required',status:401});assert.equal(getToken(),null);}
  finally{globalThis.fetch=saved;setToken(null);}
});
test('published work author uses the public projection without account creation metadata',async()=>{
 const saved=globalThis.fetch;
 const wire='{"id":"w","title":"Published","description":"","author":{"id":"a","name":"Author","avatar":"🦆","color":"#123456"},"design":{"colors":{"p":"#112233"},"assignments":{"p":null},"finishes":{}},"provenance":{"extra":[9007199254740993]},"parentId":null,"schemeId":null,"created":9007199254740993,"rating":{"average":0,"count":0,"mine":0}}';
 globalThis.fetch=async()=>new Response(wire,{status:200});
 try{const work=await api('POST','/works',{});assert.equal(work.author.name,'Author');assert.equal(work.created,9007199254740993n);assert.equal(jsonStringify(work),wire);}
 finally{globalThis.fetch=saved;}
});
