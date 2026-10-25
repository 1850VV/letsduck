const { app, BrowserWindow } = require('electron');
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
// This build-time SVG renderer must also work on CI hosts without a GPU.
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1024, height: 1024, transparent: true, webPreferences: { offscreen: true, sandbox: true, nodeIntegration: false } });
  try {
    const svg = readFileSync(join(__dirname, '../../frontend/shared/brand/logo.svg'), 'utf8');
    await window.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<style>html,body{margin:0;background:transparent}svg{width:1024px;height:1024px}</style>${svg}`));
    // Offscreen software rendering exposes the bitmap via paint; capturePage
    // can fail with UnknownVizError on Windows CI without a compositor surface.
    const image = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error('Timed out rendering the brand icon')), 10000);
      window.webContents.once('paint', (_event, _dirty, bitmap) => { clearTimeout(timeout); resolve(bitmap); });
      window.webContents.invalidate();
    });
    if (image.isEmpty()) throw Error('Unable to render the brand icon');
    mkdirSync(join(__dirname, '../build'), { recursive: true }); writeFileSync(join(__dirname, '../build/icon.png'), image.toPNG());
  } finally { window.destroy(); app.quit(); }
}).catch(error => { console.error(error); app.exit(1); });
