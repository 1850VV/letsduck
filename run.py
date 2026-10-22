"""来做鸭 letsduck personal edition launcher: `python3 run.py` (Windows: `py -3 run.py`).

Needs only Python 3.9+; nothing to install. Double-click 启动来做鸭.command (macOS) or 启动来做鸭.bat (Windows)
to run it. The server edition (accounts + 配色广场) is deployed with Docker; see docs/deployment.md.
"""
import sys

if sys.version_info < (3, 9):
    print('来做鸭需要 Python 3.9 或更新版本，当前是 %d.%d。letsduck needs Python 3.9+.' % sys.version_info[:2])
    raise SystemExit(1)

from pathlib import Path

ROOT = Path(__file__).resolve().parent
FILES = ('source.3mf', 'geometry.bin', 'model.json', 'catalog.json', 'export-schema.json')

if __name__ == '__main__':
    for stream in (sys.stdout, sys.stderr):  # a legacy Windows console must not crash on Chinese text
        if hasattr(stream, 'reconfigure'):
            stream.reconfigure(errors='replace')
    missing = [name for name in FILES if not (ROOT / 'assets' / name).is_file()]
    if missing:
        print('还缺少模型资产包（单独授权，不随源码提供）：' + ', '.join(missing), file=sys.stderr)
        print('请参考 docs/local-assets.md，然后运行：python3 scripts/import_local_assets.py <资产文件夹>', file=sys.stderr)
        raise SystemExit(2)
    sys.path.insert(0, str(ROOT / 'personal'))
    import app
    raise SystemExit(app.main(sys.argv[1:]))
