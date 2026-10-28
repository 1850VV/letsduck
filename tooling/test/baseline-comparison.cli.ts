/** Opt-in acceptance runner: invoke with tsx; never imported by production builds. */
import {parseArgs} from 'node:util';
import {resolve,join} from 'node:path';
import {captureComparison} from './baseline-comparison.js';
const{values}=parseArgs({options:{python:{type:'string'},revision:{type:'string'},repository:{type:'string'},assets:{type:'string'},frontend:{type:'string'},output:{type:'string'},pilot:{type:'boolean',default:false},rounds:{type:'string',default:'3'},'save-samples':{type:'string',default:'30'},'export-samples':{type:'string',default:'10'}}});
if(!values.python||!values.revision||!values.output)throw Error('--python, --revision and private --output are required');
const repository=resolve(values.repository??resolve(import.meta.dirname,'../..'));
await captureComparison({repository,assets:resolve(values.assets??join(repository,'assets')),frontend:resolve(values.frontend??join(repository,'frontend/dist')),output:resolve(values.output),python:values.python,revision:values.revision,rounds:Number(values.rounds),saveSamples:Number(values['save-samples']),exportSamples:Number(values['export-samples']),pilot:values.pilot});
