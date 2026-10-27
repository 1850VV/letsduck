// Built as a classic inline script at the original image-stage anchor.
try {
  const value: unknown = JSON.parse(localStorage.getItem('letsduck-still-paint') ?? 'null');
  if (value && typeof value === 'object' && 'vw' in value && 'vh' in value && 'image' in value && typeof value.image === 'string' && !location.hash && value.vw === innerWidth && value.vh === innerHeight) {
    const image = new Image(); image.className = 'handoff still'; image.alt = ''; image.decoding = 'sync'; image.src = value.image; document.currentScript?.before(image);
  }
} catch { /* Invalid or unavailable browser storage has no image to restore. */ }
export {};
