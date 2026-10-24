// Assembly coordinates are millimetres. A fixed 0.1 mm near plane wastes
// depth precision at overview distances: 0.015 mm hardware labels then fight
// their casing. Keep the near plane at 1% of the observed distance, so close
// inspection retains its foreground and the distant surfaces stay distinct.
export function updateAssemblyCameraDepth(camera,target){
 const near=Math.max(.1,camera.position.distanceTo(target)*.01);
 if(Math.abs(camera.near-near)<1e-6)return;
 camera.near=near;camera.updateProjectionMatrix();
}
