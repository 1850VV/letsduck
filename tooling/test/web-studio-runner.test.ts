import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('browser CLI rejects missing check and missing explicit owned URL',()=>{
 const run=(args:string[])=>spawnSync(process.execPath,['--import','tsx','tests/browser/run-check.ts',...args],{encoding:'utf8',cwd:process.cwd()});
 const empty=run([]);assert.notEqual(empty.status,0);assert.match(empty.stderr,/--check/);
 const missing=run(['--check','tests/personal-browser.ts']);assert.notEqual(missing.status,0);assert.match(missing.stderr,/--url.*--fixture/);
});
