"""Run an isolated benchmark only after owning the coordinator's atomic mkdir lock."""
import argparse
import datetime
import json
import os
from pathlib import Path
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parents[1]


def run(command, lock):
    try:
        lock.mkdir()
    except FileExistsError:
        print('Benchmark lock busy; command was not started.', file=sys.stderr)
        return 75
    token = uuid.uuid4().hex
    owner = lock / 'owner'
    owner.write_text(json.dumps({'task': 'assets-first-activation', 'pid': os.getpid(), 'token': token,
                                'started': datetime.datetime.now(datetime.timezone.utc).isoformat()}))
    try:
        return subprocess.call(command, cwd=str(ROOT))
    finally:
        if json.loads(owner.read_text()).get('token') == token:
            owner.unlink()
            lock.rmdir()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lock', required=True, type=Path, help='Coordinator-provided shared lock path')
    parser.add_argument('command', nargs=argparse.REMAINDER)
    arguments = parser.parse_args()
    if not arguments.command:
        parser.error('a command is required')
    raise SystemExit(run(arguments.command, arguments.lock))
