import {qrcodegen} from '../vendor/qrcodegen.mjs';

export function qrMatrix(text) {
  if (typeof text !== 'string' || !text) throw Error('QR payload is required');
  const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
  return Array.from({length: qr.size}, (_, y) => Array.from({length: qr.size}, (_, x) => qr.getModule(x, y)));
}

export function drawQR(ctx, text, x, y, size) {
  const matrix = qrMatrix(text), modules = matrix.length + 8;
  const cell = Math.floor(size / modules);
  if (cell < 2) throw Error('QR area is too small');
  const actual = cell * modules, offset = Math.floor((size - actual) / 2);
  ctx.fillStyle = '#fff'; ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#000';
  matrix.forEach((row, r) => row.forEach((on, c) => {
    if (on) ctx.fillRect(x + offset + (c + 4) * cell, y + offset + (r + 4) * cell, cell, cell);
  }));
}
