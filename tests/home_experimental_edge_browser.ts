import assert from 'node:assert/strict';
import type {Page} from 'playwright';
import {preparePage,browserUrl} from './browser/checks.js';
import {ACCESS_KEY} from '../frontend/home/experimental-access.js';
export default async(page:Page)=>{
 await preparePage(page,{firstUse:true});const base=browserUrl(),checks:string[]=[],failures:string[]=[];
 const fresh=async()=>{await page.goto(base+'/');await page.waitForSelector('body[data-home-ready=true]');await page.evaluate(key=>{localStorage.removeItem(key);localStorage.removeItem('letsduck.duck-hub.v1');},ACCESS_KEY);await page.reload();await page.waitForSelector('body[data-home-ready=true]');};
 const debug=page.locator('[data-duck=debug]');
 for(const ending of ['Escape','move'] as const){try{
  await fresh();const r=await debug.boundingBox();assert.ok(r);const x=r.x+r.width/2,y=r.y+r.height/2;await page.mouse.move(x,y);await page.mouse.down();
  try{await page.waitForFunction(()=>document.querySelector<HTMLElement>('[data-duck=debug]')?.dataset.betaLocked==='false',undefined,{timeout:4000});if(ending==='Escape')await page.keyboard.press('Escape');else await page.mouse.move(x+9,y);}
  finally{await page.mouse.up();}
  await page.waitForFunction(()=>document.querySelector<HTMLElement>('.duck-stage')?.dataset.settled!=='false');assert(await page.locator('#module-window').isHidden());await debug.click();assert(await page.locator('#module-window').isVisible(),'completed '+ending+' gesture must not suppress the next activation');await page.locator('#close-module').click();checks.push('complete then '+ending+' permits next activation');
 }catch(error){failures.push(ending+': '+String(error));}}
 try{await fresh();await debug.click();await page.locator('#tip-close').focus();await page.keyboard.press('Enter');assert(await page.locator('#beta-tip').isHidden(),'keyboard close must not start a hold');assert.equal(await debug.getAttribute('data-beta-locked'),'true');checks.push('Enter activates the hint close button');}catch(error){failures.push('close: '+String(error));}
 try{await fresh();const assemble=page.locator('[data-duck=assemble]');await assemble.focus();await page.keyboard.down('Space');await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.up('Space');await page.waitForTimeout(2200);assert.equal(await assemble.getAttribute('data-beta-locked'),'true','releasing outside the stage must cancel the hold');checks.push('focus change and off-stage key release cancel unlock');}catch(error){failures.push('focus: '+String(error));}
 console.log(JSON.stringify({checks,failures}));assert.deepEqual(failures,[]);return {pass:true,checks};
};
