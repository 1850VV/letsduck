"""Check tracked content before publication. Heuristics, not a security guarantee."""
import hashlib, json, re, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RULES={
    'home-path':rb'/(?:Users|home)/[^/\s"\x27<>]+/',
    'temporary-path':rb'/var/folders/[A-Za-z0-9_/.-]+',
    'preview-access-key':rb'[?&]key=[A-Za-z0-9_-]{16,}',
    'github-token':rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})',
    'api-secret':rb'sk-(?:proj-)?[A-Za-z0-9_-]{24,}',
    'private-key':rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'private-chat-link':rb'(?:chatgpt-conversation|codex)://[^\s]+',
    'credential-url':rb'https?://[^/\s:@]+:[^/\s@]+@',
}
LOCAL_ONLY={'source.3mf','geometry.bin','geometry.pack.bin','model.json','catalog.json','export-schema.json'}
# README screenshots/clips show model renders; the owner approved publishing them (2026-10-23).
MEDIA,MEDIA_MAX='docs/media/',3_000_000

def audit():
    files=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
    findings=[];count=0
    for name in filter(None,files):
        count+=1;p=ROOT/name
        if p.is_symlink():findings.append({'file':name,'rule':'symlink'});continue
        media=name.startswith(MEDIA) and p.suffix.lower() in {'.jpg','.gif'}
        if media and p.stat().st_size>MEDIA_MAX:
            findings.append({'file':name,'rule':'readme-media-too-large'})
        if p.name in LOCAL_ONLY or (not media and p.suffix.lower() in {'.3mf','.stl','.zip','.bin','.png','.jpg','.gif','.webm','.mp4','.pdf'}):
            findings.append({'file':name,'rule':'local-only-or-unreviewed-binary'})
        if any(s in {'.env','.codex','.agents','.playwright-cli','.ryugi','node_modules','__pycache__'}for s in p.relative_to(ROOT).parts):
            findings.append({'file':name,'rule':'private-or-generated-path'})
        data=p.read_bytes()
        for rule,pattern in RULES.items():
            for match in re.finditer(pattern,data):
                findings.append({'file':name,'line':data[:match.start()].count(b'\n')+1,'rule':rule})
    result={'filesChecked':count,'findings':findings}
    print(json.dumps(result,ensure_ascii=False,indent=2));return bool(findings)

if __name__=='__main__':sys.exit(audit())
