// Install the offline friend-test package in an isolated directory, then exercise
// the installed executable. Does not bypass Gatekeeper, SmartScreen or signing.
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

assert.ok(['win32', 'darwin'].includes(process.platform));
if (process.platform === 'win32') assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Windows installation owns a disposable runner');
const root = resolve(import.meta.dirname, '../..');
const version = process.env.DUCK_RELEASE_VERSION || JSON.parse(await readFile(join(root, 'desktop/package.json'), 'utf8')).version;
const arch = process.env.DUCK_BUILD_ARCH || process.arch;
assert.match(version, /^\d+\.\d+\.\d+-beta\.\d+$/);
assert.ok(['arm64', 'x64'].includes(arch));
const output = join(root, 'output/desktop-installed-smoke'); await mkdir(output, { recursive: true });
const temp = await mkdtemp(join(tmpdir(), 'letsduck-install-'));
const run = promisify(execFile), platform = process.platform;
let mounted = false, executable;
const env = { ...process.env, DUCK_PERSONAL_DB: join(temp, 'initial.db'), DUCK_DESKTOP_DATA: join(temp, 'initial-profile') };
const mount = join(temp, 'mounted');
async function stopOwned() {
  if (platform !== 'win32' || !executable) return;
  await run('pwsh.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | ForEach-Object { if ($_.MainWindowHandle -ne 0) { [void]$_.CloseMainWindow(); [void]$_.WaitForExit(10000) } }; Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | Stop-Process -Force'], { env: { ...env, DUCK_INSTALLED_EXE: executable }, timeout: 60000 });
}
try {
  let resources, installer;
  if (platform === 'win32') {
    installer = join(root, `desktop/release/win32-${arch}/letsduck-${version}-win-${arch}.exe`);
    const installation = join(temp, 'app'); executable = join(installation, 'letsduck.exe');
    await run(installer, ['/S', `/D=${installation}`], { env, timeout: 180000 });
    await stopOwned();
    resources = join(installation, 'resources');
  } else {
    installer = join(root, `desktop/release/darwin-${arch}/letsduck-${version}-mac-${arch}.dmg`);
    await mkdir(mount);
    await run('hdiutil', ['attach', installer, '-readonly', '-nobrowse', '-mountpoint', mount]); mounted = true;
    const apps = (await readdir(mount)).filter(name => name.endsWith('.app')); assert.equal(apps.length, 1);
    const app = join(temp, apps[0]); await run('ditto', [join(mount, apps[0]), app]);
    await run('hdiutil', ['detach', mount]); mounted = false;
    await run('codesign', ['--verify', '--deep', '--strict', app]);
    executable = join(app, 'Contents/MacOS/letsduck'); resources = join(app, 'Contents/Resources');
  }
  assert.ok(existsSync(executable), 'Installed executable exists');
  assert.equal(existsSync(join(resources, 'app-update.yml')), false, 'Direct friend-test package must not contact an unfinished update feed');
  assert.ok(existsSync(join(resources, 'assets/model.json')), 'Installed package contains real assets');
  await new Promise((ok, no) => {
    const child = spawn(process.execPath, ['scripts/smoke.mjs'], { cwd: join(root, 'desktop'), stdio: 'inherit', env: { ...env, DUCK_APP_EXECUTABLE: executable, DUCK_EXPECTED_VERSION: version, DUCK_EXPECT_OFFLINE: '1' } });
    child.once('error', no); child.once('exit', code => code === 0 ? ok() : no(Error(`Installed functional smoke exited ${code}`)));
  });
  await writeFile(join(output, 'result.json'), JSON.stringify({ installer, version, platform, arch, installedAndLaunched: true, updateFeedEmbedded: false, functionalSmoke: 'passed', realAutomaticUpdate: 'not tested', cleanDeviceSecurityPrompts: 'not tested' }, null, 2));
} catch (error) {
  await writeFile(join(output, 'failure.json'), JSON.stringify({ platform, arch, version, error: String(error) }, null, 2));
  throw error;
} finally {
  if (mounted) await run('hdiutil', ['detach', mount]);
  await stopOwned();
  await rm(temp, { recursive: true, force: true });
}
