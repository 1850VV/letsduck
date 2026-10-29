import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import type {Page} from 'playwright';
import {preparePage,browserUrl} from '../browser/checks.js';

export default async function assemblyLocaleLayout(page:Page){
 await preparePage(page);await page.addInitScript(()=>{localStorage.setItem('dd-locale','en');localStorage.setItem('letsduck-assemble-desk','off');});
 const controller=await page.context().newPage(),origin=browserUrl(),evidence=process.env.ASSEMBLY_EVIDENCE_DIR;
 await controller.route('**/__assembly-layout-controller',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Layout locale controller</title>'}));
 const failures:string[]=[];
 try{
  await controller.goto(new URL('/__assembly-layout-controller',origin).href);await page.goto(new URL('/assemble/',origin).href);await page.waitForFunction(()=>window.anklePrototype?.state.ready&&window.anklePrototype.state.uiReady);
  for(const size of [{width:1440,height:900},{width:960,height:600},{width:390,height:844}]){
   await page.setViewportSize(size);
   for(const locale of ['en','fr','de','ar']){
    await controller.evaluate(locale=>localStorage.setItem('dd-locale',locale),locale);await page.waitForFunction(locale=>document.documentElement.lang===locale,locale);
    const metrics=await page.evaluate(()=>({width:innerWidth,header:[...document.querySelector('.top')!.children].filter(el=>el.getClientRects().length).map(el=>({name:el.id||el.className,x:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})),steps:[...document.querySelectorAll('#step-list .step-option')].map(row=>{const r=row.getBoundingClientRect(),t=row.querySelector('.title')!.getBoundingClientRect();return{top:r.top,bottom:r.bottom,titleTop:t.top,titleBottom:t.bottom};}),heading:['.section-heading h1','.quality-control','#focus-zoom-toggle','.section-heading .view-dock'].map(selector=>{const r=document.querySelector(selector)!.getBoundingClientRect();return{selector,x:r.left,right:r.right,y:r.top,bottom:r.bottom};})}));
    const tag=locale+' '+size.width+'x'+size.height;
    for(const element of metrics.header)if(element.x< -1||element.right>metrics.width+1)failures.push(tag+' header outside viewport: '+element.name);
    for(const [index,row]of metrics.steps.entries())if(row.titleTop<row.top-1||row.titleBottom>row.bottom+1)failures.push(tag+' step title exceeds row '+index);
    const title=metrics.heading[0]!;for(const tool of metrics.heading.slice(1))if(title.x<tool.right-1&&title.right>tool.x+1&&title.y<tool.bottom-1&&title.bottom>tool.y+1)failures.push(tag+' title overlaps '+tool.selector);
    if(evidence){await mkdir(evidence,{recursive:true});await page.screenshot({path:join(evidence,'layout-'+locale+'-'+size.width+'.png')});}
   }
  }
  assert.deepEqual(failures,[]);return{passed:true,layouts:12,scope:'Header bounds and title/tool separation; 960×600 is a viewport check, native browser zoom is separate'};
 }finally{await controller.close();}
}
