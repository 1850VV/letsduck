const { app, BrowserWindow } = require('electron');
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
// This build-time SVG renderer must also work on CI hosts without a GPU.
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true, nodeIntegration: false } });
  try {
    const svg = readFileSync(join(__dirname, '../../frontend/shared/brand/logo.svg'), 'utf8');
    await window.loadURL('data:text/html;charset=utf-8,<html></html>');
    // Decode the source SVG directly: no compositor screenshot or first-paint race.
    const png = await window.webContents.executeJavaScript(`(async () => {
      const image = new Image();
      image.src = ${JSON.stringify('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg))};
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1024;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, 1024, 1024);
      if (!context.getImageData(0, 0, 1024, 1024).data.some((value, index) => index % 4 === 3 && value !== 0))
        throw Error('The brand icon rendered as an empty image');
      return canvas.toDataURL('image/png');
    })()`);
    mkdirSync(join(__dirname, '../build'), { recursive: true });
    writeFileSync(join(__dirname, '../build/icon.png'), Buffer.from(png.split(',')[1], 'base64'));
  } finally { window.destroy(); app.quit(); }
}).catch(error => { console.error(error); app.exit(1); });
