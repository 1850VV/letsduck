import test from 'node:test';import assert from 'node:assert/strict';
import {createEditGuard} from '../frontend/shared/edit-guard.mjs';
test('stale windows and pending imports block writes without losing their in-memory draft',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)??null};const guard=createEditGuard(storage);
 assert.ok(guard.current());map.set('dd-backup-pending','pending');assert.equal(guard.current(),false);
 map.delete('dd-backup-pending');map.set('dd-studio-personal','imported');assert.equal(guard.current(),false);
 guard.accept();assert.ok(guard.current());
});
