/** Windows disposable-runner acceptance. All user input goes through Win32 SendInput. */
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify,parseArgs} from 'node:util';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import type {ElectronApplication,Page} from 'playwright';
import {root,desktop,desktopScope,failure,resizeWindow,required,seedSimulatedAssembly,assemblyReady} from './check-support.js';
import {windowsNativeInput,windowsPowerShell} from './windows-native-input.js';

assert.equal(process.platform,'win32','This native acceptance requires Windows');
assert.equal(process.arch,'x64');
assert.equal(process.env.GITHUB_ACTIONS,'true','A disposable Actions runner is required; never spoof this on a personal PC');
const {values}=parseArgs({options:{installer:{type:'string'}}});
const version=process.env.DUCK_RELEASE_VERSION||'0.1.0-beta.4';
const installer=resolve(values.installer||process.env.DUCK_NATIVE_INSTALLER||join(desktop,`release/win32-x64/letsduck-${version}-win-x64.exe`));
const output=resolve(process.env.DUCK_TEST_OUTPUT||join(root,'output/windows-native-input'));
await mkdir(output,{recursive:true});
const scope=await desktopScope('letsduck-win-native-'),run=promisify(execFile),sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const artifactIdentity:{path:string;bytes:number|null;sha256:string|null;sourceCommit:string|null}={path:installer,bytes:null,sha256:null,sourceCommit:process.env.GITHUB_SHA||null};
const installation=join(scope.temporary,'app'),executable=join(installation,'letsduck.exe'),script=join(scope.temporary,'native-input.ps1');
const events:unknown[]=[],checks:Array<{name:string;passed:boolean;detail:unknown}>=[],nativeEvidence:unknown[]=[];
let app:ElectronApplication|undefined,page:Page|undefined,hwnd='',clipboardSaved=false,clipboardRestored=false,result:Record<string,unknown>|undefined;
const installationCleanup:Array<{forcedPids:number[];remainingPids:number[]}>=[];
async function stopOwned():Promise<void>{
 const stopped=await run(windowsPowerShell,['-NoProfile','-NonInteractive','-Command',String.raw`Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | ForEach-Object { if ($_.MainWindowHandle -ne 0) { [void]$_.CloseMainWindow(); [void]$_.WaitForExit(10000) } }; $forced=@(Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | Select-Object -ExpandProperty Id); $forced | ForEach-Object { Stop-Process -Id $_ -Force }; @{forcedPids=@($forced);remainingPids=@(Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | Select-Object -ExpandProperty Id)} | ConvertTo-Json -Compress`],{env:{...scope.env,DUCK_INSTALLED_EXE:executable},timeout:60_000});
 const receipt=JSON.parse(stopped.stdout.trim()) as {forcedPids:number[];remainingPids:number[]};installationCleanup.push(receipt);assert.deepEqual(receipt.remainingPids,[],'Exact owned installed executable processes exited');
}
scope.addCleanup(stopOwned);

function check(name:string,passed:boolean,detail:unknown=null){checks.push({name,passed,detail});console.log(JSON.stringify({check:name,passed,detail}));assert.ok(passed,name+' '+JSON.stringify(detail));}
const input=windowsNativeInput({script,output,page:()=>required(page),target:async()=>({window:hwnd,ownedPids:app?await app.evaluate(({app})=>app.getAppMetrics().map(item=>item.pid)):[]}),evidence:nativeEvidence,check});
const {native,click,capture,menuJourney}=input;

