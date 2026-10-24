import test from 'node:test';
import assert from 'node:assert/strict';
import {createObservationSettings} from '../frontend/assemble/observation-settings.mjs';
test('quality and lighting persist independently and reload without resetting the other choice',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const settings=createObservationSettings(storage);
 assert.deepEqual(settings.state,{quality:'current',lighting:'neutral'});
 settings.set('quality','ultra');settings.set('lighting','display');settings.set('quality','current');
 assert.deepEqual(createObservationSettings(storage).state,{quality:'current',lighting:'display'});
 settings.set('lighting','invalid');assert.equal(settings.state.lighting,'display');settings.refresh();assert.equal(settings.state.lighting,'display');
});
test('legacy quality-only settings retain the matching old lighting; malformed/new versions preserve default',()=>{
 for(const [saved,want]of [[{quality:'ultra'}, {quality:'ultra',lighting:'display'}],[{version:1,quality:'ultra',lighting:'neutral'},{quality:'ultra',lighting:'neutral'}],[{version:99,quality:'ultra'},{quality:'current',lighting:'neutral'}]]){
  assert.deepEqual(createObservationSettings({getItem:()=>JSON.stringify(saved)}).state,want);
 }
 assert.deepEqual(createObservationSettings({getItem:()=>'{'}).state,{quality:'current',lighting:'neutral'});
});
test('blocked storage does not prevent applying settings or notifying subscribers',()=>{
 const settings=createObservationSettings({getItem(){throw Error();},setItem(){throw Error();}});let calls=0;
 settings.subscribe(()=>calls++);settings.set('lighting','display');assert.equal(calls,1);settings.refresh();assert.equal(settings.state.lighting,'display');
});
import * as THREE from '../frontend/vendor/three.module.js';
import {applyObservationLighting} from '../frontend/assemble/observation-lighting.mjs';
test('display lighting restores captured neutral parameters without changing quality budgets',()=>{
 const scene=new THREE.Scene(),key=new THREE.DirectionalLight(),fill=new THREE.DirectionalLight(),hemi=new THREE.HemisphereLight();
 const renderer={toneMappingExposure:.9,toneMapping:THREE.ACESFilmicToneMapping,pixelRatio:1},baseline={environment:null,environmentIntensity:1,exposure:.9,toneMapping:THREE.ACESFilmicToneMapping,keyPosition:new THREE.Vector3(1,2,3),keyIntensity:3.2,keyColor:new THREE.Color(0xfffbf7),fillPosition:new THREE.Vector3(4,5,6),fillIntensity:1.4,fillColor:new THREE.Color(0xdde9ff),hemiIntensity:2.2,shadowFar:500};
 const args={scene,renderer,key,fill,hemi,baseline,environment:()=>({texture:'studio'})};
 applyObservationLighting('display',args);assert.equal(key.shadow.camera.far,1100);assert.equal(scene.environment,'studio');assert.equal(hemi.intensity,.22);assert.equal(renderer.toneMappingExposure,1.03);
 applyObservationLighting('neutral',args);assert.equal(key.shadow.camera.far,500);assert.equal(scene.environment,null);assert.equal(hemi.intensity,2.2);assert.deepEqual(key.position.toArray(),[1,2,3]);assert.equal(renderer.toneMappingExposure,.9);assert.equal(renderer.pixelRatio,1);
});
test('external preference refresh applies one complete pair without writing partial state back',()=>{
 let saved=null,writes=0;const storage={getItem:()=>saved,setItem(){writes++;}},settings=createObservationSettings(storage),observed=[];
 settings.subscribe(state=>observed.push(state));saved='{"version":1,"quality":"ultra","lighting":"display"}';settings.refresh();
 assert.deepEqual(settings.state,{quality:'ultra',lighting:'display'});assert.equal(writes,0);assert.deepEqual(observed,[{quality:'ultra',lighting:'display'}]);settings.refresh();assert.equal(observed.length,1);
});
import {LOCALES,translate} from '../frontend/shared/i18n.mjs';
import {observationMessages} from '../frontend/locales/observation.mjs';
test('all supported locale settings labels and material guidance resolve locally without fallback keys',()=>{
 for(const {code}of LOCALES)for(const key of Object.keys(observationMessages.en)){
  assert.equal(typeof observationMessages[code][key],'string',`${code} ${key}`);
  assert.equal(translate(code,key),observationMessages[code][key]);assert.ok(translate(code,key).trim());
 }
});
