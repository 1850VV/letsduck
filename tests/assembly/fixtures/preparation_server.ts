/** Disconnected preparation-only fixture. Its temporary DB path is supplied by its owner. */
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createBrowserFixture} from '../../browser/fixture.js';
export {createBrowserFixture} from '../../browser/fixture.js';
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),database=args[args.indexOf('--db')+1];
 if(!args.includes('--db')||!database)throw Error('Use --db with a disposable temporary SQLite path');
 const fixture=await createBrowserFixture({mode:'preparation',database,confirmedLeads:args.includes('--confirmed-leads')});
 try{
  console.log(JSON.stringify({url:fixture.url,temporaryDirectory:fixture.directory,catalog:fixture.catalog,isolated:true,hardware:false,assemblyAdmission:'preparation-only'}));
  await new Promise<void>(resolve=>{process.once('SIGTERM',resolve);process.once('SIGINT',resolve);});
 }finally{await fixture.close();}
}
