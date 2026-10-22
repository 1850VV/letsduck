"""Lightweight launcher: FastAPI/Uvicorn serves the frontend, local assets and API.

SQLite is the default. MySQL is selected explicitly by deployment configuration.
"""
from pathlib import Path
import os, subprocess, sys

ROOT = Path(__file__).resolve().parent
FILES = ('source.3mf', 'geometry.bin', 'model.json', 'catalog.json', 'export-schema.json')

if __name__ == '__main__':
    missing = [name for name in FILES if not (ROOT / 'assets' / name).is_file()]
    if missing:
        print('DoodleDuck needs a separately licensed local asset pack. Missing: ' + ', '.join(missing), file=sys.stderr)
        print('See docs/local-assets.md; then run python3 scripts/import_local_assets.py <assets-directory>.', file=sys.stderr)
        raise SystemExit(2)
    args = sys.argv[1:]
    env = {**os.environ, 'DUCK_ASSETS': str(ROOT / 'assets')}
    if '--no-open' in args:
        args.remove('--no-open')
    else:
        args.append('--open')
    raise SystemExit(subprocess.call([sys.executable, str(ROOT / 'backend' / 'server.py'), '--static', str(ROOT / 'frontend'), *args], env=env))
