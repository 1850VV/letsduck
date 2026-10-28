import path = require('node:path');
import fs = require('node:fs');
import type {Configuration} from 'electron-builder';
import builder = require('electron-builder');
import type * as Updates from './src/updates.js';
const {updateFeed,feedURL}:typeof Updates=require(path.join(__dirname,'../dist/updates.js'));
const directory=path.resolve(__dirname,'..');
const manifest:unknown=JSON.parse(fs.readFileSync(path.join(directory,'package.json'),'utf8'));
if(!manifest||typeof manifest!=='object'||!('version'in manifest)||typeof manifest.version!=='string')throw new Error('Missing desktop package version');
const version=process.env.DUCK_RELEASE_VERSION||manifest.version;
if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-beta\.(0|[1-9]\d*))?$/.test(version))throw new Error('Release version must be X.Y.Z or X.Y.Z-beta.N');
const platform=process.argv.includes('--win')?'win32':process.argv.includes('--mac')?'darwin':process.platform;
const arch=process.env.DUCK_BUILD_ARCH||(process.argv.includes('--x64')?'x64':process.argv.includes('--arm64')?'arm64':process.arch);
if(!(platform==='win32'&&arch==='x64'||platform==='darwin'&&arch==='arm64'))throw new Error('Only Windows x64 and macOS arm64 are supported.');
const channel=version.includes('-beta.')?'beta':'stable',base=process.env.DUCK_UPDATE_BASE,exact=process.env.DUCK_UPDATE_URL,repository=process.env.DUCK_UPDATE_REPOSITORY;
if(repository&&!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(repository))throw new Error('Update repository must be owner/name');
const signing=Boolean(process.env.CSC_NAME&&process.env.CSC_NAME!=='-'||process.env.CSC_LINK);
let publish:Configuration['publish']=null;
if(base||exact||repository){const url=exact||(repository?`https://github.com/${repository}/releases/download/${channel}-${platform}-${arch}/`:updateFeed(base!,channel,platform,arch));publish={provider:'generic',url:feedURL(url).href.replace(/\/+$/,'')+'/',channel:channel==='stable'?'latest':'beta'};}
if(platform==='darwin'&&publish&&!signing)throw new Error('Mac update builds require a distribution signing identity. Omit the update feed for an ad-hoc development package.');
const configuration:Configuration={
 appId:'com.letsduck.desktop',productName:'来做鸭',executableName:'letsduck',electronVersion:'45.0.0',asar:true,npmRebuild:false,nodeGypRebuild:false,
 beforePack:context=>{if(!(context.electronPlatformName==='win32'&&context.arch===builder.Arch.x64||context.electronPlatformName==='darwin'&&context.arch===builder.Arch.arm64))throw new Error('Only Windows x64 and macOS arm64 are supported.');},
 extraMetadata:{version,main:'apps/desktop/dist/main.js'},directories:{app:path.join(directory,'build/app'),output:path.join(directory,`release/${platform}-${arch}`),buildResources:path.join(directory,'build')},
 files:['**/*','!**/*.map','!**/*.tsbuildinfo'],extraResources:[{from:path.join(directory,'build/runtime'),to:'runtime',filter:['**/*']}],
 icon:path.join(directory,'build/icon.png'),artifactName:'letsduck-${version}-${os}-${arch}.${ext}',publish,generateUpdatesFilesForAllChannels:false,
 mac:{target:[{target:'dmg',arch:['arm64']},{target:'zip',arch:['arm64']}],category:'public.app-category.graphics-design',...(process.env.CSC_NAME?{identity:process.env.CSC_NAME}:process.env.CSC_LINK?{}:{identity:'-'}),hardenedRuntime:signing,entitlements:path.join(directory,'entitlements.mac.plist'),entitlementsInherit:path.join(directory,'entitlements.mac.plist'),notarize:Boolean(signing&&(process.env.APPLE_API_KEY||process.env.APPLE_ID))},
 dmg:{sign:false},win:{target:[{target:'nsis',arch:['x64']}]},nsis:{oneClick:true,perMachine:false,deleteAppDataOnUninstall:false},
};
export = configuration;
