"""Import an existing, lawfully obtained local asset pack. No network access."""
import argparse, hashlib, json, shutil, tempfile, zipfile, subprocess
from pathlib import Path

FILES=('source.3mf','geometry.bin','model.json','catalog.json','export-schema.json')
ROOT=Path(__file__).resolve().parents[1]

def import_assets(source,target):
    source,target=Path(source),Path(target)
    missing=[name for name in FILES if not (source/name).is_file() or (source/name).is_symlink()]
    if missing:raise ValueError('Incomplete local asset pack: '+', '.join(missing))
    model=json.loads((source/'model.json').read_text())
    digest=hashlib.sha256((source/'source.3mf').read_bytes()).hexdigest()
    if digest!=model.get('source_sha256'):raise ValueError('3MF does not match model manifest')
    if len(model.get('parts',[]))!=35 or len({p.get('id') for p in model['parts']})!=35:
        raise ValueError('Expected the reviewed 35-part model pack')
    with zipfile.ZipFile(source/'source.3mf') as z:
        if z.testzip() is not None:raise ValueError('Damaged 3MF archive')
    if not json.loads((source/'catalog.json').read_text()).get('products'):
        raise ValueError('Missing consumables catalog')
    schema=json.loads((source/'export-schema.json').read_text())
    if not isinstance(schema.get('filamentChunks'),dict) or not isinstance(schema.get('variantKeys'),list):
        raise ValueError('Invalid export schema')
    if not (source/'geometry.bin').stat().st_size:raise ValueError('Empty geometry')
    # Validate all destinations before writing any file; never replace a different pack.
    for name in FILES:
        dest=target/name
        if dest.exists() and (dest.is_symlink() or dest.read_bytes()!=(source/name).read_bytes()):
            raise FileExistsError('Different local asset already exists: '+name)
    target.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(dir=target) as tmp:
        for name in FILES:shutil.copyfile(source/name,Path(tmp)/name)
        for name in FILES:
            if not (target/name).exists():(Path(tmp)/name).replace(target/name)
    return digest

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',type=Path,help='Existing workbench assets directory; a 3MF alone is insufficient')
    parser.add_argument('--target',type=Path,default=ROOT/'assets')
    parser.add_argument('--positions', action='store_true', help='Preparation only: use Node and npm ci dependencies to build the smallest POS1 pack')
    args=parser.parse_args()
    try:digest=import_assets(args.source,args.target)
    except (ValueError,OSError,zipfile.BadZipFile) as error:parser.exit(1,str(error)+'\n')
    print('Imported five local-only assets. Source SHA-256: '+digest)
    print('These assets retain their own terms; do not force-add them to Git.')
    # The browser downloads the smaller geometry.pack.bin when present and falls back to geometry.bin.
    from pack_geometry import write_pack
    try:print('Packed the geometry for faster loading: geometry.pack.bin, %d bytes.'%write_pack(args.target))
    except (ValueError,OSError,AssertionError) as error:print('Could not pack the geometry (%s); the site uses geometry.bin.'%error)
    if args.positions:
        try:subprocess.run(['node', str(ROOT/'scripts/pack_positions.mjs'), str(args.target.resolve())], check=True)
        except (OSError, subprocess.CalledProcessError) as error:
            parser.exit(1, 'POS1 preparation failed; run npm ci with Node, then retry --positions. Python-only startup still works with DDG1/raw fallback. '+str(error)+'\n')

if __name__=='__main__':main()
