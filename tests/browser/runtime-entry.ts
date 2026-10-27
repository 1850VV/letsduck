// tsx preserves nested callback names with __name; Playwright serializes callbacks without their Node closure.
// Keep that metadata helper in the owned test world only. It does not change function behavior.
Object.defineProperty(globalThis,'__name',{configurable:true,value:<T>(target:T,name:string):T=>{if(typeof target!=='function')throw Error('Expected callback');Object.defineProperty(target,'name',{value:name,configurable:true});return target;}});
// Browser unit helpers import the real modules. Production view identity is checked separately.
import * as THREE from '../../frontend/vendor/three.module.js';
import {loadDuck,renderExportThumbnails,createDuckView} from '../../frontend/shared/duck-view.js';
import {adaptiveDraw,depthDraw} from '../../frontend/shared/depth-render.js';
import {parseCatalog,parseModelManifest,parseScheme} from '../../frontend/shared/guards.js';
import {jsonParse} from '../../frontend/shared/json.js';
import {translate,LOCALES} from '../../frontend/shared/i18n.js';
export const runtime={THREE,loadDuck,renderExportThumbnails,createDuckView,adaptiveDraw,depthDraw,parseCatalog,parseModelManifest,parseScheme,jsonParse,
 message(key:string,params:Record<string,string>={}) {return translate(document.documentElement.lang,key,params);},LOCALES
};
window.__duckModules=runtime;
declare global {interface Window {__duckModules:typeof runtime}}

declare global {interface Window {
 __unitView:import('../../frontend/shared/duck-view.js').DuckView;
 __unitData:Awaited<ReturnType<typeof loadDuck>>;
 __sourceUnitInternals:{renderer:THREE.WebGLRenderer;scene:THREE.Scene;camera:THREE.PerspectiveCamera;draw:ReturnType<typeof adaptiveDraw>;depthAllowed():boolean};
}}
