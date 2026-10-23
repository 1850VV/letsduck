// One read in flight; replace queued moves instead of building a GPU backlog.
export function hoverQueue(read,apply) {
  let version=0,next=null,running=false;
  async function pump(){
    if(running)return;running=true;
    try{while(next){const job=next;next=null;const id=await read(job.value);if(job.version===version&&id!==undefined)apply(id,job.value);}}
    finally{running=false;}
  }
  return {submit(value){next={value,version:++version};void pump();},cancel(){version++;next=null;}};
}
