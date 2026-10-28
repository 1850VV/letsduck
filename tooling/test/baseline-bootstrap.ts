/** Explicit historical/test entry strings; never normal runtime dependencies. */
export const pythonBootstrap=String.raw`
import os, sys, json, signal, threading
from pathlib import Path
sys.path.insert(0, str(Path(os.environ['DUCK_REFERENCE']) / 'personal'))
import app
from servo_setup import AdbRuntime
assert AdbRuntime.executable() == os.environ['DUCK_ADB'], 'Unsafe ADB fallback'
app.FRONTEND = Path(os.environ['DUCK_FRONTEND'])
server = app.create_server('127.0.0.1', 0, db=Path(os.environ['DUCK_PERSONAL_DB']), legacy=Path(os.environ['DUCK_DB']), search=1)
def stop(signum, frame):
 threading.Thread(target=server.shutdown, daemon=True).start()
signal.signal(signal.SIGINT, stop)
signal.signal(signal.SIGTERM, stop)
print(json.dumps({'url':'http://127.0.0.1:%d' % server.server_address[1], 'python':sys.version.split()[0], 'adbGuard':'owned executable selected'}), flush=True)
try:
 server.serve_forever()
finally:
 server.server_close()
 server.store.close()
`;
export const nodeBootstrap=String.raw`
import{pathToFileURL}from'node:url';
const {startHost,loadAssemblyManifest}=await import(pathToFileURL(process.env.DUCK_HOST_ENTRY).href);
const runtime={serial:null,port:null,async connect(){throw Error('Hardware blocked in comparison')},async request(){throw Error('Hardware blocked in comparison')},async halt(){throw Error('Hardware blocked in comparison')},async close(){}};
const host=await startHost({assets:process.env.DUCK_ASSETS,frontend:process.env.DUCK_FRONTEND,database:process.env.DUCK_PERSONAL_DB,legacy:process.env.DUCK_DB,host:'127.0.0.1',port:0,search:1,uiOrigin:process.env.DUCK_UI_ORIGIN,runtime,assemblyManifest:loadAssemblyManifest(process.env.DUCK_MANIFEST)});
let stopping;const stop=()=>{stopping??=host.close();stopping.catch(error=>{console.error(error);process.exitCode=1;});};process.once('SIGINT',stop);process.once('SIGTERM',stop);console.log(JSON.stringify({url:host.url}));
`;
