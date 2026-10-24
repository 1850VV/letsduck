import {createObservationSettings,OBSERVATION_KEY} from './observation-settings.mjs';
let storage;try{storage=globalThis.localStorage;}catch{}
export const observationSettings=createObservationSettings(storage);
// Retained assembly pages refresh preferences when revisited or another window changes them.
export function refreshObservationSettings(){
 observationSettings.refresh();
}
globalThis.addEventListener?.('storage',event=>{if(event.key===OBSERVATION_KEY||event.key===null)refreshObservationSettings();});
