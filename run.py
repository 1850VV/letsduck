"""Friendly launcher for the source-only public distribution."""
from pathlib import Path
import runpy
import sys

ROOT=Path(__file__).resolve().parent
FILES=('source.3mf','geometry.bin','model.json','catalog.json','export-schema.json')

if __name__=='__main__':
    missing=[name for name in FILES if not (ROOT/'assets'/name).is_file()]
    if missing:
        print('DuckPalette needs a separately licensed local asset pack. Missing: '+', '.join(missing),file=sys.stderr)
        print('See docs/local-assets.md; then run python3 scripts/import_local_assets.py <assets-directory>.',file=sys.stderr)
        raise SystemExit(2)
    runpy.run_path(str(ROOT/'start.py'),run_name='__main__')
