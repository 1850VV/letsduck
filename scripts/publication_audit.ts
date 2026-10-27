/** Check tracked content before publication. Heuristics, not a security guarantee. */
import { execFileSync } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import { resolve, join, basename, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve(import.meta.dirname, '..');
const rules: Readonly<Record<string, RegExp>> = {
  'home-path': /\/(?:Users|home)\/[^/\s"'<>]+\//g,
  'temporary-path': /\/var\/folders\/[A-Za-z0-9_/.-]+/g,
  'preview-access-key': /[?&]key=[A-Za-z0-9_-]{16,}/g,
  'github-token': /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/g,
  'api-secret': /sk-(?:proj-)?[A-Za-z0-9_-]{24,}/g,
  'private-key': /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  'private-chat-link': /(?:chatgpt-conversation|codex):\/\/[^\s]+/g,
  'credential-url': /https?:\/\/[^/\s:@]+:[^/\s@]+@/g,
};
// Match the historical byte regexes: JavaScript whitespace also includes non-ASCII characters.
const byteRules = Object.entries(rules).map(([rule,pattern]) => [rule,new RegExp(pattern.source.replaceAll('\\s','\\x09-\\x0d\\x20'),'g')] as const);
const localOnly = new Set(['filament-catalog.json','filament-profiles.json','source.3mf','geometry.bin','geometry.pack.bin','geometry.positions.bin','model.json','catalog.json','export-schema.json']);
const binary = new Set(['.3mf','.stl','.zip','.bin','.glb','.png','.jpg','.gif','.webm','.mp4','.mp3','.pdf']);
const privateParts = new Set(['.env','.codex','.agents','.playwright-cli','.ryugi','node_modules','__pycache__']);
export interface Finding { file: string; rule: string; line?: number }
export async function audit(options: { root?: string; files?: readonly string[] } = {}): Promise<{ filesChecked: number; findings: Finding[] }> {
  const directory = options.root ?? root, files = options.files ?? execFileSync('git', ['ls-files','-z'], { cwd: directory }).toString('utf8').split('\0').filter(Boolean);
  const findings: Finding[] = [];
  for (const name of files) {
    const file = join(directory,name), info = await lstat(file); if (info.isSymbolicLink()) { findings.push({file:name,rule:'symlink'}); continue; }
    const suffix = extname(name).toLowerCase(), media = name.startsWith('docs/media/') && ['.jpg','.gif'].includes(suffix);
    if (media && info.size > 3_000_000) findings.push({file:name,rule:'readme-media-too-large'});
    if (localOnly.has(basename(name)) || (!media && binary.has(suffix))) findings.push({file:name,rule:'local-only-or-unreviewed-binary'});
    if (name.split('/').some(part=>privateParts.has(part))) findings.push({file:name,rule:'private-or-generated-path'});
    const data = (await readFile(file)).toString('latin1');
    for (const [rule, pattern] of byteRules) for (const match of data.matchAll(pattern)) findings.push({ file:name, line:data.slice(0,match.index).split('\n').length, rule });
  }
  return {filesChecked:files.length,findings};
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { const result = await audit(); console.log(JSON.stringify(result,null,2)); process.exitCode = result.findings.length ? 1 : 0; }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
