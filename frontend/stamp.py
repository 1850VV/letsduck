"""Build step for the server edition's nginx image (Python standard library only).

Two things make a first visit slow over a long link: the browser discovers the ES modules import by
import (about six sequential round trips), and the 3 MB model only starts after all of them. This
rewrites the two HTML pages so that

- every .mjs/.js/.css URL carries a content hash (`/shared/i18n.mjs?v=1a2b3c4d5e`); nginx caches those
  for a year and a repeat visit needs no network for code;
- one import map remaps each module's plain absolute path to its hashed URL, so the relative imports
  inside the modules stay exactly as written (the bare "three" specifier keeps working);
- `<link rel=modulepreload>` lists the page's whole module graph and `<link rel=preload>` the model
  files, so everything downloads in parallel from the start.

The personal edition and development servers serve the unmodified source; nothing else changes.
Usage: python3 stamp.py <frontend dir>   (rewrites index.html and gallery/index.html in place)
"""
import hashlib
import json
import re
import sys
from pathlib import Path, PurePosixPath
from urllib.parse import urljoin

PAGES = ('index.html', 'gallery/index.html')
CODE = ('.mjs', '.js', '.css')
MODEL = ('/assets/model.json', '/assets/geometry.bin', '/assets/catalog.json')  # fetched by shared/duck-view.mjs
IMPORT = re.compile(r'''(?:\bimport|\bexport)\s*(?:[\w*{}\s,$]*?\bfrom\s*)?['"]([^'"]+)['"]''')
ORIGIN = 'https://site'


def absolute(ref, base):
    """Site path of `ref` as seen from the page or module at site path `base`."""
    return urljoin(ORIGIN + base, ref)[len(ORIGIN):].split('?')[0].split('#')[0]


def stamp(root):
    root = Path(root)
    versions = {'/' + p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()[:10]
                for p in sorted(root.rglob('*')) if p.is_file() and p.suffix in CODE and p.name != 'stamp.py'}
    url = lambda path: path + '?v=' + versions[path]
    for page in PAGES:
        file = root / page
        html = file.read_text(encoding='utf-8')
        if 'data-stamped' in html:
            raise SystemExit(page + ' is already stamped')
        base = '/' + str(PurePosixPath(page).parent).strip('.') + '/'
        base = base.replace('//', '/')
        found = re.search(r'<script type="importmap">(.*?)</script>', html, re.S)
        bare = {name: absolute(target, base) for name, target in json.loads(found.group(1))['imports'].items()}

        def resolve(spec, importer):
            return bare.get(spec) or (absolute(spec, importer) if spec.startswith(('.', '/')) else None)

        # Every module this page can reach from its entry scripts, following static imports.
        entries = [absolute(src, base) for src in re.findall(r'<script type="module" src="([^"]+)"', html)]
        graph, todo = [], list(entries)
        while todo:
            path = todo.pop(0)
            if path in graph or path not in versions:
                continue
            graph.append(path)
            source = (root / path.lstrip('/')).read_text(encoding='utf-8')
            todo += [p for p in (resolve(s, path) for s in IMPORT.findall(source)) if p]

        imports = {name: url(path) for name, path in bare.items()}
        imports.update({path: url(path) for path in versions if path.endswith(('.mjs', '.js'))})
        preload = ''.join('<link rel="modulepreload" href="%s">' % url(p) for p in graph if p not in entries)
        preload += ''.join('<link rel="preload" href="%s" as="fetch" crossorigin>' % p for p in MODEL)
        html = html.replace(found.group(0), '<script type="importmap" data-stamped>%s</script>\n%s'
                            % (json.dumps({'imports': imports}, separators=(',', ':')), preload))

        def versioned(match):
            path = absolute(match.group(2), base)
            return match.group(1) + '="' + (url(path) if path in versions else match.group(2)) + '"'
        html = re.sub(r'\b(href|src)="((?:\./|\.\./|/)[^"]+\.(?:mjs|js|css))"', versioned, html)
        file.write_text(html, encoding='utf-8')
        print('%s: %d modules preloaded, %d files versioned' % (page, len(graph), len(versions)))


if __name__ == '__main__':
    stamp(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parent)
