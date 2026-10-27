import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync, symlinkSync } from 'node:fs';
import { join, resolve, delimiter } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';
import { writeSyntheticAssets } from './synthetic-assets.js';

const root = resolve(import.meta.dirname, '../..');

test('captures the Node API in an owned temporary database and cleans up the service', () => {
  const dir = mkdtempSync(join(tmpdir(), 'letsduck-baseline-test-'));
  const assets = join(dir, 'assets'), output = join(dir, 'evidence'), sentinel = join(dir, 'user.db');
  mkdirSync(assets); writeFileSync(sentinel, 'Do not open the real database.');
  try {
    const run = spawnSync(process.execPath, ['--import', 'tsx', 'tooling/src/baseline.ts', '--assets', assets, '--output', output, '--save-samples', '2', '--export-samples', '0'], {
      cwd: root, encoding: 'utf8', timeout: 30_000, env: { ...process.env, DUCK_PERSONAL_DB: sentinel, DUCK_DB: sentinel, DUCK_LEGACY_DB: sentinel },
    });
    assert.equal(run.status, 0, run.stderr);
    const result = JSON.parse(readFileSync(join(output, 'baseline.json'), 'utf8'));
    assert.equal(result.schema, 'letsduck-baseline/1');
    assert.equal(result.engine.kind,'node');assert.equal(result.environment.python,null);
    assert.match(result.responses.saved.raw.sha256,/^[a-f0-9]{64}$/);assert.match(result.responses.saved.request.sha256,/^[a-f0-9]{64}$/);
    assert.equal(result.responses.site.body.edition, 'personal');
    assert.equal(result.responses.health.body.export, false);
    assert.equal(result.responses.catalog.status, 422);
    assert.equal(result.responses.saved.status, 200);
    assert.equal(result.responses.list.body.length, 1);
    assert.equal(result.responses.deleted.body.ok, true);
    assert.equal(result.responses.afterDelete.body.length, 0);
    assert.equal(result.timings.saveMs.n, 2);
    assert.equal(result.timings.exportMs, null);
    assert.equal(result.browser.status, 'not_requested');
    assert.equal(result.isolation.database, 'temporary');
    assert.equal(existsSync(result.isolation.temporaryDirectory), false);
    assert.throws(() => process.kill(result.isolation.servicePid, 0), { code: 'ESRCH' });
    assert.equal(readFileSync(sentinel, 'utf8'), 'Do not open the real database.');
    assert.deepEqual(readdirSync(assets), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('an unavailable Python runtime cannot produce successful baseline evidence', () => {
  const dir = mkdtempSync(join(tmpdir(), 'letsduck-baseline-failure-'));
  try {
    const run = spawnSync(process.execPath, ['--import', 'tsx', 'tooling/src/baseline.ts', '--output', dir, '--engine','historical','--python', join(dir, 'absent-python')], { cwd: root, encoding: 'utf8', timeout: 15_000 });
    assert.notEqual(run.status, 0);
    assert.equal(existsSync(join(dir, 'baseline.json')), false);
    const reference=run.stdout.trim().split('\n').map(line=>JSON.parse(line)).find(entry=>entry.status==='historical_reference');
    assert.ok(reference);assert.equal(existsSync(reference.historicalDirectory),false);assert.equal(existsSync(reference.temporaryDirectory),false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the capture CLI freezes the actual 3MF, request and printable entry digests', () => {
  const dir = mkdtempSync(join(tmpdir(), 'letsduck-export-evidence-'));
  const assets = join(dir, 'assets'), output = join(dir, 'evidence'); mkdirSync(assets); writeSyntheticAssets(assets);
  try {
    const entry = process.env.BASELINE_ENTRY || 'tooling/src/baseline.ts';
    const run = spawnSync(process.execPath, ['--import', 'tsx', entry, '--repository', root, '--assets', assets, '--output', output, '--save-samples', '0', '--export-samples', '1'], { cwd: root, encoding: 'utf8', timeout: 20_000 });
    assert.equal(run.status, 0, run.stderr);
    const result = JSON.parse(readFileSync(join(output, 'baseline.json'), 'utf8'));
    assert.ok(result.export, 'The baseline omitted the actual export evidence');
    const archive = readFileSync(join(output, result.export.file)), contents = unzipSync(archive);
    assert.equal(result.export.sha256, createHash('sha256').update(archive).digest('hex'));
    assert.equal(result.export.status, 200);
    assert.equal(result.export.headers['content-type'], 'model/3mf');
    assert.ok(result.export.entries.some((entry: { name: string }) => entry.name === '3D/model.model'));
    assert.equal(JSON.parse(readFileSync(join(output, result.export.requestFile), 'utf8')).name, 'Baseline');
    assert.deepEqual(contents['3D/model.model'], unzipSync(readFileSync(join(assets, 'source.3mf')))['3D/model.model']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) test(`${signal} cancels collection and removes the owned service and database`, { skip: process.platform === 'win32' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'letsduck-interrupt-test-'));
  const assets = join(dir, 'assets'); mkdirSync(assets);
  const child = spawn(process.execPath, ['--import', 'tsx', 'tooling/src/baseline.ts', '--assets', assets, '--output', join(dir, 'evidence'), '--save-samples', '1000', '--export-samples', '0'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  let owned: { servicePid: number; temporaryDirectory: string } | undefined;
  try {
    owned = await new Promise((ok, no) => {
      let output = '';
      const timer = setTimeout(() => no(new Error('The collector did not report ownership before sampling')), 5000);
      child.stdout.on('data', chunk => {
        output += String(chunk);
        for (const line of output.trim().split('\n')) {
          try { const entry = JSON.parse(line); if (entry.status === 'collecting') { clearTimeout(timer); ok(entry); } } catch { /* A chunk can end mid-line. */ }
        }
      });
      child.once('exit', () => { clearTimeout(timer); no(new Error('Collector finished before reporting resource ownership')); });
    });
    assert.ok(owned);
    const exited = once(child, 'exit'); child.kill(signal); await exited;
    assert.throws(() => process.kill(owned!.servicePid, 0), { code: 'ESRCH' });
    assert.equal(existsSync(owned.temporaryDirectory), false);
    assert.equal(existsSync(join(dir, 'evidence/baseline.json')), false);
  } finally {
    if (child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill('SIGKILL'); await exited; }
    if (owned) {
      try { process.kill(owned.servicePid, 'SIGINT'); } catch { /* The assertion checks successful cleanup. */ }
      rmSync(owned.temporaryDirectory, { recursive: true, force: true });
    }
    rmSync(dir, { recursive: true, force: true });
  }
});


test('default baseline captures with a Node-only PATH and labels its actual engine', () => {
  const dir = mkdtempSync(join(tmpdir(), 'letsduck-baseline-node-only-')), assets=join(dir,'assets'), output=join(dir,'evidence'),bin=join(dir,'bin');
  mkdirSync(assets);mkdirSync(bin);
  const locate=(name:string)=>{const path=(process.env.PATH??'').split(delimiter).map(folder=>join(folder,name)).find(existsSync);if(!path)throw Error('Missing baseline prerequisite '+name);return path;};
  for(const name of ['git','ps'])symlinkSync(locate(name),join(bin,name));
  symlinkSync(process.execPath,join(bin,'node'));
  try{
    const run=spawnSync(process.execPath,['--import','tsx','tooling/src/baseline.ts','--assets',assets,'--output',output,'--save-samples','1','--export-samples','0'],{cwd:root,encoding:'utf8',timeout:30000,env:{...process.env,PATH:bin,PYTHON:join(dir,'absent-python')}});
    assert.equal(run.status,0,run.stderr);
    const result=JSON.parse(readFileSync(join(output,'baseline.json'),'utf8'));
    assert.equal(result.engine.kind,'node');assert.equal(result.environment.python,null);
    assert.equal(result.responses.saved.status,200);assert.equal(result.timings.saveMs.n,1);
    assert.equal(existsSync(result.isolation.temporaryDirectory),false);
    assert.throws(()=>process.kill(result.isolation.servicePid,0),{code:'ESRCH'});
  }finally{rmSync(dir,{recursive:true,force:true});}
});


for(const signal of ['SIGINT','SIGTERM'] as const)test(`${signal} closes the actual managed Chromium and owned Node host during browser collection`,{skip:process.platform==='win32'?'POSIX signal ownership check':process.env.DUCK_TEST_BROWSER!=='1'?'Set DUCK_TEST_BROWSER=1 for managed browser lifecycle checks':false},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'letsduck-baseline-browser-')),assets=join(dir,'assets');mkdirSync(assets);
 const child=spawn(process.execPath,['--import','tsx','tooling/src/baseline.ts','--assets',assets,'--output',join(dir,'evidence'),'--save-samples','0','--export-samples','0','--browser'],{cwd:root,stdio:['ignore','pipe','pipe','ipc']});
 const exited=once(child,'exit');let stderr='';child.stderr?.on('data',chunk=>{stderr+=String(chunk);});
 let owned:{servicePid:number;temporaryDirectory:string;processIds:number[]}|undefined;
 try{
  owned=await new Promise<NonNullable<typeof owned>>((done,reject)=>{const timer=setTimeout(()=>reject(new Error('Managed Chromium ownership was not reported: '+stderr)),15000);child.once('exit',()=>{clearTimeout(timer);reject(new Error('Collector exited before browser ownership: '+stderr));});child.on('message',(message:unknown)=>{if(!message||typeof message!=='object'||!('status'in message)||message.status!=='browser_acquired'||!('servicePid'in message)||typeof message.servicePid!=='number'||!('temporaryDirectory'in message)||typeof message.temporaryDirectory!=='string'||!('processIds'in message)||!Array.isArray(message.processIds)||!message.processIds.every(pid=>typeof pid==='number'))return;clearTimeout(timer);done({servicePid:message.servicePid,temporaryDirectory:message.temporaryDirectory,processIds:message.processIds.map(pid=>Number(pid))});});});
  assert.ok(owned.processIds.length>0);child.kill(signal);await exited;
  assert.throws(()=>process.kill(owned!.servicePid,0),{code:'ESRCH'});
  for(const pid of owned.processIds)assert.throws(()=>process.kill(pid,0),{code:'ESRCH'});
  assert.equal(existsSync(owned.temporaryDirectory),false);assert.equal(existsSync(join(dir,'evidence/baseline.json')),false);
 }finally{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await exited;}if(owned){try{process.kill(owned.servicePid,'SIGINT');}catch{}rmSync(owned.temporaryDirectory,{recursive:true,force:true});}rmSync(dir,{recursive:true,force:true});}
});

// Exercise the real worker boundary with the production dist directory layout.
test('Node baseline enables complete assembly assets from the repository manifest with frontend/dist',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'letsduck-baseline-assembly-')),assets=join(dir,'assets'),frontend=join(dir,'frontend/dist'),database=join(dir,'personal.db');
 mkdirSync(join(assets,'assembly'),{recursive:true});mkdirSync(join(frontend,'assemble'),{recursive:true});mkdirSync(join(dir,'scripts'));
 const payload=Buffer.from('{"fixture":"reviewed assembly"}');writeFileSync(join(assets,'assembly/full-assembly.json'),payload);writeFileSync(join(assets,'assembly/not-reviewed.json'),'private fixture');writeFileSync(join(frontend,'assemble/index.html'),'<!doctype html><title>Assembly fixture</title>');
 writeFileSync(join(dir,'scripts/assembly-assets.json'),JSON.stringify({files:{'full-assembly.json':{bytes:payload.length,sha256:createHash('sha256').update(payload).digest('hex')}}}));
 mkdirSync(join(dir,'packages/host/src'),{recursive:true});writeFileSync(join(dir,'packages/host/src/index.ts'),'export {startHost,loadAssemblyManifest} from '+JSON.stringify(new URL('../../packages/host/src/index.ts',import.meta.url).href)+';\n');symlinkSync(join(root,'node_modules'),join(dir,'node_modules'),'dir');
 const child=spawn(process.execPath,['--import','tsx',join(root,'tooling/src/baseline.ts')],{cwd:dir,stdio:['ignore','pipe','pipe'],env:{...process.env,DUCK_BASELINE_WORKER:'node',DUCK_BASELINE_REPOSITORY:dir,DUCK_BASELINE_FRONTEND:frontend,DUCK_ASSETS:assets,DUCK_PERSONAL_DB:database,DUCK_DB:join(dir,'absent-legacy.db')}});
 let stderr='';child.stderr.on('data',(data:Buffer)=>{stderr+=data.toString();});
 let url:string|undefined;
 try{
  url=await new Promise<string>((done,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Owned baseline host startup timeout: '+stderr)),15000);child.stdout.on('data',(data:Buffer)=>{output+=data.toString();const found=output.match(/http:\/\/127\.0\.0\.1:\d+\//);if(found){clearTimeout(timer);done(found[0]);}});child.once('exit',code=>{clearTimeout(timer);reject(Error('Owned host exited '+code+': '+stderr));});child.once('error',error=>{clearTimeout(timer);reject(error);});});
  assert.notEqual(new URL(url).port,'8876');const site:unknown=await(await fetch(url+'api/site')).json();assert.ok(site&&typeof site==='object'&&'assembly'in site);assert.equal(site.assembly,true);
  const assembly=await fetch(url+'assemble/assets/full-assembly.json');assert.equal(assembly.status,200);assert.deepEqual(Buffer.from(await assembly.arrayBuffer()),payload);
  assert.equal((await fetch(url+'assemble/assets/not-reviewed.json')).status,404);
 }finally{
  if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill('SIGINT');await exited;}
  assert.throws(()=>process.kill(child.pid!,0),{code:'ESRCH'});if(url)await assert.rejects(fetch(url));rmSync(dir,{recursive:true,force:true});
 }
});

test('baseline records modified Node inputs and nested untracked files while excluding ignored data',()=>{
 const dir=mkdtempSync(join(tmpdir(),'letsduck-baseline-source-state-')),assets=join(dir,'assets'),output=join(dir,'evidence');mkdirSync(assets);
 const git=(...args:string[])=>{const result=spawnSync('git',args,{cwd:dir,encoding:'utf8'});assert.equal(result.status,0,result.stderr);return result.stdout;};
 try{
  mkdirSync(join(dir,'packages/host/src'),{recursive:true});mkdirSync(join(dir,'apps/local/src'),{recursive:true});mkdirSync(join(dir,'tooling/src'),{recursive:true});
  writeFileSync(join(dir,'packages/host/src/index.ts'),'export {startHost,loadAssemblyManifest} from '+JSON.stringify(new URL('../../packages/host/src/index.ts',import.meta.url).href)+';\n');
  for(const file of ['packages/host/src/input.ts','apps/local/src/input.ts','tooling/src/input.ts'])writeFileSync(join(dir,file),'// committed fixture\n');
  writeFileSync(join(dir,'.gitignore'),'assets/\nevidence/\nnode_modules/\nignored/\n');symlinkSync(join(root,'node_modules'),join(dir,'node_modules'),'dir');
  git('init','--quiet');git('config','user.name','Baseline fixture');git('config','user.email','baseline@example.invalid');git('add','.');git('commit','--no-gpg-sign','--quiet','-m','baseline input fixture');
  for(const file of ['packages/host/src/input.ts','apps/local/src/input.ts','tooling/src/input.ts'])writeFileSync(join(dir,file),'// changed fixture\n');
  mkdirSync(join(dir,'new/nested'),{recursive:true});writeFileSync(join(dir,'new/nested/a.ts'),'// new input\n');writeFileSync(join(dir,'new/nested/b.ts'),'// second new input\n');mkdirSync(join(dir,'ignored'));writeFileSync(join(dir,'ignored/private.db'),'ignored fixture');git('config','status.showUntrackedFiles','no');
  const run=spawnSync(process.execPath,['--import','tsx',join(root,'tooling/src/baseline.ts'),'--repository',dir,'--assets',assets,'--output',output,'--save-samples','0','--export-samples','0'],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);
  const result:unknown=JSON.parse(readFileSync(join(output,'baseline.json'),'utf8'));assert.ok(result&&typeof result==='object'&&'sourceChanges'in result&&typeof result.sourceChanges==='string');
  const lines=result.sourceChanges.split('\n');for(const file of ['packages/host/src/input.ts','apps/local/src/input.ts','tooling/src/input.ts'])assert.ok(lines.includes(' M '+file),file+' modification missing from source evidence');
  for(const file of ['new/nested/a.ts','new/nested/b.ts'])assert.ok(lines.includes('?? '+file),file+' untracked input missing');assert.equal(result.sourceChanges.includes('ignored/'),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
