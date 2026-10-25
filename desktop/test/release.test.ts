import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const desktop = resolve(import.meta.dirname, '..');
function config(env: Record<string, string> = {}, target = '--win') {
  return JSON.parse(execFileSync(process.execPath, ['-e', `const c = require('./electron-builder.cjs'); console.log(JSON.stringify({ publish: c.publish, version: c.extraMetadata?.version }));`, '--', target], {
    cwd: desktop, encoding: 'utf8', env: { ...process.env, CSC_NAME: '', CSC_LINK: '', DUCK_UPDATE_BASE: '', DUCK_UPDATE_URL: '', DUCK_UPDATE_REPOSITORY: '', DUCK_RELEASE_VERSION: '', DUCK_BUILD_ARCH: 'x64', ...env }, stdio: ['ignore', 'pipe', 'pipe'],
  }));
}
test('release builds embed anonymous per-platform GitHub feeds and the exact installed version', () => {
  const c = config({ DUCK_UPDATE_REPOSITORY: '1850VV/letsduck-releases', DUCK_RELEASE_VERSION: '0.1.0-beta.2' });
  assert.equal(c.publish?.url, 'https://github.com/1850VV/letsduck-releases/releases/download/beta-win32-x64/');
  assert.equal(c.publish?.channel, 'beta');
  assert.equal(c.version, '0.1.0-beta.2');
  const mac = config({ DUCK_UPDATE_REPOSITORY: '1850VV/letsduck-releases', DUCK_RELEASE_VERSION: '1.0.0', DUCK_BUILD_ARCH: 'arm64', CSC_NAME: 'Developer ID Application: Test' }, '--mac');
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
  assert.equal(c.publish.url, 'https://downloads.example.com/beta/');
});
