/** Private migration evidence. Starts its own isolated service; never accepts a live service URL. */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile, stat } from 'node:fs/promises';
import { arch, cpus, platform, tmpdir, totalmem } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { PNG } from 'pngjs';
import { chromium, type Browser } from 'playwright';
import type { SiteConfig } from '@letsduck/contracts';
import { loadAssemblyManifest, type HostOptions } from '@letsduck/host';
import type { DuckRuntime } from '@letsduck/devices';
import { jsonParse,jsonStringify } from '@letsduck/storage';
import {prepareHistoricalSource} from './historical-source.js';
import { describeExport } from './zip-evidence.js';

export async function captureBaseline(){
const { values } = parseArgs({ options: {
  engine: {type:'string',default:'node'}, revision:{type:'string'}, repository: { type: 'string' }, assets: { type: 'string' }, output: { type: 'string' }, python: { type: 'string' },
  'save-samples': { type: 'string', default: '30' }, 'export-samples': { type: 'string', default: '10' }, browser: { type: 'boolean', default: false },
} });
if(values.engine!=='node'&&values.engine!=='historical')throw new Error('--engine must be node or historical');
if(values.engine==='node'&&(values.python!==undefined||values.revision!==undefined))throw new Error('--python and --revision require --engine historical');
const engine=values.engine;
const root = resolve(values.repository || resolve(import.meta.dirname, '../..'));
const assets = resolve(values.assets || join(root, 'assets'));
if (!values.output) throw new Error('--output must name a private evidence directory');
const output = resolve(values.output);
const localPython = join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const python = values.python || process.env.PYTHON || (existsSync(localPython) ? localPython : 'python3');
const saveSamples = sampleCount(values['save-samples']!), exportSamples = sampleCount(values['export-samples']!);

function sampleCount(value: string) {
  if (!/^\d+$/.test(value) || Number(value) > 1000) throw new Error('Sample counts must be integers from 0 to 1000');
  return Number(value);
}
function command(binary: string, args: string[]) {
  const result = spawnSync(binary, args, { cwd: root, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${binary} exited ${result.status}: ${result.stderr}`);
  return result.stdout.trimEnd();
}
function summary(samples: number[]) {
  if (!samples.length) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  return { n: sorted.length, median: sorted[Math.floor(sorted.length / 2)]!, p95: sorted[Math.ceil(sorted.length * .95) - 1]!, min: sorted[0]!, max: sorted.at(-1)! };
}
async function stop(child: ChildProcess) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill('SIGINT');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  try { await exited; } finally { clearTimeout(timer); }
}
const sha = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'letsduck-baseline-'));
let child: ChildProcess | undefined, browser: Browser | undefined;
let browserAcquisition: Promise<Browser> | undefined;
let historical:Awaited<ReturnType<typeof prepareHistoricalSource>>|undefined,historicalAcquisition:Promise<Awaited<ReturnType<typeof prepareHistoricalSource>>>|undefined;
let cleanupPromise: Promise<void> | undefined;
const cleanup = () => cleanupPromise ??= (async () => {
  try {
    const ownedBrowser = browser ?? await browserAcquisition;
    if (ownedBrowser?.isConnected()) await ownedBrowser.close();
  }
  finally {
    try { if (child) await stop(child); }
    finally { try{await rm(temporaryDirectory, { recursive: true, force: true });}finally{const reference=historical??await historicalAcquisition;await reference?.cleanup();} }
  }
})();
const cancellation = new AbortController();
const cancel = (code: number) => {
  cancellation.abort();
  void cleanup().then(() => process.exit(code), error => { console.error(error); process.exit(1); });
};
const interrupt = () => cancel(130), terminate = () => cancel(143);
process.once('SIGINT', interrupt); process.once('SIGTERM', terminate);
try {
  let pythonVersion:string|null=null;
  const currentCommit=command('git',['rev-parse','HEAD']);
  if(engine==='historical'){
    historicalAcquisition=prepareHistoricalSource({repository:root,...(values.revision===undefined?{}:{revision:values.revision})});
    historical=await historicalAcquisition;
    console.log(JSON.stringify({status:'historical_reference',revision:historical.revision,historicalDirectory:historical.root,temporaryDirectory}));
    cancellation.signal.throwIfAborted();
    pythonVersion=command(python,['--version']);
  }
  const commit=historical?.revision??currentCommit,serviceRoot=historical?.root??root;
  cancellation.signal.throwIfAborted();
  child = engine==='historical'?spawn(python,['-u',join(serviceRoot,'personal/app.py'),'--host','127.0.0.1','--port','0','--no-open'],{
    cwd:serviceRoot,env:{...process.env,DUCK_ASSETS:assets,DUCK_PERSONAL_DB:join(temporaryDirectory,'personal.db'),DUCK_DB:join(temporaryDirectory,'absent-legacy.db'),DUCK_LEGACY_DB:join(temporaryDirectory,'absent-legacy.db')},stdio:['ignore','pipe','pipe'],
  }):spawn(process.execPath,['--import','tsx',fileURLToPath(import.meta.url)],{
    cwd:root,env:{...process.env,DUCK_BASELINE_WORKER:'node',DUCK_BASELINE_REPOSITORY:root,DUCK_BASELINE_FRONTEND:join(root,'frontend/dist'),DUCK_ASSETS:assets,DUCK_PERSONAL_DB:join(temporaryDirectory,'personal.db'),DUCK_DB:join(temporaryDirectory,'absent-legacy.db'),DUCK_LEGACY_DB:join(temporaryDirectory,'absent-legacy.db')},stdio:['ignore','pipe','pipe'],
  });
  let log = '';
  child.stderr?.on('data', chunk => { log += String(chunk); });
  const url = await new Promise<string>((ok, no) => {
    const timer = setTimeout(() => no(new Error(`Isolated ${engine} service did not start: ` + log)), 15_000);
    const finish = (value?: string, error?: Error) => { clearTimeout(timer); error ? no(error) : ok(value!); };
    child!.stdout?.on('data', chunk => { log += String(chunk); const found = /http:\/\/127\.0\.0\.1:(\d+)\//.exec(log); if (found) finish(`http://127.0.0.1:${found[1]}`); });
    child!.once('error', error => finish(undefined, error));
    child!.once('exit', code => finish(undefined, new Error(`Legacy service exited ${code}: ${log}`)));
  });
  if (new URL(url).port === '8876') throw new Error('Baseline must not use the stable service port');
  console.log(JSON.stringify({ status: 'collecting', engine,servicePid: child.pid, temporaryDirectory,...(historical?{historicalDirectory:historical.root}:{} ) }));
  const request = async (path: string, method = 'GET', body?: unknown) => {
    const response = await fetch(url + path, { method, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: jsonStringify(body) }), redirect: 'manual', signal: cancellation.signal });
    const bytes = Buffer.from(await response.arrayBuffer()), text = bytes.toString();
    let data: unknown;
    try { data = jsonParse(text); } catch { data = { bytes: bytes.length, sha256: sha(bytes) }; }
    return { raw:{bytes:bytes.length,sha256:sha(bytes)},request:{path,method,...(body===undefined?{}:{bytes:Buffer.byteLength(jsonStringify(body)),sha256:sha(Buffer.from(jsonStringify(body)))})},status: response.status, headers: Object.fromEntries(['content-type', 'cache-control', 'location', 'retry-after'].flatMap(key => response.headers.has(key) ? [[key, response.headers.get(key)!]] : [])), body: data };
  };
  const health = await request('/api/health'), site = await request('/api/site'), catalog = await request('/api/catalog');
  if (!site.body || typeof site.body !== 'object' || !('edition' in site.body) || site.body.edition !== 'personal') throw new Error('Expected the personal edition');
  const configuration=personalSite(site.body);
  const modelFile = join(assets, 'model.json');
  let design: { colors: Record<string, string>; assignments: Record<string, string | null> } = { colors: { baseline: '#AABBCC' }, assignments: { baseline: null } };
  let payload: unknown;
  if (existsSync(modelFile)) {
    const model=baselineModel(jsonParse(await readFile(modelFile,'utf8')));
    const base=baselineCatalog(jsonParse(await readFile(join(assets,'catalog.json'),'utf8')));
    const assignments = Object.fromEntries(model.parts.map(part => {
      const product = base.products.find(product => product.series === part.material && product.hex.toUpperCase() === part.color.toUpperCase());
      if (!product) throw new Error(`No original material for ${part.id}`);
      return [part.id, product.id];
    }));
    design = { colors: Object.fromEntries(model.parts.map(part => [part.id, part.color])), assignments };
    const image = 'data:image/png;base64,' + PNG.sync.write(new PNG({ width: 512, height: 512 })).toString('base64');
    payload = { name: 'Baseline', source_sha256: model.source_sha256, assignments, thumbnails: Object.fromEntries(['cover', ...Array.from({ length: 6 }, (_, index) => [`plate${index + 1}`, `top${index + 1}`]).flat()].map(name => [name, image])) };
  }
  const saved = await request('/api/schemes/baseline', 'PUT', { name: 'Baseline', design });
  if (saved.status !== 200) throw new Error('Isolated scheme save failed: ' + JSON.stringify(saved));
  const list = await request('/api/schemes');
  const saves: number[] = [], exports: number[] = [];
  for (let index = 0; index < saveSamples; index++) {
    const start = performance.now(), response = await request('/api/schemes/baseline', 'PUT', { name: 'Baseline', design });
    if (response.status !== 200) throw new Error('Scheme benchmark failed');
    saves.push(performance.now() - start);
  }
  let plan: unknown = null;
  let exportContent: Buffer | undefined;
  let exportEvidence: (ReturnType<typeof describeExport> & { file: string; requestFile: string; status: number; headers: Record<string, string> }) | null = null;
  if (payload && exportSamples) {
    plan = await request('/api/plan', 'POST', payload);
    // One warmup is separate from measured samples.
    for (let index = -1; index < exportSamples; index++) {
      const start = performance.now(), response = await fetch(url + '/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: jsonStringify(payload), signal: cancellation.signal });
      if (!response.ok) throw new Error('Export benchmark failed: ' + await response.text());
      const content = Buffer.from(await response.arrayBuffer()); if (index >= 0) exports.push(performance.now() - start);
      if (index === -1) {
        exportContent = content;
        exportEvidence = { ...describeExport(content), file: 'export.3mf', requestFile: 'export-request.json', status: response.status, headers: Object.fromEntries(response.headers) };
      }
    }
  }
  const deleted = await request('/api/schemes/baseline', 'DELETE'), afterDelete = await request('/api/schemes');
  const assetDigests: Record<string, { bytes: number; sha256: string }> = {};
  for (const name of ['source.3mf', 'model.json', 'catalog.json', 'export-schema.json', 'geometry.bin', 'geometry.pack.bin', 'geometry.positions.bin', 'filament-catalog.json', 'filament-profiles.json']) {
    const path = join(assets, name); if (existsSync(path)) { const bytes = await readFile(path); assetDigests[name] = { bytes: (await stat(path)).size, sha256: sha(bytes) }; }
  }
  let browserResult: unknown = { status: 'not_requested' };
  if (values.browser) {
    cancellation.signal.throwIfAborted();
    browserAcquisition = chromium.launch({ headless: true, handleSIGINT:false,handleSIGTERM:false,args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    browser = await browserAcquisition;
    const inspector = await browser.newBrowserCDPSession();
    const processes: { processInfo: { id: number; type: string }[] } = await inspector.send('SystemInfo.getProcessInfo');
    await inspector.detach();
    const processIds = processes.processInfo.map(process => process.id);
    process.send?.({status:'browser_acquired',servicePid:child.pid,temporaryDirectory,processIds});
    const paintMs: number[] = [], homeMs: number[] = [];
    for (let round = 0; round < 3; round++) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      try {
        // The homepage polls these routes. The baseline must never contact real USB hardware.
        await context.route(/\/api\/(duck-debug|servo-setup|servo-preparation)(\/|$)/, route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Hardware blocked in benchmark"}' }));
        const page = await context.newPage();
        let start = performance.now(); await page.goto(url + '/'); await page.waitForSelector('body[data-home-ready="true"]'); homeMs.push(performance.now() - start);
        start = performance.now(); await page.goto(url + '/paint'); await page.waitForFunction(() => 'studioProto' in window);
        await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
        paintMs.push(performance.now() - start);
      } finally { await context.close(); }
    }
    browserResult = { status: 'passed', chromium: browser.version(), hardware: 'blocked', processIds, processesExited: true, scope: 'fresh contexts; OS file cache retained; software WebGL; paint follows home in each context', homeMs: summary(homeMs), paintMs: summary(paintMs) };
    await browser.close(); browser = undefined;
    for (const pid of processIds) {
      try { process.kill(pid, 0); } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ESRCH') continue;
        throw error;
      }
      throw new Error(`Owned Chromium process ${pid} did not exit`);
    }
  }
  const rss = process.platform === 'win32' ? null : Number(command('ps', ['-o', 'rss=', '-p', String(child.pid)]));
  const result = {
    schema: 'letsduck-baseline/1', capturedAt: new Date().toISOString(), sourceCommit: commit,
    sourceChanges: historical?'':command('git', ['status', '--porcelain', '--untracked-files=all']),
    engine:{kind:engine,language:engine==='node'?'typescript':'python',sourceCommit:commit,...(historical?{historicalDirectory:historical.root}:{}),reference:historical?'immutable Git archive':'working tree'},
    environment: { node: process.version, python: pythonVersion, platform: platform(), arch: arch(), cpu: cpus()[0]?.model, memoryBytes: totalmem() },
    isolation: { database: 'temporary', temporaryDirectory, servicePid: child.pid, hardware: 'not_contacted' },
    site: configuration, assets: assetDigests, responses: { health, site, catalog, saved, list, deleted, afterDelete, plan },
    timings: { saveMs: summary(saves), exportMs: summary(exports), serviceRssKiB: rss, scope: 'same original assignments and transparent 512px PNG previews; export warmed once' }, browser: browserResult, export: exportEvidence,
  };
  // Close everything before successful evidence is written.
  await cleanup(); child = undefined;
  await mkdir(output, { recursive: true });
  if (exportContent) {
    await writeFile(join(output, 'export.3mf'), exportContent);
    await writeFile(join(output, 'export-request.json'), jsonStringify(payload) + '\n');
  }
  await writeFile(join(output, 'baseline.json'), jsonStringify(result) + '\n');
  console.log(JSON.stringify({ status: 'captured', sourceCommit: commit, saveSamples: saves.length, exportSamples: exports.length, browser: values.browser }));
} finally {
  await cleanup();
  process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', terminate);
  if(process.connected)process.disconnect();
}

}

