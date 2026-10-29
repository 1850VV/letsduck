import {loadEdition} from './edition.js';
import {ExperimentalAccess,accessStorage} from '../home/experimental-access.js';
import type {ExperimentalDuck} from '../home/experimental-access.js';
export async function admitExperimental(id:ExperimentalDuck){
 const edition=await loadEdition().catch(()=>null);
 if(!new ExperimentalAccess(edition,accessStorage()).locked(id))return true;
 location.replace('/home.html?unlock='+id);return false;
}
