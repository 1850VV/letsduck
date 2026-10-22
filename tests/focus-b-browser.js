// Run through a task-owned Playwright CLI run-code session against start.py.
// Removing rotation propagation or view history must fail these real UI checks.
async (page) => {
  const checks=[],errors=[];
  const check=(name,pass,detail)=>checks.push({name,pass:!!pass,...(detail?{detail}:{})});
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width:1440,height:950});
  await page.goto('http://127.0.0.1:8876/');
  await page.waitForFunction(()=>window.duckStudio?.ready);
  // The CLI profile belongs to this test. Exercise migration of the old placement.
  await page.evaluate(()=>localStorage.setItem('duck-focus-layout-v1',JSON.stringify({source:duckStudio.getState().source,objects:{whole:{rotation:[.2,.6,0],zoom:1,offset:{x:0,y:0}},detail:{rotation:[-.4,-.3,0],zoom:1,offset:{x:0,y:0}}}})));
  await page.locator('#focus-enter').click();
  const state=()=>page.evaluate(()=>duckStudio.focus.getState());
  const point=async(owner)=>page.evaluate(owner=>{
    const f=duckStudio.focus,p=f.screenPosition(owner,'P4-01');
    for(const r of [0,12,28,45])for(const [dx,dy]of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){
      const x=p.x+dx*r,y=p.y+dy*r,h=f.hitAt(x,y);
      if(h?.owner===owner&&h.id==='P4-01'&&document.elementFromPoint(x,y)?.id==='scene')return{x,y};
    }
    throw Error('No visible head hit for '+owner);
  },owner);
  const rotate=async(owner)=>{const p=await point(owner);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+38,p.y+14,{steps:10});await page.mouse.up();};
  const mode=async(value)=>{const direct=page.locator('[data-quick-layout="'+value+'"]');if(await direct.count())await direct.click();else await page.locator('#focus-layout').selectOption(value);};
  let s=await state();
  check('new and legacy sessions default to linked rotation',s.rotationLinked===true&&equal(s.objects.whole.rotation,s.objects.detail.rotation));
  const initial=s;await rotate('whole');s=await state();
  check('whole drag rotates both to exactly the same new angle',!equal(initial.objects.whole.rotation,s.objects.whole.rotation)&&equal(s.objects.whole.rotation,s.objects.detail.rotation));
  check('mode bar and rotation toggle are present',await page.locator('#focus-mode-dock').count()===1&&await page.locator('#focus-link').count()===1);
  if(await page.locator('#focus-link').count()){
    await page.locator('#focus-link').click();const before=await state();await rotate('whole');s=await state();
    check('unlink preserves the other angle',!s.rotationLinked&&equal(s.objects.detail.rotation,before.objects.detail.rotation)&&!equal(s.objects.whole.rotation,before.objects.whole.rotation));
    await page.locator('#focus-link').click();s=await state();check('relink aligns detail to current whole angle',equal(s.objects.whole.rotation,s.objects.detail.rotation));
    await rotate('detail');s=await state();check('detail drag links back to whole',equal(s.objects.whole.rotation,s.objects.detail.rotation));
  }
  const moveBefore=await state();await page.locator('[data-move="whole"]').focus();await page.keyboard.press('ArrowRight');
  s=await state();check('linked rotation does not link movement',!equal(s.objects.whole.offset,moveBefore.objects.whole.offset)&&equal(s.objects.detail.offset,moveBefore.objects.detail.offset));
  const p=await point('whole');await page.mouse.move(p.x,p.y);await page.mouse.wheel(0,-120);await page.waitForTimeout(150);
  s=await state();check('linked rotation does not link zoom',s.objects.whole.zoom!==moveBefore.objects.whole.zoom&&s.objects.detail.zoom===moveBefore.objects.detail.zoom);
  const pose=await state();await mode('array');s=await state();
  check('array exposes all 35 parts',s.objects.whole.layout==='array'&&await page.locator('[data-focus-part][data-owner="whole"]').count()===35);
  if(await page.locator('#focus-return-assembly').count())await page.locator('#focus-return-assembly').click();else await mode('assembly');
  s=await state();check('return restores assembly angle zoom and position',equal(s.objects.whole.rotation,pose.objects.whole.rotation)&&equal(s.objects.whole.offset,pose.objects.whole.offset)&&s.objects.whole.zoom===pose.objects.whole.zoom);
  await mode('explode');await mode('array');await mode('assembly');s=await state();
  check('explode array assembly round trip preserves pose',equal(s.objects.whole.rotation,pose.objects.whole.rotation)&&equal(s.objects.whole.offset,pose.objects.whole.offset)&&s.objects.whole.zoom===pose.objects.whole.zoom);
  if(await page.locator('#focus-mode-dock').count()){
    check('B bar sits below models and return is adjacent',await page.evaluate(()=>{const dock=document.querySelector('#focus-mode-dock').getBoundingClientRect(),a=document.querySelector('[data-quick-layout="array"]').getBoundingClientRect(),r=document.querySelector('#focus-return-assembly').getBoundingClientRect();return dock.top>innerHeight*.8&&Math.abs(r.top-a.top)<15&&r.left-a.right<25;}));
    await page.keyboard.press('3');check('shortcut 3 enters array',(await state()).objects.whole.layout==='array');await page.keyboard.press('1');check('shortcut 1 restores assembly',(await state()).objects.whole.layout==='assembly');
    await page.locator('#focus-hex').fill('#12345');await page.locator('#focus-hex').press('3');check('color typing does not switch modes',(await state()).objects.whole.layout==='assembly');
    const xBefore=await page.locator('#focus-mode-dock').boundingBox();await page.locator('#focus-swap').click();const xAfter=await page.locator('#focus-mode-dock').boundingBox();check('bar follows swapped whole-model slot',xAfter.x<xBefore.x);
    await page.locator('#focus-reset').click();
    await page.locator('#focus-link').click();await page.locator('#focus-back').click();await page.reload();await page.waitForFunction(()=>window.duckStudio?.ready);await page.locator('#focus-enter').click();check('off preference survives reload',!(await state()).rotationLinked);
    await page.locator('#focus-link').click();await rotate('whole');const saved=await state();await mode('array');await page.locator('#focus-back').click();await page.reload();await page.waitForFunction(()=>window.duckStudio?.ready);await page.locator('#focus-enter').click();await mode('assembly');s=await state();
    check('return view survives leaving and reload',equal(saved.objects.whole.rotation,s.objects.whole.rotation)&&saved.objects.whole.zoom===s.objects.whole.zoom);
  }
  for(const [width,height]of [[390,650],[390,700],[640,700],[1024,650]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(150);
    check('palette cannot intercept mode buttons at '+width+'x'+height,await page.evaluate(()=>[...document.querySelectorAll('#focus-mode-dock button')].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})));
  }
  await page.setViewportSize({width:1440,height:950});
  s=await state();check('display still shares real geometry and materials',s.geometryShared&&s.materialsShared);check('no runtime errors',errors.length===0,errors);
  return {checks,errors,failed:checks.filter(c=>!c.pass)};
}
