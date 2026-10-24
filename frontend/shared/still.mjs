// A picture of the stage small enough for localStorage: WebP where the browser encodes it, otherwise
// (Safari) a PNG at CSS-pixel size. Shown for a moment while the live view loads, so 1x is sharp enough.
const webp = (() => {const c = document.createElement('canvas');c.width = c.height = 1;return c.toDataURL('image/webp').startsWith('data:image/webp');})();
export function stillURL(canvas, cssWidth) {
  if (webp) return canvas.toDataURL('image/webp', .85);
  const out = document.createElement('canvas'),scale = Math.min(1, cssWidth / canvas.width);
  out.width = Math.round(canvas.width * scale);out.height = Math.round(canvas.height * scale);
  out.getContext('2d').drawImage(canvas, 0, 0, out.width, out.height);return out.toDataURL('image/png');
}
