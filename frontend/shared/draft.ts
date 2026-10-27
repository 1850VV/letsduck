import {jsonParse} from './json.js';
import {record,stringRecord,wireNumber} from './guards.js';
import type {WireInteger} from './types.js';
// The personal studio's current draft, as the home page and the assembly guide see it. The studio saves
// { draft: { design, name, activeId, updated } } under this key; `updated` is set only by real edits.
export function readDraft():{name?:string;saved:boolean;updated:WireInteger;colors:Record<string,string>;finishes:Record<string,string>}|null {
  try {
    const text=localStorage.getItem('dd-studio-personal');if(!text)return null;
    const state=jsonParse(text),draft=record(state)?state.draft:null;
    if (!record(draft)||!draft.updated||!wireNumber(draft.updated)) return null;
    const design=draft.design;if(!record(design)||!stringRecord(design.colors))return null;const finishes=design.finishes||{};if(!stringRecord(finishes))return null;
    return { ...(typeof draft.name==='string'?{name:draft.name}:{}), saved: !!draft.activeId, updated: draft.updated, colors: design.colors, finishes };
  } catch {return null;}
}
