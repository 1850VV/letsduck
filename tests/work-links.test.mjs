import test from 'node:test';
import assert from 'node:assert/strict';
import {publicOrigin, workURL, parseWorkLink, copyText} from '../frontend/shared/work-links.mjs';

test('canonical published work links use configured HTTPS origin, never browser aliases', () => {
  assert.equal(workURL('https://DUCK.example.com/', 'work_abc-123'), 'https://duck.example.com/gallery/#d/work_abc-123');
  assert.equal(workURL('https://duck.example.com', 'official-2'), 'https://duck.example.com/gallery/#d/official-2');
});
test('missing, local, private or malformed origins cannot produce share links', () => {
  for (const origin of ['', null, 'http://duck.example.com', 'https://localhost', 'https://127.0.0.1',
    'https://[::1]', 'https://192.168.1.5', 'https://duck.local', 'https://duck',
    'https://user:pass@duck.example.com', 'https://duck.example.com/path', 'https://duck.example.com/?x=y', 'https://duck.example.com/#x']) {
    assert.equal(publicOrigin(origin), null, String(origin));
    assert.equal(workURL(origin, 'work-123'), null);
  }
});
test('private drafts and unsafe IDs never become work URLs', () => {
  for (const id of ['', null, 's:private', '../other', 'x/y', 'x#z', 'x'.repeat(65)]) {
    assert.equal(workURL('https://duck.example.com', id), null, String(id));
  }
});
test('pasting a canonical work link extracts only same-site work identities', () => {
  const base = 'https://duck.example.com';
  assert.equal(parseWorkLink(base+'/gallery/#d/official-2', base), 'official-2');
  for (const url of ['https://attacker.example/gallery/#d/official-2', base+'/#d/official-2', base+'/gallery/#d/%E0%A4', base+'/gallery/#d/s%3Aprivate']) {
    assert.equal(parseWorkLink(url, base), null);
  }
});
test('copy waits for clipboard completion and propagates denial for manual fallback', async () => {
  const value = workURL('https://duck.example.com', 'official-2');
  let written;
  await copyText(value, {async writeText(text) { written = text; }});
  assert.equal(written, value);
  await assert.rejects(copyText(value, {async writeText() { throw Error('denied'); }}), /denied/);
  await assert.rejects(copyText(value, null), /clipboard/);
  await assert.rejects(copyText(null, {writeText() { throw Error('must not write'); }}), /empty/);
});
