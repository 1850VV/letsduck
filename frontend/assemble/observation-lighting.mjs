import * as THREE from '../vendor/three.module.js';
// Exact existing current/ultra illumination, separated from their render budgets.
export function applyObservationLighting(value,{scene,renderer,key,fill,hemi,baseline,environment}){
 // Shadow coverage follows the light position, not the texture resolution.
 key.shadow.camera.far=value==='display'?1100:baseline.shadowFar;
 if(value==='display'){
  scene.environment=environment().texture;scene.environmentIntensity=.72;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
  hemi.intensity=.22;key.position.set(-280,500,330);key.intensity=3.2;key.color.set(0xfff0dd);fill.position.set(170,160,-130);fill.intensity=.5;fill.color.set(0xdce9ff);
 }else{
  scene.environment=baseline.environment;scene.environmentIntensity=baseline.environmentIntensity;renderer.toneMappingExposure=baseline.exposure;renderer.toneMapping=baseline.toneMapping;
  hemi.intensity=baseline.hemiIntensity;key.position.copy(baseline.keyPosition);key.intensity=baseline.keyIntensity;key.color.copy(baseline.keyColor);fill.position.copy(baseline.fillPosition);fill.intensity=baseline.fillIntensity;fill.color.copy(baseline.fillColor);
 }
}
