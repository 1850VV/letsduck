import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { transform } from 'esbuild';
import { servoMap, servoLeads } from './packages/contracts/src/devices.js';
const frontend = resolve(import.meta.dirname, 'frontend');
function synchronousPrepaint(): Plugin {
  return {
    name: 'duck-synchronous-prepaint',
    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        for (const kind of ['paint', 'assemble']) {
          const anchor = '<script data-duck-prepaint="' + kind + '"></script>';
          if (!html.includes(anchor)) continue;
          const source = await readFile(resolve(frontend, 'bootstrap/' + kind + '.ts'), 'utf8');
          const result = await transform(source, { loader: 'ts', format: 'iife', target: 'es2023', minify: true });
          html = html.replace(anchor, '<script>' + result.code + '</script>');
        }
        return html;
      },
    },
  };
}

function publicServoMaps(): Plugin {
  return {
    name: 'duck-public-servo-maps',
    generateBundle() {
      for (const [fileName, data] of [['assemble/servo-map.json', servoMap], ['assemble/servo-leads.json', servoLeads], ['shared/servo-map.json', servoMap]] as const) {
        this.emitFile({ type: 'asset', fileName, source: JSON.stringify(data, null, 2) + '\n' });
      }
    },
  };
}
function modelPreloads(): Plugin {
  return {
    name: 'duck-model-fetch-preloads',
    transformIndexHtml(html,context) {
      if(context.path.endsWith('/assemble/audio-credits.html'))return;
      if (!/<script\b[^>]*type=["']module["']/.test(html)) return;
      return ['model.json', 'geometry.positions.bin', 'catalog.json'].map(name => ({
        tag: 'link', attrs: { rel: 'preload', href: '/assets/' + name, as: 'fetch', crossorigin: true }, injectTo: 'head' as const,
      }));
    },
  };
}
export default defineConfig({
  root: frontend,
  base: '/',
  publicDir: false,
  input: {
    paint: resolve(frontend, 'index.html'), home: resolve(frontend, 'home.html'),
    assemble: resolve(frontend, 'assemble/index.html'), debug: resolve(frontend, 'debug/index.html'),
    gallery: resolve(frontend, 'gallery/index.html'), credits: resolve(frontend, 'assemble/audio-credits.html'),
  },
  resolve: { alias: [
    { find: /^three$/, replacement: resolve(frontend, 'vendor/three.module.js') },
    { find: /^(?:\.\.\/|\.\/)+vendor\/three\.module\.js$/, replacement: resolve(frontend, 'vendor/three.module.js') },
  ] },
  plugins: [synchronousPrepaint(), publicServoMaps(), modelPreloads()],
  worker: { format: 'es' },
  build: { outDir: 'dist', emptyOutDir: true, assetsDir: 'static', assetsInlineLimit: 0, manifest: true, target: 'es2023' },
});
