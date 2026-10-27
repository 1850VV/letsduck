/** Exact Worker lifecycle used by the loader, with Node's real EventTarget. */
export class FixtureWorker extends EventTarget implements Worker {
  closed=false;posted?:boolean;
  onerror:Worker['onerror']=null;
  onmessage:Worker['onmessage']=null;
  onmessageerror:Worker['onmessageerror']=null;
  postMessage(_message:unknown,_options?:Transferable[]|StructuredSerializeOptions){this.posted=true;}
  terminate(){this.closed=true;}
}
export class FixtureWorkerError extends Event implements ErrorEvent {
  colno=0;error:unknown=undefined;filename='fixture-worker';lineno=0;message='Synthetic early worker failure';
  constructor(){super('error',{cancelable:true});}
}
