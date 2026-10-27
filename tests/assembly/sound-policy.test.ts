import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../../frontend/assemble/sound-policy.js';
const before={step:12,progress:.98,playing:true},after={step:12,progress:1,playing:false};
function cue(a=before,b=after,now=10000,last=-Infinity,enabled=true,volume=.24){assert.ok(api?.shouldPlayCompletion,'completion sound policy is available');return api.shouldPlayCompletion(a,b,now,last,enabled,volume);}
test('实际完成一个动作才触发一次完成提示音',()=>{assert.equal(cue(),true);assert.equal(cue(after,after),false);});
test('手动跳步、拖进度和整体换步不发完成提示音',()=>{assert.equal(cue({...before,playing:false}),false);assert.equal(cue(before,{...after,step:13}),false);});
test('高倍率连续完成时两次提示之间至少间隔六秒',()=>{assert.equal(cue(before,after,5000,1000),false);assert.equal(cue(before,after,7000,1000),true);});
test('关闭提示音或音量为零时保持静音',()=>{assert.equal(cue(before,after,10000,0,false),false);assert.equal(cue(before,after,10000,0,true,0),false);});
