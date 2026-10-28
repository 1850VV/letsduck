import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import type {Step} from '../../frontend/assemble/types.js';
// Frozen from independent d5c38e4fa890a4eca40d8857317ac463163b46c3
// frontend/assemble/hardware-state.mjs on macOS/Linux, all 111 steps × four poses.
const originalPortableFingerprint='c1df395ad72e025a59cd0a1fce7d0292ecd775c43ef18908cc9c6e1a46be538b';
// Approved relocation of automatic numbering to Debug. These seven display
// fields must match the new guidance before projecting only them to the oracle.
const debugGuidanceChanges=[
 {id:'prepare-intro',field:'check',before:'从“舵机准备”完成编号。可以随时用“整机预览”回到完成态。',after:'在调试鸭使用自动编号完成扫描、设置 ID/KP/KD 并读回核对。可以随时用“整机预览”回到完成态。'},
 {id:'prepare-app',field:'text',before:'首次使用按厂商指引完成 App Lab 安装、Duck OS 烧录和 Wi-Fi 配置。已有系统直接打开“舵机准备”检测。',after:'首次使用按厂商指引完成 App Lab 安装、Duck OS 烧录和 Wi-Fi 配置。已有系统直接打开调试鸭的自动编号检测。'},
 {id:'prepare-scan',field:'title',before:'打开舵机准备，自动检测当前只',after:'在调试鸭自动检测当前一只舵机'},
 {id:'prepare-scan',field:'text',before:'只连接当前一只舵机，从“舵机准备”开始本轮。程序扫描响应编号并读取已有参数。',after:'只连接当前一只舵机，从调试鸭的自动编号开始本轮。程序扫描响应编号并读取已有参数。'},
 {id:'prepare-id',field:'title',before:'自动写入参数与 ID，再读回复核',after:'在调试鸭自动写入 ID/KP/KD，再读回核对'},
 {id:'prepare-id',field:'text',before:'程序采用检测到的运行端配置档，明确写入 KP、KD 和目标 ID。只有编号与参数读回一致才计入完成。',after:'在调试鸭启动自动编号。程序采用检测到的运行端配置档，明确写入 KP、KD 和目标 ID。只有编号与参数读回一致才计入完成。'},
 {id:'prepare-all-ids',field:'text',before:'依次完成 10–14、20–24、30–34。完成一只就贴好编号；停机并断开 USB 与电池后再换下一只，上电后自动继续。',after:'在调试鸭依次完成 10–14、20–24、30–34。完成一只就贴好编号；停机并断开 USB 与电池后再换下一只，上电后在调试鸭自动继续。'},
] as const;
function originalGuidanceSteps(steps:readonly Step[]):Step[]{
 const projected=steps.map(step=>({...step}));
 for(const change of debugGuidanceChanges){
  const step=projected.find(item=>item.id===change.id);assert.ok(step,change.id);
  assert.equal(step[change.field],change.after,change.id+'.'+change.field+' must retain the approved Debug guidance');
  step[change.field]=change.before;
 }
 return projected;
}
function fingerprint(value:unknown):string{
 // Near gimbal lock, Euler asin amplifies a 2.22e-16 matrix difference to
 // 1.09e-8 rad in the independent old MJS. Both OSes agree at 1e-7 mm/rad.
 // Array/key order, identifiers, labels, booleans and enums remain exact.
 const serialized=JSON.stringify(value,(_key:string,item:unknown)=>{
  if(typeof item!=='number')return item;
  assert.ok(Number.isFinite(item),'Assembly values must be finite');
  return Number(item.toFixed(7));
 });
 assert.ok(typeof serialized==='string');
 return createHash('sha256').update(serialized).digest('hex');
}
test('assembly state and all browsing poses preserve the original data',async()=>{
 const state=await import('../../frontend/assemble/hardware-state.js').catch(()=>undefined);
 assert.ok(state,'Strict TypeScript assembly modules are missing');
 const {ACTORS,STEPS,CHAPTERS,snapshot}=state;
 const values={ACTORS,STEPS:originalGuidanceSteps(STEPS),CHAPTERS,snapshots:STEPS.map((_:unknown,i:number)=>[0,.2,.5,1].map(p=>snapshot(i,p)))};
 assert.equal(STEPS.length,111);
 assert.equal(Object.keys(ACTORS).length,275);
 assert.equal(values.snapshots.flat().length,444);
 assert.equal(fingerprint(values),originalPortableFingerprint);
});

test('guidance projection rejects altered instructions and keeps unrelated tutorial fields under the original fingerprint',async()=>{
 const {ACTORS,STEPS,CHAPTERS,snapshot}=await import('../../frontend/assemble/hardware-state.js');
 const before=structuredClone(STEPS),alteredGuidance=STEPS.map(step=>step.id==='prepare-id'?{...step,title:step.title.replace('自动','手动')}:step);
 assert.throws(()=>originalGuidanceSteps(alteredGuidance),/prepare-id\.title/);
 const alteredSafety=STEPS.map(step=>step.id==='prepare-servo'?{...step,check:'无需断开 USB 与电池即可换接。'}:step);
 const values={ACTORS,STEPS:originalGuidanceSteps(alteredSafety),CHAPTERS,snapshots:STEPS.map((_,i)=>[0,.2,.5,1].map(p=>snapshot(i,p)))};
 assert.notEqual(fingerprint(values),originalPortableFingerprint,'A non-allowed manufacturing/safety instruction must still fail parity');
 assert.deepEqual(STEPS,before,'The projection must not mutate the source tutorial');
});

test('assembly fingerprint tolerates measured trigonometric noise and detects tiny motion, order and enum changes',()=>{
 // Actual independent d5c old MJS values: macOS arm64 and Linux x64.
 const mac={rotation:[0,-1.5707963118937354,0],endpointQuaternions:[[0,-0.7071067759181914,0,0.7071067864549037]]};
 const linux={rotation:[0,-1.5707963009853283,0],endpointQuaternions:[[0,-0.7071067720614871,0,0.7071067903116078]]};
 assert.equal(fingerprint(mac),fingerprint(linux));
 assert.notEqual(fingerprint({...mac,rotation:[0,-1.5707963118937354+1e-6,0]}),fingerprint(mac));
 const pose={actorId:'r_hip',position:[1.234567891234,-2.345678912345,0],steps:['prepare','install'],visible:true,status:'ready'};
 assert.equal(fingerprint({...pose,position:[1.234567891234+1e-13,-2.345678912345,0]}),fingerprint(pose));
 for(const changed of [
  {...pose,position:[1.234567891234+1e-7,-2.345678912345,0]},
  {...pose,actorId:'l_hip'},
  {...pose,steps:['install','prepare']},
  {...pose,visible:false},
  {...pose,status:'waiting'},
  {...pose,position:[1.234567891234,-2.345678912345]},
 ])assert.notEqual(fingerprint(changed),fingerprint(pose));
 assert.throws(()=>fingerprint({position:[Infinity]}),/finite/);
});
