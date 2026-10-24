// Shared contract: consumers observe draft/saving/saved/failed; only the API result establishes saved.
export function createSaveStatus(notify=()=>{}){
 let busy=false;
 return {async save(candidate,write){
  if(busy)throw Error('save.busy');busy=true;notify({state:'saving'});
  try{const result=await write(candidate);notify({state:'saved',id:result.id,name:result.name});return result;}
  catch(error){notify({state:'failed',error});throw error;}
  finally{busy=false;}
 }};
}
