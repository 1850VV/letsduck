import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { UpdateController, updateFeed } from '../src/updates.js';

class FakeUpdater extends EventEmitter {
  autoDownload = true; autoInstallOnAppQuit = true; allowDowngrade = true; allowPrerelease = false;
  downloads = 0; installs = 0; checks = 0; fail = true;
  async checkForUpdates() { this.checks++; this.emit('update-available', { version: '0.1.0-beta.2' }); return {}; }
  async downloadUpdate() { this.downloads++; if (this.fail) { this.fail = false; throw new Error('offline'); } this.emit('download-progress', { percent: 40 }); this.emit('update-downloaded', { version: '0.1.0-beta.2' }); return []; }
  quitAndInstall() { this.installs++; }
}
test('only downloads after a click, allows retry, and installs only after work drains', async () => {
  const updater = new FakeUpdater(); let busy = true, prepared = false, release!: () => void;
  const controller = new UpdateController(updater, async () => !busy, async () => { prepared = true; }, () => new Promise<void>(ok => { release = ok; }));
  assert.equal(updater.autoDownload, false); assert.equal(updater.autoInstallOnAppQuit, false); assert.equal(updater.allowDowngrade, false);
  await controller.check(); assert.equal(controller.state.phase, 'available'); assert.equal(updater.downloads, 0);
  await controller.download(); assert.equal(controller.state.phase, 'error'); assert.equal(controller.state.retry, 'download');
  await controller.download(); assert.equal(controller.state.phase, 'ready');
  const install = controller.install(); await new Promise(setImmediate);
  assert.equal(controller.state.phase, 'waiting'); assert.equal(updater.installs, 0);
  busy = false; release(); await install; assert.equal(prepared, true); assert.equal(updater.installs, 1);
  controller.dispose();
});
test('updater failures are caught and disposing removes scheduled checks', async () => {
  const updater = new FakeUpdater(); updater.checkForUpdates = async () => { throw new Error('unavailable'); };
  const controller = new UpdateController(updater, async () => true, async () => {});
  await controller.check(); assert.equal(controller.state.phase, 'error'); assert.equal(controller.state.retry, 'check');
  controller.start(100000); controller.dispose(); assert.equal(updater.listenerCount('update-available'), 0);
});
test('release feeds require HTTPS and a supported platform/channel', () => {
  assert.equal(updateFeed('https://example.com/releases', 'beta', 'darwin', 'arm64'), 'https://example.com/releases/beta/darwin/arm64/');
  assert.equal(updateFeed('https://example.com', 'stable', 'win32', 'x64'), 'https://example.com/stable/win32/x64/');
  for (const base of ['http://example.com', 'https:' + '//name:secret@example.com', 'https://example.com/?token=x']) assert.throws(() => updateFeed(base, 'beta', 'darwin', 'arm64'));
  assert.throws(() => updateFeed('https://example.com', 'beta', 'linux', 'arm64'));
});
