// Keep this synchronous: arriving images must precede the deferred model renderer.
try {
  const handoff: unknown = JSON.parse(sessionStorage.getItem('dd-handoff') ?? 'null'); sessionStorage.removeItem('dd-handoff');
  let source = '', kind = 'handoff';
  if (handoff && typeof handoff === 'object' && 'at' in handoff && typeof handoff.at === 'number' && 'image' in handoff && typeof handoff.image === 'string' && Date.now() - handoff.at < 15000) source = handoff.image;
  if (source) document.documentElement.classList.add('arriving');
  else {
    const still: unknown = JSON.parse(localStorage.getItem('letsduck-still-assemble') ?? 'null');
    if (still && typeof still === 'object' && 'vw' in still && 'vh' in still && 'image' in still && typeof still.image === 'string' && still.vw === innerWidth && still.vh === innerHeight) { source = still.image; kind = 'handoff still'; }
  }
  if (source) { const image = new Image(); image.className = kind; image.alt = ''; image.decoding = 'sync'; image.src = source; document.currentScript?.before(image); }
} catch { /* Invalid or unavailable browser storage has no image to restore. */ }
export {};
