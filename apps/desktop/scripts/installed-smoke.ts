/** Installs only into owned temporary directories; never bypasses platform security prompts. */
import assert from 'node:assert/strict';
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { promisify, parseArgs } from 'node:util';
import { existsSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { root, desktop, desktopScope, failure, packageVersion, required, stopChild } from './check-support.js';

const { values } = parseArgs({ options: { synthetic: { type: 'boolean', default: false }, installer: { type: 'string' } } });
const platform = process.platform;
assert.ok(platform === 'win32' || platform === 'darwin', 'Desktop installation supports Windows and macOS');
if (platform === 'win32') assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Windows installation owns a disposable runner');
const version = process.env.DUCK_RELEASE_VERSION || await packageVersion();
const arch = process.env.DUCK_BUILD_ARCH || process.arch;
assert.match(version, /^\d+\.\d+\.\d+-beta\.\d+$/); assert.ok(arch === 'arm64' || arch === 'x64');
const output = resolve(process.env.DUCK_TEST_OUTPUT || join(root, 'output/desktop-installed-smoke')); await mkdir(output, { recursive: true });
const scope = await desktopScope('letsduck-install-');
const run = promisify(execFile), mount = join(scope.temporary, 'mounted');
let mounted = false, executable: string | undefined, smoke: ChildProcess | undefined;
let result: Record<string, unknown> | undefined;
async function stopOwned(): Promise<void> {
  if (platform !== 'win32' || !executable) return;
  await run('pwsh.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | ForEach-Object { if ($_.MainWindowHandle -ne 0) { [void]$_.CloseMainWindow(); [void]$_.WaitForExit(10000) } }; Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | Stop-Process -Force'], { env: { ...scope.env, DUCK_INSTALLED_EXE: executable }, timeout: 60_000 });
  const live = await run('pwsh.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | Select-Object -ExpandProperty Id'], { env: { ...scope.env, DUCK_INSTALLED_EXE: executable }, timeout: 60_000 });
  assert.equal(live.stdout.trim(), '', 'Owned installed application processes exited');
}
scope.addCleanup(stopOwned);
scope.addCleanup(async () => { if (mounted) { await run('hdiutil', ['detach', mount]); mounted = false; } });
scope.addCleanup(async () => { if (smoke) await stopChild(smoke); });
try {
  let resources: string;
  const installer = resolve(values.installer || join(desktop, `release/${platform}-${arch}/letsduck-${version}-${platform === 'win32' ? 'win' : 'mac'}-${arch}.${platform === 'win32' ? 'exe' : 'dmg'}`));
  assert.ok(existsSync(installer), 'Installer exists: ' + installer);
  if (platform === 'win32') {
    const installation = join(scope.temporary, 'app'); executable = join(installation, 'letsduck.exe');
    await run(installer, ['/S', `/D=${installation}`], { env: scope.env, timeout: 180_000 }); await stopOwned(); resources = join(installation, 'resources');
  } else {
    await mkdir(mount); await run('hdiutil', ['attach', installer, '-readonly', '-nobrowse', '-mountpoint', mount]); mounted = true;
    const apps = (await readdir(mount)).filter(name => name.endsWith('.app')); assert.equal(apps.length, 1); const name = required(apps[0]);
    const app = join(scope.temporary, name); await run('ditto', [join(mount, name), app]);
    await run('hdiutil', ['detach', mount]); mounted = false; await run('codesign', ['--verify', '--deep', '--strict', app]);
    executable = join(app, 'Contents/MacOS/letsduck'); resources = join(app, 'Contents/Resources');
  }
  assert.ok(existsSync(executable), 'Installed executable exists');
  assert.equal(existsSync(join(resources, 'app-update.yml')), false, 'Offline friend-test package must not contact an update feed');
  assert.ok(existsSync(join(resources, 'runtime/frontend/home.html')), 'Installed package contains the staged frontend');
  if (!values.synthetic) assert.ok(existsSync(join(resources, 'runtime/assets/model.json')), 'Installed package contains licensed model assets');
  await new Promise<void>((ok, no) => {
    smoke = spawn(process.execPath, ['--import', 'tsx', join(desktop, 'scripts/smoke.ts'), ...(values.synthetic ? ['--synthetic'] : [])], {
      cwd: root, stdio: 'inherit', env: { ...scope.env, DUCK_APP_EXECUTABLE: executable, DUCK_EXPECTED_VERSION: version, DUCK_EXPECT_OFFLINE: '1', DUCK_TEST_OUTPUT: join(output, 'functional') },
    });
    smoke.once('error', no); smoke.once('exit', code => code === 0 ? ok() : no(new Error(`Installed functional smoke exited ${code}`)));
  });
  result = { installer, version, platform, arch, synthetic: values.synthetic, installedAndLaunched: true, updateFeedEmbedded: false,
    functionalSmoke: values.synthetic ? 'protocol/save/profile/relaunch/offline subset passed' : 'licensed functional suite passed with explicitly simulated assembly prerequisite',
    realAutomaticUpdate: 'not tested', cleanDeviceSecurityPrompts: 'not tested', licensedGroups: values.synthetic ? 'not run' : 'see functional/result.json' };
} catch (error) { await writeFile(join(output, 'failure.json'), JSON.stringify({ platform, arch, version, error: failure(error) }, null, 2)); throw error; }
finally { await scope.dispose(); }
await writeFile(join(output, 'result.json'), JSON.stringify({ ...result, ownedProcessesExited: true, temporaryInstallationRemoved: true }, null, 2));
console.log(JSON.stringify({ ...result, ownedProcessesExited: true, temporaryInstallationRemoved: true }));
