import {join,resolve} from 'node:path';
export interface PathOptions{packaged:boolean;moduleDirectory:string;appPath:string;resourcesPath:string;appData:string;env:NodeJS.ProcessEnv}
export function desktopPaths(options:PathOptions){
 const {env}=options,repo=resolve(options.moduleDirectory,'../../..'),modules=options.packaged?join(options.appPath,'apps/desktop/dist'):options.moduleDirectory;
 const runtime=join(options.resourcesPath,'runtime');
 return{host:join(modules,'host.js'),preload:join(modules,'preload.cjs'),panel:join(modules,'update-panel.js'),
  assets:resolve(env.DUCK_ASSETS??(options.packaged?join(runtime,'assets'):join(repo,'assets'))),
  frontend:resolve(env.DUCK_FRONTEND??(options.packaged?join(runtime,'frontend'):join(repo,'frontend/dist'))),
  assemblyManifest:resolve(env.DUCK_ASSEMBLY_MANIFEST??(options.packaged?join(runtime,'assembly-assets.json'):join(repo,'scripts/assembly-assets.json'))),
  userData:resolve(env.DUCK_DESKTOP_DATA??join(options.appData,'letsduck'))};
}
