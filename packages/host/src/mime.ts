import { readFileSync } from 'node:fs';

// The inherited Python frontend handler reads these platform MIME configurations.
const types: Record<string, string> = { '.htm': 'text/html', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.py': 'text/x-python', '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json' };
for (const file of ['/etc/mime.types', '/etc/httpd/mime.types', '/etc/httpd/conf/mime.types', '/etc/apache/mime.types', '/etc/apache2/mime.types', '/usr/local/etc/httpd/conf/mime.types', '/usr/local/lib/netscape/mime.types', '/usr/local/etc/mime.types']) {
  let text: string; try { text = readFileSync(file, 'utf8'); } catch { continue; }
  for (const line of text.split(/\r?\n/)) {
    const [type, ...extensions] = line.split('#', 1)[0]!.trim().split(/\s+/u);
    if (type?.includes('/')) for (const extension of extensions) types['.' + extension] = type;
  }
}
export function frontendMime(suffix: string): string | undefined { return types[suffix.toLowerCase()]; }
