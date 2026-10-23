import {creased,decodePositions} from './positions.mjs';
import {MeshoptDecoder} from '../vendor/meshopt_decoder.mjs';
self.onmessage=async({data:{buffer,model}})=>{
  try {
    await MeshoptDecoder.ready;
    const meshes=decodePositions(buffer,MeshoptDecoder,model).map(m=>({...m,...creased(m.positions,m.indices)}));
    self.postMessage({meshes},meshes.flatMap(m=>[m.positions.buffer,m.normals.buffer,m.indices.buffer]));
  } catch(error) {self.postMessage({error:String(error)});}
};
