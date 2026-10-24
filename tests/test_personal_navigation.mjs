import test from 'node:test';
import assert from 'node:assert/strict';
const api=await import('../frontend/shared/personal-navigation.mjs').catch(error=>{if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;return {};});

test('personal navigation only owns the three same-origin pages and retains import fragments',()=>{
 assert.equal(typeof api.personalRoute,'function');
 const origin='http://127.0.0.1:8876';
 assert.deepEqual(api.personalRoute('/paint#new',origin),{key:'paint',href:'/paint#new',source:'/index.html#new'});
 assert.deepEqual(api.personalRoute('/assemble/',origin),{key:'assemble',href:'/assemble/',source:'/assemble/index.html'});
 assert.deepEqual(api.personalRoute('/',origin),{key:'home',href:'/',source:'/home.html'});
 for(const path of ['https://other.example/paint','/api/schemes','/gallery/','/assemble/assets/full-assembly.bin'])assert.equal(api.personalRoute(path,origin),null);
});

test('preparation and repeated navigation reuse one loaded page instance',async()=>{
 assert.equal(typeof api.createPageNavigator,'function');
 let loads=0;const committed=[];
 const pages=api.createPageNavigator(async key=>({key,instance:++loads}),entry=>committed.push(entry));
 const warmed=await pages.prepare('paint');await pages.navigate('paint');await pages.navigate('home');await pages.navigate('paint');
 assert.equal(loads,2);assert.equal(committed[0],warmed);assert.equal(committed[2],warmed);
});

test('an older slow preparation cannot replace a newer navigation',async()=>{
 assert.equal(typeof api.createPageNavigator,'function');
 let finish;const committed=[];
 const pages=api.createPageNavigator(key=>key==='paint'?new Promise(resolve=>{finish=resolve;}):Promise.resolve({key}),entry=>committed.push(entry.key));
 const old=pages.navigate('paint');await pages.navigate('home');finish({key:'paint'});await old;
 assert.deepEqual(committed,['home']);
});

test('a failed preparation is evicted so a later attempt can recover',async()=>{
 assert.equal(typeof api.createPageNavigator,'function');
 let attempts=0;const pages=api.createPageNavigator(async key=>{if(++attempts===1)throw Error('load failed');return {key};},()=>{});
 await assert.rejects(pages.prepare('assemble'),/load failed/);assert.deepEqual(await pages.prepare('assemble'),{key:'assemble'});
});
