/** Synthetic network failure checks diagnostic evidence, not product or Windows acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {object,verifyPids} from '../scripts/check-support.js';
import {capturePortableFailure,observePortablePage} from '../scripts/portable-browser-diagnostics.js';

test('a failed module request preserves its URL, current document, DOM and screenshot',async()=>{
 const output=await mkdtemp(join(tmpdir(),'duck-portable-diagnostic-')),browser=await chromium.launch({headless:true}),pids=new Set<number>(),inspector=await browser.newBrowserCDPSession();
 const record=async()=>{for(const item of(await inspector.send('SystemInfo.getProcessInfo')).processInfo)pids.add(item.id);};
 try{
  await record();const page=await browser.newPage(),events:unknown[]=[];observePortablePage(page,events);
  const url='http://portable-diagnostic.invalid/home.html?unlock=debug',script='http://portable-diagnostic.invalid/blocked-module.js';
  await page.route('http://portable-diagnostic.invalid/**',route=>new URL(route.request().url()).pathname==='/blocked-module.js'
   ?route.abort('connectionfailed')
   :route.fulfill({contentType:'text/html',body:'<!doctype html><title>Portable network diagnostic</title><body><div id="home-loading">Waiting for the blocked module</div><script type="module" src="/blocked-module.js"></script></body>'}));
  await page.goto(url);
  await assert.rejects(page.waitForFunction(()=>document.body.dataset.homeReady==='true',undefined,{timeout:100}),/Timeout/);
  const receipt=await capturePortableFailure(page,output);
  assert.equal(receipt.pageUrl,url);assert.equal(receipt.document?.url,url);assert.equal(receipt.document?.title,'Portable network diagnostic');
  assert.equal(receipt.document?.homeReady,null);assert.equal(receipt.document?.loading,'Waiting for the blocked module');
  assert.equal(receipt.document?.scripts[0]?.src,script);
  const failed=events.find(event=>object(event)&&event.kind==='requestfailed'&&event.url===script);
  assert.ok(object(failed));assert.equal(failed.resourceType,'script');assert.match(JSON.stringify(failed.failure),/ERR_CONNECTION_FAILED/);
  assert.ok(events.some(event=>object(event)&&event.kind==='navigation'&&event.url===url));
  assert.equal(receipt.artifacts.dom.saved,true);assert.equal(receipt.artifacts.screenshot.saved,true);
  assert.match(await readFile(join(output,'failure-dom.html'),'utf8'),/blocked-module.js/);
  assert.equal((await readFile(join(output,'failure.png'))).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 }finally{
  try{await record();}finally{await inspector.detach().catch(()=>{});await browser.close();await verifyPids(pids);await rm(output,{recursive:true,force:true});}
 }
});
