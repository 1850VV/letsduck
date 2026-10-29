import {readFileSync} from 'node:fs';
import {jsonParse} from '../../frontend/shared/json.js';
import {parseCatalog,parseModelManifest} from '../../frontend/shared/guards.js';
import {parseBindings} from '../../frontend/assemble/servo-types.js';
import {servoMap} from '@letsduck/contracts';
export const readModel=(path:string|URL)=>parseModelManifest(jsonParse(readFileSync(path,'utf8')));
export const readCatalog=(path:string|URL)=>parseCatalog(jsonParse(readFileSync(path,'utf8')));
export const readServoMap=()=>parseBindings(servoMap);
/** Replace only this test's global boundary; restore the original descriptor exactly. */
export function replaceProperty(target:object,key:PropertyKey,value:unknown){const previous=Object.getOwnPropertyDescriptor(target,key);Object.defineProperty(target,key,{value,writable:true,configurable:true});return()=>{if(previous)Object.defineProperty(target,key,previous);else Reflect.deleteProperty(target,key);};}