function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Expected baseline object');return value as Record<string,unknown>;}
function text(value:unknown):string{if(typeof value!=='string')throw new Error('Expected baseline text');return value;}
function personalSite(value:unknown):SiteConfig{const r=object(value);if(r.edition!=='personal'||typeof r.assembly!=='boolean'||typeof r.servoSetup!=='boolean'||typeof r.servoPreparation!=='boolean')throw new Error('Expected personal site configuration');return{edition:'personal',publicUrl:text(r.publicUrl),assembly:r.assembly,servoSetup:r.servoSetup,servoPreparation:r.servoPreparation};}
function baselineModel(value:unknown){const r=object(value);if(!Array.isArray(r.parts))throw new Error('Expected model parts');return{source_sha256:text(r.source_sha256),parts:r.parts.map(v=>{const p=object(v);return{id:text(p.id),color:text(p.color),material:text(p.material)};})};}
function baselineCatalog(value:unknown){const r=object(value);if(!Array.isArray(r.products))throw new Error('Expected catalog products');return{products:r.products.map(v=>{const p=object(v);return{id:text(p.id),series:text(p.series),hex:text(p.hex)};})};}

async function serveNodeBaseline(){
 const root=process.env.DUCK_BASELINE_REPOSITORY,assets=process.env.DUCK_ASSETS,database=process.env.DUCK_PERSONAL_DB,legacy=process.env.DUCK_DB,frontend=process.env.DUCK_BASELINE_FRONTEND;
 if(!root||!assets||!database||!legacy||!frontend)throw new Error('Missing owned baseline paths');
 const runtime:DuckRuntime={serial:null,port:null,async connect(){throw new Error('Hardware disabled in baseline');},async request(){throw new Error('Hardware disabled in baseline');},async halt(){throw new Error('Hardware disabled in baseline');},async close(){}};
 const module:unknown=await import(pathToFileURL(join(root,'packages/host/src/index.ts')).href),start=object(module).startHost;
 if(typeof start!=='function')throw new Error('Node local host factory unavailable');
 const assemblyManifest=loadAssemblyManifest(join(root,'scripts/assembly-assets.json'));
 const options:HostOptions={assets,frontend,database,legacy,runtime,host:'127.0.0.1',port:0,...(assemblyManifest===undefined?{}:{assemblyManifest})},value:unknown=await start(options),host=object(value),url=host.url,close=host.close;
 if(typeof url!=='string'||typeof close!=='function')throw new Error('Node local host did not return a listener');
 let stopping:Promise<void>|undefined;const stop=()=>{stopping??=(async()=>{await close();})();void stopping.catch(error=>{console.error(error);process.exitCode=1;});};
 process.once('SIGINT',stop);process.once('SIGTERM',stop);console.log(url);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.env.DUCK_BASELINE_WORKER==='node')await serveNodeBaseline();else await captureBaseline();
}
