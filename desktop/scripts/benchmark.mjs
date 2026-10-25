import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { readFile, writeFile, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir, platform, arch, cpus, totalmem } from 'node:os';
import { PNG } from 'pngjs';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '../..'), assets = resolve(process.env.DUCK_REAL_ASSETS || join(root, 'assets')), temp = await mkdtemp(join(tmpdir(), 'duck-benchmark-'));
const model = JSON.parse(await readFile(join(assets, 'model.json'), 'utf8')), catalog = JSON.parse(await readFile(join(assets, 'catalog.json'), 'utf8'));
const design = { colors: Object.fromEntries(model.parts.map(p => [p.id, p.color])), assignments: Object.fromEntries(model.parts.map(p => [p.id, catalog.products.find(x => x.series === p.material && x.hex === p.color).id])) };
const png = PNG.sync.write(new PNG({ width: 512, height: 512 }));
const payload = { name: '性能比较', source_sha256: model.source_sha256, assignments: design.assignments, thumbnails: Object.fromEntries(['cover', ...Array.from({ length: 6 }, (_, i) => [`plate${i + 1}`, `top${i + 1}`]).flat()].map(n => [n, 'data:image/png;base64,' + png.toString('base64')])) };
const children = [], services = {}; let browser;
const summarize = values => { const x = [...values].sort((a, b) => a - b); return { n: x.length, median: x[Math.floor(x.length / 2)], p95: x[Math.ceil(x.length * .95) - 1], min: x[0], max: x.at(-1) }; };
const rows = { environment: { platform: platform(), arch: arch(), node: process.version, python: execFileSync(process.env.PYTHON || 'python3', ['--version'], { encoding: 'utf8' }).trim(), cpu: cpus()[0].model, memoryBytes: totalmem() }, scope: 'Same licensed model and requests; fresh disposable databases; export previews are identical synthetic PNGs. Browser cold means fresh browser cache, not flushed OS cache.', backend: {}, browser: {} };
async function start(name) {
  const command = name === 'python' ? process.env.PYTHON || 'python3' : process.execPath;
  const args = name === 'python' ? ['-u', join(root, 'personal/app.py'), '--port', '0', '--no-open'] : [join(root, 'desktop/dist/host.js')];
  const child = spawn(command, args, { cwd: root, env: { ...process.env, DUCK_ASSETS: assets, DUCK_PERSONAL_DB: join(temp, name + '.db'), DUCK_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] }); children.push(child);
  let log = ''; child.stderr.on('data', data => { log += data; });
  const url = await new Promise((ok, no) => { const timer = setTimeout(() => no(Error('Service did not start: ' + log)), 15000); child.stdout.on('data', data => { const found = String(data).match(/http:\/\/127\.0\.0\.1:\d+/); if (found) { clearTimeout(timer); ok(found[0]); } }); child.once('exit', code => { clearTimeout(timer); no(Error(`${name} exited (${code}): ${log}`)); }); });
  services[name] = { child, url };
}
async function post(url, body, method = 'POST') { const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!response.ok) throw Error(await response.text()); await response.arrayBuffer(); }
try {
  await start('python'); await start('node');
  const samples = { python: { save: [], export: [] }, node: { save: [], export: [] } };
  for (const name of ['python', 'node']) { await post(services[name].url + '/api/schemes/benchmark', { name: '预热', design }, 'PUT'); await post(services[name].url + '/api/export', payload); }
  for (let i = 0; i < 30; i++) for (const name of i % 2 ? ['node', 'python'] : ['python', 'node']) { const t = performance.now(); await post(services[name].url + '/api/schemes/benchmark', { name: '同一方案', design }, 'PUT'); samples[name].save.push(performance.now() - t); }
  for (let i = 0; i < 10; i++) for (const name of i % 2 ? ['node', 'python'] : ['python', 'node']) { const t = performance.now(); await post(services[name].url + '/api/export', payload); samples[name].export.push(performance.now() - t); }
  for (const name of ['python', 'node']) rows.backend[name] = { saveMs: summarize(samples[name].save), exportMs: summarize(samples[name].export), rssKiB: platform() === 'darwin' ? Number(execFileSync('ps', ['-o', 'rss=', '-p', String(services[name].child.pid)], { encoding: 'utf8' }).trim()) : null };
  console.log(JSON.stringify({ phase: 'backend', result: rows.backend }));
  if (process.env.DUCK_BROWSER_BENCH === '1') {
    const samples = { python: { cold: [], warm: [], frames: [] }, node: { cold: [], warm: [], frames: [] } };
    for (let i = 0; i < 10; i++) for (const name of i % 2 ? ['node', 'python'] : ['python', 'node']) {
      browser = await chromium.launch({ headless: false }); rows.environment.chromium = browser.version();
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      for (const cache of ['cold', 'warm']) { const t = performance.now(); await page.goto(services[name].url + '/paint'); await page.waitForFunction(() => window.studioProto?.state); await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); samples[name][cache].push(performance.now() - t); }
      if (i < 3) {
        const intervals = await page.evaluate(async () => { studioProto.view.setTurntable(true); await new Promise(ok => setTimeout(ok, 1000)); return new Promise(resolve => { const rows = []; let previous = 0, start = 0; const frame = t => { start ||= t; if (previous) rows.push(t - previous); previous = t; if (t - start < 30000) requestAnimationFrame(frame); else resolve(rows); }; requestAnimationFrame(frame); }); });
        samples[name].frames.push(summarize(intervals));
      }
      await browser.close(); browser = undefined; console.log(JSON.stringify({ phase: 'browser', round: i + 1, name }));
    }
    for (const name of ['python', 'node']) rows.browser[name] = { coldMs: summarize(samples[name].cold), warmMs: summarize(samples[name].warm), frameIntervalMs: samples[name].frames };
  }
  const output = join(root, 'output/desktop-benchmark'); await mkdir(output, { recursive: true }); await writeFile(join(output, 'comparison.json'), JSON.stringify(rows, null, 2)); console.log(JSON.stringify(rows));
} finally {
  if (browser) await browser.close();
  for (const child of children) { if (child.exitCode === null) { const done = once(child, 'exit'); child.kill('SIGINT'); await done; } assert.ok(child.exitCode !== null || child.signalCode !== null); }
  await rm(temp, { recursive: true, force: true });
}
