import {PERSONAL_KEY} from './personal-state.mjs';
import {JOURNAL_KEY} from './backup-adapter.mjs';
// Compare before every write, including API saves from a retained/stale window.
export function createEditGuard(storage){
 let expected=storage.getItem(PERSONAL_KEY);
 return {
  current(){return !storage.getItem(JOURNAL_KEY)&&storage.getItem(PERSONAL_KEY)===expected;},
  accept(){expected=storage.getItem(PERSONAL_KEY);}
 };
}
