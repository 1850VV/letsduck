"""Versioned, asset-free personal backup validation. No untrusted paths or SQL."""
import hashlib
import json
import re
import time
from pathlib import Path
STEP_IDS = json.loads((Path(__file__).resolve().parents[1] / "frontend/shared/backup-steps.json").read_text())["steps"]
STEP_IDS = [s["id"] for s in STEP_IDS]
from rules import scheme_values

class BackupError(ValueError):
    def __init__(self, code):
        super().__init__(code)
        self.code = code
        self.params = {}

FORMAT = 'letsduck-personal'
LIMIT = 2_000_000
ID = re.compile(r'^[A-Za-z0-9_-]{1,64}$')

def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=True, separators=(',', ':'), allow_nan=False)

def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()

def seal(schemes, browser):
    value = {'format': FORMAT, 'version': 1, 'createdWith': '3.1.0', 'createdAt': int(time.time()*1000), 'schemes': schemes, 'browser': browser}
    value['checksum'] = digest(value)
    return value

def _validate(value, part_ids):
    if not isinstance(value, dict) or len(canonical(value)) > LIMIT:
        raise ValueError('backup.invalid')
    if value.get('format') != FORMAT or type(value.get('version')) is not int or value.get('version') != 1:
        raise BackupError('backup.version')
    raw = {k: v for k, v in value.items() if k != 'checksum'}
    if set(raw) != {'format', 'version', 'createdWith', 'createdAt', 'schemes', 'browser'} or value.get('checksum') != digest(raw):
        raise ValueError('backup.checksum')
    if not isinstance(raw['createdWith'],str) or len(raw['createdWith'])>40 or type(raw['createdAt']) is not int or raw['createdAt'] < 0:
        raise ValueError('backup.metadata')
    schemes = raw['schemes']
    if not isinstance(schemes, list) or len(schemes) > 30:
        raise ValueError('backup.schemes')
    ids = set()
    def scheme(row, register=True):
        if not isinstance(row, dict) or not ID.fullmatch(row.get('id', '')) or register and row['id'] in ids:
            raise ValueError('backup.id')
        if register: ids.add(row['id'])
        if set(row) - {'id','name','design','voiceSalt','created','updated','provenance','revision'}:
            raise ValueError('backup.fields')
        if not isinstance(row.get('name'), str) or not 1 <= len(row['name'].strip()) <= 40:
            raise ValueError('backup.name')
        if row.get('provenance') is not None:  # only the app's public provenance fields
            p = row['provenance']
            if not isinstance(p, dict) or set(p) - {'workId','title','author'} or any(not isinstance(v, str) or len(v)>300 for v in p.values()):
                raise ValueError('backup.provenance')
        for key in ('created','updated'):
            if key in row and (type(row[key]) is not int or not 0 <= row[key] <= 2**53-1): raise ValueError('backup.time')
        if type(row.get('voiceSalt', 0)) is not int or not 0 <= row.get('voiceSalt', 0) <= 2**31-1:
            raise ValueError('backup.voice')
        design = row.get('design')
        if not isinstance(design,dict) or set(design) - {'colors','assignments','finishes'} or not design.get('colors'):
            raise ValueError('backup.design')
        if set(design.get('colors',{})) != set(design.get('assignments',{})):
            raise ValueError('backup.parts')
        scheme_values(row['id'], row, part_ids)
    for row in schemes: scheme(row)
    browser = raw['browser']
    if not isinstance(browser, dict) or set(browser) != {'draft','progress'}:
        raise ValueError('backup.browser')
    draft = browser['draft']
    scopes = {'scheme:'+sid for sid in ids} | {'blank'}
    if draft is not None:
        if not isinstance(draft, dict) or set(draft) - {'name','design','provenance','voiceSalt','activeId','draftId','updated'}:
            raise ValueError('backup.draft')
        active, did = draft.get('activeId'), draft.get('draftId')
        if active and active not in ids or did and (not isinstance(did,str) or not ID.fullmatch(did)):
            raise ValueError('backup.relationship')
        scheme({k:v for k,v in dict(draft,id='backup-draft').items() if k not in ('activeId','draftId')}, register=False)
        if not active and not did: raise ValueError('backup.draft_id')
        if did: scopes.add('draft:'+did)
    progress = browser['progress']
    if not isinstance(progress,list) or len(progress)>32: raise ValueError('backup.progress')
    used = set()
    for row in progress:
        if not isinstance(row,dict) or set(row) != {'scope','tutorial','stepIds','view','seen','built'} or row['scope'] not in scopes or row['scope'] in used:
            raise ValueError('backup.relationship')
        used.add(row['scope'])
        steps = row['stepIds']
        if row['tutorial'] != 'hardware-v3' or steps != STEP_IDS or not isinstance(steps,list) or not 1 <= len(steps) <= 200 or any(not isinstance(s,str) or len(s)>80 for s in steps) or len(set(steps)) != len(steps):
            raise ValueError('backup.tutorial')
        view = row['view']
        if not isinstance(view,dict) or set(view) != {'step','progress'} or type(view['step']) is not int or not 0 <= view['step'] < len(steps) or type(view['progress']) not in (int,float) or not 0 <= view['progress'] <= 1:
            raise ValueError('backup.view')
        for kind in ('seen','built'):
            if not isinstance(row[kind],list) or len(row[kind]) != len(set(row[kind])) or any(s not in steps for s in row[kind]):
                raise ValueError('backup.checks')
    return raw


def validate(value, part_ids):
    try:
        return _validate(value, part_ids)
    except BackupError:
        raise
    except (ValueError, TypeError, KeyError, OverflowError, RecursionError) as error:
        raise BackupError('backup.invalid') from error
