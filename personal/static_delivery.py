"""Verified prepared transport files; missing or stale sidecars use dynamic delivery."""
import hashlib
import json


def prepared_gzip(target, raw_digest):
    try:
        meta = json.loads(target.with_name(target.name + '.gzip.json').read_text())
        if meta['version'] != 1 or meta['raw'] != raw_digest:
            return None
        data = target.with_name(target.name + '.gz').read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        if digest == meta['gzip']:
            return data, digest
    except (OSError, ValueError, TypeError, KeyError):
        pass
    return None