try{
 {const bytes=await readFile(installer);artifactIdentity.bytes=bytes.length;artifactIdentity.sha256=sha(bytes);}
 await writeFile(join(output,'identity.json'),JSON.stringify(artifactIdentity));console.log(JSON.stringify(artifactIdentity));
 await input.prepare();await stat(installer);
 await run(installer,['/S',`/D=${installation}`],{env:scope.env,timeout:180_000});await stopOwned();await stat(executable);
 const resources=join(installation,'resources');
 check('full-assets installation has licensed model',(await stat(join(resources,'runtime/assets/model.json'))).isFile());
 const fileExists=async(path:string)=>stat(path).then(()=>true,()=>false);
 const assetScope={filamentCatalog:await fileExists(join(resources,'runtime/assets/filament-catalog.json')),filamentProfiles:await fileExists(join(resources,'runtime/assets/filament-profiles.json'))};
 seedSimulatedAssembly(required(scope.env.DUCK_PERSONAL_DB));
 app=await scope.launch(undefined,executable);page=await app.firstWindow();page.setDefaultTimeout(30_000);
 page.on('pageerror',error=>events.push({kind:'pageerror',message:error.message}));page.on('console',message=>{if(message.type()==='error')events.push({kind:'console',message:message.text()});});
 app.context().on('requestfailed',request=>events.push({kind:'requestfailed',url:request.url(),failure:request.failure()}));
 const identity=await app.evaluate(({app,screen})=>({packaged:app.isPackaged,version:app.getVersion(),arch:process.arch,execPath:process.execPath,workArea:screen.getPrimaryDisplay().workArea}));
 check('installed x64 package identity',identity.packaged&&identity.arch==='x64'&&identity.version===version,identity);
 const width=Math.max(800,Math.min(1280,identity.workArea.width-50)),height=Math.max(600,Math.min(800,identity.workArea.height-100));
 await resizeWindow(app,page,{width,height});const window=await app.browserWindow(page);
 try{hwnd=await window.evaluate(window=>window.getNativeWindowHandle().readBigUInt64LE().toString());await window.evaluate((window,area)=>{window.setPosition(area.x+10,area.y+10);window.show();window.focus();},identity.workArea);}finally{await window.dispose();}
 const active=await native('activate');check('owned application is in the foreground',active.foreground===hwnd,active);
 await page.waitForFunction(()=>document.body.dataset.homeReady==='true');const paint=page.locator('[data-duck="paint"]');
 if(await paint.getAttribute('data-c-position')!=='true'){await click(paint);await page.waitForFunction(()=>document.querySelector<HTMLElement>('[data-duck="paint"]')?.dataset.cPosition==='true'&&document.querySelector<HTMLElement>('.duck-stage')?.dataset.settled!=='false');}
 await click(paint);await page.locator('#module-frame').waitFor({state:'visible'});
 await page.waitForFunction(()=>document.querySelector('#module-frame')?.getAttribute('src')==='/paint');
 const frame=required(page.frames().find(frame=>frame.url()==='duck://app/paint'));await frame.waitForFunction(()=>!!Reflect.get(window,'studioProto'));
 if(await frame.locator('#coach-go').isVisible())await click(frame.locator('#coach-go'));
 if(await frame.locator('#start-go').isVisible()){await click(frame.locator('[data-start="original"]'));await click(frame.locator('#start-go'));}
 await click(frame.locator('[data-step="2"]').first());await frame.locator('#filament-series').waitFor();
 check('native input followed the real homepage iframe',frame.url()==='duck://app/paint');
 const series=await menuJourney(frame.locator('#filament-series'),'filament-series');
 // A historical authorized asset pack can have only one series. Never inject extra options.
 const coverage={assetScope,filamentSeries:series,formalMultiBrandSeries:assetScope.filamentCatalog&&series.changedSelectionCovered?'covered for displayed options':'not_run: authorized historical archive lacks current extra filament files or multiple series'};
 const clipboardBackup=await app.evaluate(async({clipboard,ClipboardItem})=>{
  const copied=[];let emptyItems=0;
  for(const item of await clipboard.read()){
   if(!item.types.length){emptyItems++;continue;}
   const types:Record<string,Blob|Electron.ClipboardBookmark>={};for(const type of item.types)types[type]=await item.getType(type);
   copied.push(new ClipboardItem(types));
  }
  Reflect.set(globalThis,'duckNativeClipboardBackup',copied);return{formats:copied.flatMap(item=>item.types),emptyItems};
 });clipboardSaved=true;events.push({kind:'clipboardBackup',scope:'Electron ClipboardItem MIME formats',...clipboardBackup});
 await app.evaluate(async({clipboard})=>clipboard.writeText('duck-native-clipboard-marker'));
 await click(frame.locator('[data-step="3"]').first());await click(frame.locator('[data-ptab="share"]'));
 const textCode=required(await frame.locator('.code-box code').textContent());assert.ok(textCode.startsWith('v1.'),'The real share panel has an exportable code');await click(frame.locator('#copy-code'));
 let copiedCode='';for(let i=0;i<30;i++){copiedCode=await app.evaluate(async({clipboard})=>clipboard.readText());if(copiedCode===textCode)break;await delay(100);}
 check('native UI copies the displayed palette code to Windows text clipboard',copiedCode===textCode,{displaySelector:'.code-box code',buttonSelector:'#copy-code',expected:textCode,actual:copiedCode});
 await click(frame.locator('#open-poster'));
 await frame.locator('#poster-copy-img').waitFor({state:'visible'});await frame.waitForFunction(()=>!document.querySelector<HTMLButtonElement>('#poster-copy-img')?.disabled);
 await click(frame.locator('#poster-copy-img'));
 let clip:{formats:string[];width:number;height:number;png:string}|undefined;
 for(let i=0;i<30;i++){clip=await app.evaluate(async({clipboard,nativeImage})=>{const entries=await clipboard.read(),formats=entries.flatMap(item=>item.types),item=entries.find(item=>item.types.includes('image/png'));const bytes=item?Buffer.from(await(await item.getType('image/png')).arrayBuffer()):Buffer.alloc(0),image=nativeImage.createFromBuffer(bytes),size=image.getSize();return{formats,width:size.width,height:size.height,png:bytes.toString('base64')};});if(clip.width>0)break;await delay(100);}
 const png=Buffer.from(required(clip).png,'base64');check('native poster action writes a real PNG to Windows clipboard',png.length>100000&&png.subarray(0,8).toString('hex')==='89504e470d0a1a0a'&&required(clip).width>0,{formats:clip?.formats,bytes:png.length,width:clip?.width,height:clip?.height});await writeFile(join(output,'clipboard.png'),png);
 await click(frame.locator('#poster-close'));await click(page.locator('#close-x'));check('native close returns to homepage',!await page.locator('#module-window').isVisible());await click(paint);await page.locator('#module-frame').waitFor({state:'visible'});
 const reopened=required(page.frames().find(frame=>frame.url()==='duck://app/paint'));await reopened.waitForFunction(()=>!!Reflect.get(window,'studioProto'));
 check('native homepage module reopens actual paint iframe',reopened.url()==='duck://app/paint');await capture('final-home-iframe');
 await click(page.locator('#close-x'));check('native reopened paint module closes',!await page.locator('#module-window').isVisible());
 const assemble=page.locator('[data-duck="assemble"]');if(await assemble.getAttribute('data-c-position')!=='true'){await click(assemble);await page.waitForFunction(()=>document.querySelector<HTMLElement>('[data-duck="assemble"]')?.dataset.cPosition==='true'&&document.querySelector<HTMLElement>('.duck-stage')?.dataset.settled!=='false');}
 await click(assemble);await page.locator('#module-frame').waitFor({state:'visible'});await page.frameLocator('#module-frame').locator('#playback-rate select').waitFor();const assembly=required(page.frames().find(frame=>frame.url()==='duck://app/assemble/'));await assembly.waitForFunction(assemblyReady,undefined,{timeout:60_000});
 check('native assembly entry uses the real homepage iframe',assembly.url()==='duck://app/assemble/');const settings=await menuJourney(assembly.locator('#playback-rate select'),'assembly-playback-rate');
 check('a real six-option native menu changed value',settings.initial.options.length===6&&settings.changedSelectionCovered&&settings.afterMouse.value!==settings.initial.value,settings);
 await click(assembly.locator('#sound-controls summary'));check('native adjacent sound controls open',await assembly.locator('#sound-controls').getAttribute('open')!==null);await click(assembly.locator('#sound-close'));check('native adjacent sound controls close',await assembly.locator('#sound-controls').getAttribute('open')===null);
 await click(page.locator('#close-x'));check('native assembly closes to homepage',!await page.locator('#module-window').isVisible());await click(assemble);await page.locator('#module-frame').waitFor({state:'visible'});await page.frameLocator('#module-frame').locator('#playback-rate select').waitFor();const assemblyReopened=required(page.frames().find(frame=>frame.url()==='duck://app/assemble/'));await assemblyReopened.waitForFunction(assemblyReady,undefined,{timeout:60_000});check('native assembly iframe and select reopen',await assemblyReopened.locator('#playback-rate select').isVisible());await capture('final-assembly-iframe');
 check('no page runtime errors',!events.some(value=>typeof value==='object'&&value!==null&&'kind'in value&&value.kind==='pageerror'),events);
 result={status:'passed',artifactIdentity,installer:{path:installer,bytes:artifactIdentity.bytes,sha256:artifactIdentity.sha256},identity,assemblyPrerequisite:'15 explicitly simulated records in owned temporary SQLite; no hardware verification',defaultGpu:true,sourceCommit:process.env.GITHUB_SHA||null,coverage,settings,clipboard:{text:{displaySelector:'.code-box code',buttonSelector:'#copy-code',expected:textCode,actual:copiedCode},formats:clip?.formats,bytes:png.length,width:clip?.width,height:clip?.height,sha256:sha(png)},checks,events,physicalDevices:'not_run: explicit invalid DUCK_ADB sentinel and temporary DB/profile',visualAcceptance:'automated native input and captured screens; no human visual approval'};
}catch(error){result={status:'failed',artifactIdentity,error:failure(error),checks,events};console.log(JSON.stringify(artifactIdentity));process.exitCode=1;if(hwnd)await capture('failure-native').catch(()=>{});console.error(failure(error));}
finally{
 if(app&&clipboardSaved)try{
  const restored=await app.evaluate(async({clipboard})=>{
   const copied=Reflect.get(globalThis,'duckNativeClipboardBackup') as Electron.ClipboardItem[];
   if(copied.length)await clipboard.write(copied);else clipboard.clear();
   const expected=copied.flatMap(item=>item.types).sort(),actual=(await clipboard.read()).flatMap(item=>item.types).sort();
   if(JSON.stringify(expected)!==JSON.stringify(actual))throw new Error('Restored clipboard MIME formats differ: '+JSON.stringify({expected,actual}));
   return{expected,actual,scope:'Electron ClipboardItem MIME formats'};
  });events.push({kind:'clipboardRestore',...restored});clipboardRestored=true;
 }catch(error){events.push({kind:'clipboardRestore',error:String(error)});result={...result,status:'failed',clipboardRestoreError:failure(error)};process.exitCode=1;}
 let cleaned=false;try{await scope.dispose();cleaned=true;}catch(error){result={...result,status:'failed',cleanupError:failure(error)};process.exitCode=1;throw error;}finally{if(installationCleanup.some(item=>item.forcedPids.length>0)){result={...result,status:'failed',forcedOwnedProcessTermination:installationCleanup};process.exitCode=1;}await writeFile(join(output,'identity.json'),JSON.stringify(artifactIdentity));await writeFile(join(output,'native-evidence.json'),JSON.stringify(nativeEvidence,null,2));await writeFile(join(output,'cleanup.json'),JSON.stringify({ownedProcessesExited:cleaned,temporaryInstallationRemoved:cleaned,temporaryDataRemoved:cleaned,clipboardRestored,installationCleanup,ownedPids:[...scope.pids],fakeAdb:scope.adbEvidence()},null,2));await writeFile(join(output,'result.json'),JSON.stringify(result,null,2));}
}
console.log(JSON.stringify(result));
