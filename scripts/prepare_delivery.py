"""Prepare verified gzip sidecars offline; personal startup still uses only Python 3.9 stdlib."""
import gzip
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL_FILES = ('model.json', 'catalog.json', 'export-schema.json', 'geometry.bin', 'geometry.pack.bin', 'geometry.positions.bin')


def prepare_files(root, names):
    root = Path(root)
    count = 0
    for name in names:
        target = root / name
        if not target.is_file() or target.suffix not in ('.bin', '.glb', '.json'):
            continue
        raw = target.read_bytes()
        zipped = gzip.compress(raw, compresslevel=6, mtime=0)
        meta = {'version': 1, 'raw': hashlib.sha256(raw).hexdigest(), 'gzip': hashlib.sha256(zipped).hexdigest()}
        for suffix, data in (('.gz', zipped), ('.gzip.json', json.dumps(meta).encode())):
            output = target.with_name(target.name + suffix)
            temp = output.with_name(output.name + '.tmp')
            temp.write_bytes(data)
            temp.replace(output)
        count += 1
    return count


def main():
    assets = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'assets'
    assembly = json.loads((ROOT / 'scripts/assembly-assets.json').read_text())['files']
    count = prepare_files(assets, MODEL_FILES) + prepare_files(assets / 'assembly', assembly)
    print('Prepared %d verified local gzip sidecars (no original assets changed).' % count)


if __name__ == '__main__':
    main()
