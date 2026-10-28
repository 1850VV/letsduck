import type {SiteConfiguration} from '../shared/edition.js';
export type ExperimentalDuck='debug'|'assemble';
export const experimentalDuck=(id:string):id is ExperimentalDuck=>id==='debug'||id==='assemble';
export const ACCESS_KEY='letsduck.experimental-access.v1';
type AccessStorage=Pick<Storage,'getItem'|'setItem'>;
export function accessStorage():AccessStorage{
 return {getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
}
/** First-use acknowledgement only; device and numbering checks remain independent. */
export class ExperimentalAccess{
 private unlocked:Record<ExperimentalDuck,boolean>={debug:false,assemble:false};
 constructor(public edition:SiteConfiguration['edition']|null,private storage:AccessStorage){this.reload();}
 reload(){
  this.unlocked={debug:false,assemble:false};
  try{const raw:unknown=JSON.parse(this.storage.getItem(ACCESS_KEY)??'null');if(raw&&typeof raw==='object'&&!Array.isArray(raw))for(const id of ['debug','assemble'] as const)this.unlocked[id]=id in raw&&Reflect.get(raw,id)===true;}catch{/* Missing or damaged preferences require a new acknowledgement. */}
 }
 locked(id:string){return experimentalDuck(id)&&(!this.edition||(id==='debug'&&this.edition==='server')||!this.unlocked[id]);}
 unlock(id:ExperimentalDuck){
  if(!this.edition||(id==='debug'&&this.edition==='server'))return false;
  const next={...this.unlocked,[id]:true};
  try{this.storage.setItem(ACCESS_KEY,JSON.stringify(next));this.unlocked=next;return true;}catch{return false;}
 }
}
