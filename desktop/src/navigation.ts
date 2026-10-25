export const APP_ORIGIN = 'duck://app';
export function localURL(raw: string) { try { const u = new URL(raw); return u.protocol === 'duck:' && u.hostname === 'app' && !u.port && !u.username && !u.password; } catch { return false; } }
export function externalURL(raw: string) { try { const u = new URL(raw); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; } }
export function proxyURL(raw: string, backend: string) { if (!localURL(raw)) throw new Error('Unknown application origin'); const u = new URL(raw); return backend + u.pathname + u.search; }
