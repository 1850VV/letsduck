"""Import the assembly guide's local assets (models, videos, music) into assets/assembly. No network access.

The files keep their own terms and never go into Git. Every file must match scripts/assembly-assets.json.
Source: a folder holding them, or a local Git ref such as origin/codex/assembly-tutorial.
"""
import argparse, hashlib, json, shutil, subprocess, tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=json.loads((ROOT/'scripts'/'assembly-assets.json').read_text())

def read_folder(source):
    source=Path(source)
    def read(name):
        path=source/name
        if not path.is_file() or path.is_symlink():raise ValueError('Missing assembly asset: '+name)
        return path.read_bytes()
    return read

def read_git(ref):
    def read(name):
        spec='%s:%s/%s'%(ref,MANIFEST['gitPath'],name)
        try:return subprocess.run(['git','cat-file','blob',spec],cwd=ROOT,check=True,capture_output=True).stdout
        except subprocess.CalledProcessError:raise ValueError('Missing assembly asset in %s: %s'%(ref,name))
    return read

def import_assets(read,target):
    target=Path(target)
    files=dict(MANIFEST['files']);optional={}
    for name,meta in MANIFEST.get('optionalFiles',{}).items():
        try:data=read(name)
        except ValueError:continue
        if len(data)!=meta['bytes'] or hashlib.sha256(data).hexdigest()!=meta['sha256']:
            raise ValueError('Assembly reference does not match the manifest: '+name)
        files[name]=meta;optional[name]=data
    # Check every file before writing any; never replace a different file already in place.
    for name,meta in files.items():
        dest=target/name
        if dest.exists() and (dest.is_symlink() or hashlib.sha256(dest.read_bytes()).hexdigest()!=meta['sha256']):
            raise FileExistsError('Different assembly asset already exists: '+name)
    target.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(dir=target) as tmp:
        for name,meta in files.items():
            if (target/name).exists():continue
            data=optional[name] if name in optional else read(name)
            if len(data)!=meta['bytes'] or hashlib.sha256(data).hexdigest()!=meta['sha256']:
                raise ValueError('Assembly asset does not match the manifest: '+name)
            staged=Path(tmp)/name;staged.parent.mkdir(parents=True,exist_ok=True);staged.write_bytes(data)
        for staged in sorted(Path(tmp).rglob('*')):
            if staged.is_file():
                dest=target/staged.relative_to(tmp);dest.parent.mkdir(parents=True,exist_ok=True);staged.replace(dest)
    return sum(meta['bytes'] for meta in files.values())

def main():
    parser=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument('source',nargs='?',type=Path,help='Folder with the assembly assets')
    group.add_argument('--git',metavar='REF',help='Read them from a local Git ref, e.g. origin/codex/assembly-tutorial')
    parser.add_argument('--target',type=Path,default=ROOT/'assets'/'assembly')
    args=parser.parse_args()
    try:size=import_assets(read_git(args.git) if args.git else read_folder(args.source),args.target)
    except (ValueError,OSError) as error:parser.exit(1,str(error)+'\n')
    print('Imported assembly assets (%.1f MB) into %s.'%(size/1e6,args.target))
    print('These assets retain their own terms; do not add them to Git.')

if __name__=='__main__':main()
