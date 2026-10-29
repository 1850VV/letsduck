/** Run all owned Node web tests; disclose checks that need a separately licensed asset pack. */
import {existsSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {parseArgs} from 'node:util';
const root=resolve(import.meta.dirname,'../..'),{values}=parseArgs({options:{'require-assets':{type:'boolean'}}});
const requirements:Readonly<Record<string,readonly string[]>>={
 'tests/test_focus.ts':['assets/model.json'],
 'tests/test_workflows.ts':['assets/model.json','assets/catalog.json'],
 'tests/test_workbench.ts':['assets/model.json','assets/catalog.json'],
 'tests/test_quick_style.ts':['assets/model.json','assets/catalog.json'],
 'tests/assembly/cable-clearance.test.ts':['assets/assembly/full-assembly.json','assets/assembly/full-assembly.bin'],
 'tests/assembly/part-geometry.test.ts':['assets/assembly/full-assembly.json','assets/assembly/full-assembly.bin'],
 'tests/assembly/hardware-models.test.ts':['assets/assembly/hardware-v2'],
};
const files=[...readdirSync(join(root,'tests')).filter(file=>file.endsWith('.test.ts')||/^test_.*\.ts$/.test(file)).map(file=>'tests/'+file),...readdirSync(join(root,'tests/assembly')).filter(file=>file.endsWith('.test.ts')).map(file=>'tests/assembly/'+file)].sort();
const missing=files.filter(file=>requirements[file]?.some(path=>!existsSync(join(root,path))));
if(missing.length){console.log('Licensed asset checks not executed:\n'+missing.map(file=>'  '+file).join('\n'));if(values['require-assets']){console.error('Import the authorized asset pack before the full migration acceptance run.');process.exit(2);}}
const selected=files.filter(file=>!missing.includes(file));if(!selected.length)throw new Error('No Node web tests selected');
const result=spawnSync(process.execPath,['--import','tsx','--test','--test-concurrency=1',...selected],{cwd:root,stdio:'inherit'});if(result.error)throw result.error;process.exitCode=result.status??(result.signal==='SIGINT'?130:result.signal==='SIGTERM'?143:1);
