import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

type ReleaseConfig = { publish: { url: string; channel?: string } | null; version?: string };
const desktop = resolve(import.meta.dirname, '..');
function publishConfig(value: unknown): ReleaseConfig['publish'] {
  if (value === null) return null;
  if (typeof value !== 'object' || !('url' in value) || typeof value.url !== 'string') throw new TypeError('Invalid publish configuration shape');
  const channel = 'channel' in value ? value.channel : undefined;
  if (channel !== undefined && typeof channel !== 'string') throw new TypeError('Invalid publish channel shape');
  return { url: value.url, ...(channel === undefined ? {} : { channel }) };
}
function config(env: Record<string, string> = {}, target = '--win'): ReleaseConfig {
  const raw: unknown = JSON.parse(execFileSync(process.execPath, ['-e', `const c = require('./dist-config/electron-builder.cjs'); console.log(JSON.stringify({ publish: c.publish, version: c.extraMetadata?.version }));`, '--', target], {
    cwd: desktop, encoding: 'utf8', env: { ...process.env, CSC_NAME: '', CSC_LINK: '', DUCK_UPDATE_BASE: '', DUCK_UPDATE_URL: '', DUCK_UPDATE_REPOSITORY: '', DUCK_RELEASE_VERSION: '', DUCK_BUILD_ARCH: target==='--mac'?'arm64':'x64', ...env }, stdio: ['ignore', 'pipe', 'pipe'],
  }));
  if (typeof raw !== 'object' || raw === null || !('publish' in raw)) throw new TypeError('Missing publish configuration');
  const publish = publishConfig(raw.publish);
  if ('version' in raw && typeof raw.version !== 'string') throw new TypeError('Invalid release version shape');
  return {
    publish,
    ...('version' in raw && typeof raw.version === 'string' ? { version: raw.version } : {}),
  };
}

test('release builds embed anonymous per-platform GitHub feeds and the exact installed version', () => {
  const c = config({ DUCK_UPDATE_REPOSITORY: '1850VV/letsduck-releases', DUCK_RELEASE_VERSION: '0.1.0-beta.2' });
  assert.equal(c.publish?.url, 'https://github.com/1850VV/letsduck-releases/releases/download/beta-win32-x64/');
  assert.equal(c.publish?.channel, 'beta');
  assert.equal(c.version, '0.1.0-beta.2');
  const mac = config({ DUCK_UPDATE_REPOSITORY: '1850VV/letsduck-releases', DUCK_RELEASE_VERSION: '1.0.0', DUCK_BUILD_ARCH: 'arm64', CSC_NAME: 'Developer ID Application: Test' }, '--mac');
  assert.ok(mac.publish);
  assert.equal(mac.publish.url, 'https://github.com/1850VV/letsduck-releases/releases/download/stable-darwin-arm64/');
  assert.equal(mac.publish.channel, 'latest');
});

test('ad-hoc Mac packages cannot advertise an unverified automatic install channel', () => {
  for (const CSC_NAME of ['', '-']) assert.throws(() => config({ DUCK_UPDATE_REPOSITORY: '1850VV/letsduck-releases', CSC_NAME }, '--mac'), /Mac update builds require/);
  assert.equal(config({}, '--mac').publish, null);
});

test('a release version or repository typo cannot silently produce a wrong update channel', () => {
  for (const DUCK_RELEASE_VERSION of ['next', '1.0.0-alpha.1', '0.1.0-beta.02']) assert.throws(() => config({ DUCK_RELEASE_VERSION }));
  for (const DUCK_UPDATE_REPOSITORY of ['https://github.com/owner/repo', 'owner/repo?token=private', 'owner/repo/extra']) assert.throws(() => config({ DUCK_UPDATE_REPOSITORY }));
});

test('ordinary development packages remain offline; an explicit feed takes precedence', () => {
  assert.equal(config().publish, null);
  const c = config({ DUCK_UPDATE_URL: 'https://downloads.example.com/beta/', DUCK_UPDATE_REPOSITORY: '1850VV/letsduck-releases' });
  assert.equal(c.publish?.url, 'https://downloads.example.com/beta/');
});

test('retired Intel Mac installer is refused even without an update feed',()=>{
  assert.throws(()=>config({DUCK_BUILD_ARCH:'x64'},'--mac'),/Only Windows x64 and macOS arm64/);
});

test('actual packer target cannot create Intel or universal Mac output under an arm64 environment',()=>{
  for(const arch of ['x64','universal']) assert.throws(()=>execFileSync(process.execPath,['-e',`const c=require('./dist-config/electron-builder.cjs');const {Arch}=require('electron-builder');Promise.resolve(c.beforePack?.({electronPlatformName:'darwin',arch:Arch[${JSON.stringify(arch)}]})).catch(e=>{console.error(e.message);process.exitCode=1});`,'--','--mac'],{cwd:desktop,encoding:'utf8',env:{...process.env,DUCK_BUILD_ARCH:'arm64',DUCK_UPDATE_BASE:'',DUCK_UPDATE_URL:'',DUCK_UPDATE_REPOSITORY:'',CSC_NAME:'',CSC_LINK:''},stdio:['ignore','pipe','pipe']}),/Only Windows x64 and macOS arm64/);
});
