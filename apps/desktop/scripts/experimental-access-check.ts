/** Smoke preconditions; the native journeys acknowledge first use through real input. */
import assert from 'node:assert/strict';
import type {Locator,Page} from 'playwright';

const key='letsduck.experimental-access.v1';
type Module='debug'|'assemble';
type Check=(name:string,passed:boolean,detail?:unknown)=>void;
type Input={click(target:Locator):Promise<void>;hold(target:Locator,milliseconds:number):Promise<void>;capture(name:string):Promise<void>};

export async function experimentalAccessState(page:Page){
 return page.evaluate(key=>{
  const value:unknown=JSON.parse(localStorage.getItem(key)??'null');
  return{debug:!!value&&typeof value==='object'&&Reflect.get(value,'debug')===true,assemble:!!value&&typeof value==='object'&&Reflect.get(value,'assemble')===true};
 },key);
}

/** Returning-user fixture for the generic smoke, which does not claim first-use input coverage. */
export async function prepareExperimentalAccessFixture(page:Page){
 await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({debug:true,assemble:true})),key);
 assert.deepEqual(await experimentalAccessState(page),{debug:true,assemble:true});
}

export async function unlockExperimentalHome(page:Page,id:Module,input:Input,check:Check){
 await page.waitForFunction(()=>document.body.dataset.homeReady==='true');
 const duck=page.locator(`[data-duck="${id}"]`),before=await experimentalAccessState(page);
 check(id+' starts independently locked',!before[id]&&await duck.getAttribute('data-beta-locked')==='true',before);
 if(await duck.getAttribute('data-c-position')!=='true'){
  await input.click(duck);
  await page.waitForFunction(id=>document.querySelector<HTMLElement>(`[data-duck="${id}"]`)?.dataset.cPosition==='true'&&document.querySelector<HTMLElement>('.duck-stage')?.dataset.settled!=='false',id);
 }
 await input.click(duck);await page.locator('#beta-tip').waitFor({state:'visible'});
 check(id+' short press only shows the first-use notice',!await page.locator('#module-window').isVisible()&&!(await experimentalAccessState(page))[id]);
 await input.hold(duck,2200);
 await page.waitForFunction(id=>document.querySelector<HTMLElement>(`[data-duck="${id}"]`)?.dataset.betaLocked==='false',id);
 const after=await experimentalAccessState(page),other=id==='debug'?'assemble':'debug';
 check(id+' native two-second hold acknowledges only its own module',after[id]&&after[other]===before[other],{before,after});
 check(id+' completed hold stays on the homepage until the next click',!await page.locator('#module-window').isVisible());
 await input.capture(id+'-first-use-unlocked');
 return after;
}
