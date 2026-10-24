"""Local preparation metadata; never distribute the generated asset manifest in source Git."""
import hashlib
import json
from pathlib import Path


def write_integrity(assets):
    assets = Path(assets)
    digest = lambda name: hashlib.sha256((assets / name).read_bytes()).hexdigest()
    manifest = {'version': 1, 'model': digest('model.json'), 'geometry': digest('geometry.bin'),
                'files': {name: digest(name) for name in ('geometry.pack.bin', 'geometry.positions.bin') if (assets / name).is_file()}}
    target = assets / 'geometry.integrity.json'
    temp = target.with_suffix('.tmp')
    temp.write_text(json.dumps(manifest, separators=(',', ':')), encoding='utf-8')
    temp.replace(target)
