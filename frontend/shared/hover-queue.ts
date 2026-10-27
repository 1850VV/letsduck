// One read in flight; replace queued moves instead of building a GPU backlog.
export function hoverQueue<T,R>(read:(value:T)=>Promise<R|undefined>,apply:(id:R,value:T)=>void) {
  let version=0,next:{value:T;version:number}|null=null,running=false;
  async function pump(){
    if(running)return;running=true;
    try{while(next){const job=next;next=null;const id=await read(job.value);if(job.version===version&&id!==undefined)apply(id,job.value);}}
    finally{running=false;}
  }
  return {submit(value:T){next={value,version:++version};void pump();},cancel(){version++;next=null;}};
}
