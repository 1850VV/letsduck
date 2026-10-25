import test from 'node:test';
import assert from 'node:assert/strict';
import {STEPS,CHAPTERS,chapterFor} from '../../frontend/assemble/full-state.mjs';
const api=await import('../../frontend/assemble/lesson-player.mjs').catch(()=>null);
function player(timings=[{durationMs:1000,holdMs:100,settleMs:200},{durationMs:1000,holdMs:0,settleMs:200}]){assert.ok(api?.createLessonPlayer,'continuous lesson player is available');return api.createLessonPlayer(timings);}

test('开启自动播放从第0步开始，默认保持关闭',()=>{
 const p=player();assert.equal(p.state.autoplay,false);p.seek(1,.6);p.startAuto();assert.deepEqual([p.state.step,p.state.progress,p.state.playing,p.state.autoplay],[0,0,true,true]);
});
test('动作完成后停留，再进入下一步；最后一步结束自动停止',()=>{
 const p=player();p.startAuto();p.tick(0);p.tick(1100);assert.deepEqual([p.state.step,p.state.progress,p.state.playing],[0,1,true]);p.tick(1299);assert.equal(p.state.step,0);p.tick(1300);assert.deepEqual([p.state.step,p.state.progress],[1,0]);p.tick(2300);assert.equal(p.state.progress,1);p.tick(2500);assert.deepEqual([p.state.step,p.state.progress,p.state.playing,p.state.autoplay,p.state.finished],[1,1,false,false,true]);
});
test('调倍率不跳进度，后续经过相同时间按新倍率前进',()=>{
 const p=player([{durationMs:1000}]);p.seek(0,.2,{play:true});p.tick(0);p.tick(100);assert.ok(Math.abs(p.state.progress-.3)<1e-9);p.setRate(2);assert.ok(Math.abs(p.state.progress-.3)<1e-9);p.tick(200);assert.ok(Math.abs(p.state.progress-.5)<1e-9);p.setRate(.5);p.tick(400);assert.ok(Math.abs(p.state.progress-.6)<1e-9);
});
test('暂停保留自动播放与进度，继续从原位置播放',()=>{
 const p=player();p.startAuto();p.tick(0);p.tick(600);p.pause();const at=p.state.progress;p.tick(9000);assert.equal(p.state.progress,at);assert.equal(p.state.autoplay,true);p.resume();p.tick(10000);assert.equal(p.state.progress,at);p.tick(10100);assert.ok(Math.abs(p.state.progress-at-.1)<1e-9);
});
test('关闭自动播放立即停止，手动跳步也会退出自动模式',()=>{
 const p=player();p.startAuto();p.tick(0);p.tick(600);p.stopAuto();assert.deepEqual([p.state.playing,p.state.autoplay],[false,false]);p.tick(5000);assert.equal(p.state.progress,.5);p.startAuto();p.seek(1,.4);assert.deepEqual([p.state.step,p.state.progress,p.state.autoplay,p.state.playing],[1,.4,false,false]);
});
test('手动单步播放不会自动跳到下一步',()=>{
 const p=player();p.seek(0,0,{play:true});p.tick(0);p.tick(2000);assert.deepEqual([p.state.step,p.state.progress,p.state.playing,p.state.autoplay],[0,1,false,false]);
});
test('完整教程逐一经过111步和14阶段，没有漏步或循环',()=>{
 const p=player(STEPS.map(()=>({durationMs:100,holdMs:20,settleMs:30})));p.setRate(4);p.startAuto();const visited=[0],chapters=new Set([chapterFor(0).id]);
 for(let t=0;t<100000&&p.state.playing;t+=10){p.tick(t);const s=p.state;if(visited.at(-1)!==s.step)visited.push(s.step);chapters.add(chapterFor(s.step).id);}
 assert.deepEqual(visited,Array.from({length:111},(_,i)=>i));assert.equal(chapters.size,CHAPTERS.length);assert.equal(chapters.size,14);assert.equal(p.state.finished,true);
});
test('无效倍率不会污染状态，终点继续播放不会循环',()=>{
 const p=player([{durationMs:100}]);p.setRate(0);p.setRate(NaN);assert.equal(p.state.rate,1);p.startAuto();p.tick(0);p.tick(1000);p.tick(3000);p.resume();p.tick(4000);assert.deepEqual([p.state.step,p.state.progress,p.state.playing],[0,1,false]);
});

// Catches evaluating every step before playback, or treating an unresolved timing as a duration.
test('step timings can be resolved on demand without calculating later steps',()=>{
 const p=player([()=>({durationMs:1000,holdMs:100}),()=>{throw Error('Unvisited step must stay unresolved');}]);
 p.seek(0,0,{play:true});p.tick(0);p.tick(50);assert.equal(p.state.progress,0);
 p.tick(600);assert.equal(p.state.progress,.5);
});

// Catches recalculating expensive cue-based timings on every frame or revisiting a step.
test('lazy timings are reused across frames and revisits while autoplay keeps each step duration',()=>{
 let first=0,second=0;
 const p=player([()=>({durationMs:++first===1?1000:100,settleMs:200}),()=>({durationMs:++second===1?2000:100,settleMs:200})]);
 p.startAuto();p.tick(0);p.tick(500);assert.equal(p.state.progress,.5);
 p.tick(1000);p.tick(1200);assert.equal(p.state.step,1);
 p.tick(2200);assert.equal(p.state.progress,.5);
 p.seek(0,0,{play:true});p.tick(3000);p.tick(3500);assert.equal(p.state.progress,.5);
 assert.deepEqual([first,second],[1,1]);
});
