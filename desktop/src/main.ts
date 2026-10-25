import { app, BrowserWindow, protocol, shell, utilityProcess, session, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, resolve, basename, extname } from 'node:path';
import { APP_ORIGIN, localURL, localPermission, externalURL, proxyURL } from './navigation.js';
import { readFile } from 'node:fs/promises';
import electronUpdater from 'electron-updater';
import { UpdateController } from './updates.js';

protocol.registerSchemesAsPrivileged([{ scheme: 'duck', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true, codeCache: true } }]);
app.setName('来做鸭');
app.setPath('userData', process.env.DUCK_DESKTOP_DATA || join(app.getPath('appData'), 'letsduck'));
app.setAppLogsPath(join(app.getPath('userData'), 'logs'));
if (!app.requestSingleInstanceLock()) app.quit();
else void boot().catch(error => { console.error(error); dialog.showErrorBox('来做鸭启动失败', String(error)); app.exit(1); });

async function boot() {
  await app.whenReady();
  const root = resolve(import.meta.dirname, '../..'), resources = app.isPackaged ? process.resourcesPath : root;
  const logDir = app.getPath('logs'); mkdirSync(logDir, { recursive: true });
  const child = utilityProcess.fork(join(import.meta.dirname, 'host.js'), [], { stdio: 'pipe', env: { ...process.env,
    DUCK_ASSETS: process.env.DUCK_ASSETS || (app.isPackaged ? (existsSync(join(resources, 'assets/model.json')) ? join(resources, 'assets') : join(app.getPath('userData'), 'assets')) : join(root, 'assets')),
    DUCK_FRONTEND: join(resources, 'frontend'), DUCK_ASSEMBLY_MANIFEST: app.isPackaged ? join(resources, 'assembly-assets.json') : join(root, 'scripts/assembly-assets.json'),
    DUCK_VERSION: app.getVersion(), DUCK_PORT: '0',
  } });
  const log = (data: Buffer) => { const text = data.toString(); process.stderr.write(text); appendFileSync(join(logDir, 'backend.log'), text); };
  child.stdout?.on('data', log); child.stderr?.on('data', log);
  let exited = false, quitting = false, window: BrowserWindow | null = null;
  const finished = new Promise<void>(ok => child.once('exit', () => { exited = true; ok(); }));
  const backend = await new Promise<string>((ok, no) => {
    child.on('message', message => { if (message.kind === 'ready') ok(message.url); else if (message.kind === 'failed') no(new Error(message.message)); });
    child.once('exit', code => no(new Error(`Local service exited (${code})`)));
  });
  let writes = 0;
  await protocol.handle('duck', async request => {
    if (!localURL(request.url)) return new Response('Not found', { status: 404 });
    if (new URL(request.url).pathname === '/__desktop/update-panel.js') return new Response(await readFile(join(import.meta.dirname, 'update-panel.js')), { headers: { 'Content-Type': 'text/javascript' } });
    const headers = new Headers(request.headers); headers.delete('host');
    const init: RequestInit & { duplex: 'half' } = { method: request.method, headers, duplex: 'half', redirect: 'manual', signal: request.signal };
    if (!['GET', 'HEAD'].includes(request.method)) init.body = request.body;
    const writing = !['GET', 'HEAD'].includes(request.method); if (writing) writes++;
    let response: Response; try { response = await fetch(proxyURL(request.url, backend), init); } finally { if (writing) writes--; }
    const location = response.headers.get('location');
    if (!location) return response;
    const next = new URL(location, backend); if (next.origin !== new URL(backend).origin) return new Response('Invalid redirect', { status: 400 });
    const rewritten = new Headers(response.headers); rewritten.set('location', APP_ORIGIN + next.pathname + next.search + next.hash);
    return new Response(response.body, { status: response.status, headers: rewritten });
  });
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback, details) => callback(wc === window?.webContents && localPermission(permission, details.requestingUrl)));
  session.defaultSession.setPermissionCheckHandler((wc, permission, origin, details) => wc === window?.webContents && localPermission(permission, details.requestingUrl || origin));
  const downloads = new Set<Electron.DownloadItem>();
  session.defaultSession.on('will-download', (_event, item) => {
    downloads.add(item); item.once('done', () => downloads.delete(item));
    const name = basename(item.getFilename()), ext = extname(name), stem = name.slice(0, -ext.length || undefined), dir = app.getPath('downloads');
    let path = join(dir, name), i = 1; while (existsSync(path)) path = join(dir, `${stem} (${i++})${ext}`);
    item.setSavePath(path);
  });
  const updater = electronUpdater.autoUpdater;
  updater.allowPrerelease = app.getVersion().includes('-beta.');
  const updates = new UpdateController(updater, async () => {
    if (writes || downloads.size) return false;
    if (!window || window.isDestroyed()) return true;
    return window.webContents.executeJavaScript(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(!document.querySelector('#dl-3mf:disabled')))))`);
  }, async () => { session.defaultSession.flushStorageData(); });
  updates.on('state', state => { if (window && !window.isDestroyed()) window.webContents.send('desktop:update-state', state); });
  const trusted = (event: IpcMainInvokeEvent) => { if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || !localURL(event.senderFrame.url)) throw new Error('Unknown application frame'); };
  ipcMain.handle('desktop:update-state', event => { trusted(event); return updates.state; });
  ipcMain.handle('desktop:update-action', (event, action) => { trusted(event); if (action === 'check') return updates.check(); if (action === 'download') return updates.download(); if (action === 'install') return updates.install(); throw new Error('Unknown update action'); });
  const openWindow = () => {
    window = new BrowserWindow({ width: 1280, height: 860, minWidth: 800, minHeight: 600, backgroundColor: '#f5f6fb', title: '来做鸭', webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, preload: join(import.meta.dirname, 'preload.cjs') } });
    const contents = window.webContents;
    contents.setWindowOpenHandler(({ url }) => { if (localURL(url)) void contents.loadURL(url); else if (externalURL(url)) void shell.openExternal(url); return { action: 'deny' }; });
    contents.on('will-navigate', (event, url) => { if (!localURL(url)) { event.preventDefault(); if (externalURL(url)) void shell.openExternal(url); } });
    contents.on('did-finish-load', () => { if (localURL(contents.getURL())) void contents.executeJavaScript(`import('duck://app/__desktop/update-panel.js').then(() => undefined)`).catch(error => { if (!contents.isDestroyed() && !String(error).includes('WebFrame was removed')) console.error(error); }); });
    window.on('closed', () => { window = null; });
    void window.loadURL(APP_ORIGIN + '/');
  };
  app.on('second-instance', () => { if (!window) openWindow(); if (window!.isMinimized()) window!.restore(); window!.focus(); });
  app.on('activate', () => { if (!window) openWindow(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('before-quit', event => { if (quitting) return; event.preventDefault(); quitting = true; updates.dispose(); session.defaultSession.flushStorageData(); if (!exited) child.postMessage({ kind: 'stop' }); void finished.then(() => app.quit()); });
  child.on('exit', code => { if (!quitting) { dialog.showErrorBox('来做鸭本地服务已停止', `请重新打开客户端。错误代码：${code}`); app.quit(); } });
  openWindow();
  if (app.isPackaged && existsSync(join(process.resourcesPath, 'app-update.yml'))) updates.start();
}
