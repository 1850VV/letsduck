/** Disposable browser fixture. Every controller call uses BrowserFirmware. */
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createBrowserFixture} from './browser/fixture.js';
export {createBrowserFixture,BrowserFirmware} from './browser/fixture.js';
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const fixture=await createBrowserFixture({mode:'debug'});
 try{
  console.log(JSON.stringify({url:fixture.url,temporaryDirectory:fixture.directory,isolated:true,hardware:false}));
  await new Promise<void>(resolve=>{process.once('SIGTERM',resolve);process.once('SIGINT',resolve);});
 }finally{await fixture.close();}
}
