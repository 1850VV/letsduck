import {parseResponseJson} from './json.js';
import {record} from './guards.js';
export interface SiteConfiguration {edition:'personal'|'server';assembly?:boolean;publicUrl?:string}
// Fail closed if configuration is unavailable: do not guess the storage mode.
let configuration:Promise<SiteConfiguration>|undefined;
export function loadSite():Promise<SiteConfiguration> {
  return configuration ||= fetch('/api/site').then(async response => {
    if (!response.ok) throw Error('Site configuration unavailable');
    const data=await parseResponseJson(response);
    if (!record(data)||(data.edition!=='personal'&&data.edition!=='server')||(data.assembly!==undefined&&typeof data.assembly!=='boolean')||(data.publicUrl!==undefined&&typeof data.publicUrl!=='string')) throw Error('Invalid deployment edition');
    return {...data,edition:data.edition,...(typeof data.assembly==='boolean'?{assembly:data.assembly}:{}),...(typeof data.publicUrl==='string'?{publicUrl:data.publicUrl}:{})};
  });
}
export const loadEdition = () => loadSite().then(data => data.edition);
