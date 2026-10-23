import {creased,decodePositions} from './positions.mjs';
import {MeshoptDecoder} from '../vendor/meshopt_decoder.mjs';
self.onmessage=async({data:{buffer,model,print=false}})=>{
  try {
    await MeshoptDecoder.ready;
    const meshes=decodePositions(buffer,MeshoptDecoder,model).filter(m=>!print||m.kind==='part').map(m=>{
      let positions=m.positions;
      if(print){
        if(!m.printMatrix)throw Error('Missing print matrix '+m.id);
        positions=new Float32Array(positions.length);
        for(let i=0;i<positions.length;i+=3)for(let k=0;k<3;k++){
          const a=m.printMatrix[k];positions[i+k]=a[0]*m.positions[i]+a[1]*m.positions[i+1]+a[2]*m.positions[i+2]+a[3];
        }
      }
      return {...m,...creased(positions,m.indices)};
    });
    self.postMessage({meshes},meshes.flatMap(m=>[m.positions.buffer,m.normals.buffer,m.indices.buffer]));
  } catch(error) {self.postMessage({error:String(error)});}
};
