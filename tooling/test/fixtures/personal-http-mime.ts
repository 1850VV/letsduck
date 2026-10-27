/** Controlled system configuration for isolated HTTP differential children, not a MIME oracle. */
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {mock} from 'node:test';
export const personalMimeProfiles={
 bare:'',
 apache:'text/plain conf\n',
 overrides:'application/x-letsduck-conf conf\ntext/x-letsduck-python py\ntext/x-letsduck-html htm\n',
} as const;
export type PersonalMimeProfile=keyof typeof personalMimeProfiles;
export function isPersonalMimeProfile(value:unknown):value is PersonalMimeProfile{return typeof value==='string'&&Object.hasOwn(personalMimeProfiles,value);}
export const personalMimeFiles=['/etc/mime.types','/etc/httpd/mime.types','/etc/httpd/conf/mime.types','/etc/apache/mime.types','/etc/apache2/mime.types','/usr/local/etc/httpd/conf/mime.types','/usr/local/lib/netscape/mime.types','/usr/local/etc/mime.types'] as const;
export function personalMimeInput(cases:unknown,profile:PersonalMimeProfile):string{return JSON.stringify({cases,mimeFiles:personalMimeFiles,mimeTypes:personalMimeProfiles[profile]});}
const selected=process.env.DUCK_PERSONAL_HTTP_MIME_PROFILE;
if(selected!==undefined){
 if(!isPersonalMimeProfile(selected))throw Error('Unknown personal HTTP MIME fixture: '+selected);
 const original=fs.readFileSync,configuration=personalMimeProfiles[selected];
 mock.method(fs,'readFileSync',(path:Parameters<typeof original>[0],options:Parameters<typeof original>[1])=>{
  if(typeof path==='string'&&personalMimeFiles.some(file=>file===path)){
   const content=path===personalMimeFiles[0]?configuration:'',encoding=typeof options==='string'?options:options?.encoding;
   return encoding?Buffer.from(content).toString(encoding):Buffer.from(content);
  }
  return original(path,options);
 });
 syncBuiltinESMExports();
}
