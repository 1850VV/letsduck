import { _electron as electron } from 'playwright';
import { createRequire } from 'node:module';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url), root = resolve(import.meta.dirname, '../..');
const temp = await mkdtemp(join(tmpdir(), 'duck-update-ui-')), output = join(root, 'output/desktop-updates');
await mkdir(output, { recursive: true });
let application;
try {
  const packaged = process.env.DUCK_APP_EXECUTABLE;
  const env = { ...process.env, DUCK_PERSONAL_DB: join(temp, 'personal.db'), DUCK_DESKTOP_DATA: join(temp, 'profile') };
  if (packaged) delete env.DUCK_ASSETS; else env.DUCK_ASSETS = join(root, 'assets');
  application = await electron.launch({ executablePath: packaged || require('electron'), args: packaged ? [] : [join(root, 'desktop')], env });
  const page = await application.firstWindow(); await page.waitForURL('duck://app/');
  await page.waitForFunction(() => document.querySelector('#letsduck-update')?.shadowRoot);
  // Exercise the shipped panel and preload IPC, without downloading or installing a release.
  await application.evaluate(({ ipcMain }) => {
    globalThis.smokeCommands = [];
    ipcMain.removeHandler('desktop:update-action');
    ipcMain.handle('desktop:update-action', (_event, action) => { globalThis.smokeCommands.push(action); });
  });
  const panel = page.locator('#letsduck-update');
  const send = state => application.evaluate(({ BrowserWindow }, state) => BrowserWindow.getAllWindows()[0].webContents.send('desktop:update-state', state), state);
  const screenshot = name => page.screenshot({ path: join(output, name + '.png') });
  await send({ phase: 'available', version: '0.1.0-beta.2' });
  await panel.getByRole('button', { name: '更新', exact: true }).waitFor(); await screenshot('available');
  await panel.getByRole('button', { name: '稍后', exact: true }).click();
  await panel.getByRole('button', { name: '有新版本', exact: true }).click();
  await panel.getByRole('button', { name: '更新', exact: true }).click();
  await send({ phase: 'downloading', percent: 43 });
  await panel.getByText('正在下载 43%').waitFor();
  assert.equal(await panel.getByRole('button', { name: '下载中', exact: true }).isDisabled(), true); await screenshot('downloading');
  await send({ phase: 'error', retry: 'download' });
  await panel.getByRole('button', { name: '重试', exact: true }).waitFor(); await screenshot('retry');
  await panel.getByRole('button', { name: '重试', exact: true }).click();
  await send({ phase: 'ready', version: '0.1.0-beta.2' });
  await panel.getByRole('button', { name: '重启更新', exact: true }).waitFor(); await screenshot('ready');
  await panel.getByRole('button', { name: '重启更新', exact: true }).click();
  await send({ phase: 'waiting', version: '0.1.0-beta.2' });
  await panel.getByText('正在完成当前导出，完成后更新。').waitFor();
  assert.equal(await panel.getByRole('button', { name: '等待完成', exact: true }).isDisabled(), true); await screenshot('waiting');
  const commands = await application.evaluate(() => globalThis.smokeCommands);
  assert.deepEqual(commands, ['download', 'download', 'install']);
  const result = { simulatedStates: ['available', 'downloading', 'error', 'ready', 'waiting'], commands, actualInstallation: false };
  await writeFile(join(output, 'result.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
} finally {
  if (application) { const child = application.process(); await application.close(); assert.ok(child.exitCode !== null || child.signalCode !== null); }
  await rm(temp, { recursive: true, force: true });
}
