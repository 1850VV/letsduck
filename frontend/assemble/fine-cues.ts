import type {FineCue,Vector,State} from './types.js';

import {ACTORS,STEPS,snapshot} from './hardware-state.js';

import {fitsForCue} from './model-fit.js';
const cache: Map<number,FineCue[]>=new Map();
const wire=(actorId: string,endpoint=1,from=0,to=1,operation='connect')=>({id:actorId+':'+endpoint,actorId,type:'cable',endpoint,from,to,operation});
const plug=(actorId: string,from=0,to=1)=>({id:actorId,actorId,type:'plug',from,to,operation:'connect'});
const connections: Record<string,FineCue[]>={
 'prepare-battery':[wire('p_powerCable',1,.45,1)],
 'prepare-servo':[wire('p_servoCable',1,.45,1)],
 'prepare-usb':[wire('p_usb',0,.45,1)],
 'r-plug':[plug('plug')], 'l-plug':[plug('l_plug')],
 'r-wire-a':[wire('wire',1,0,.55),wire('r_legWireA',1,.35,1)],
 'l-wire-a':[wire('l_wire',1,0,.55),wire('l_legWireA',1,.35,1)],
 'r-wire-b':[wire('r_legWireB',1,0,1,'route')],
 'l-wire-b':[wire('l_legWireB',1,0,1,'route')],
 't-wire':[wire('t_baseWire',0,0,.18),wire('t_rollWireR',0,.22,.4),wire('t_baseWireL',0,.44,.62),wire('t_rollWireL',0,.66,.84)],
 't-motor-r':[wire('t_rollWireR',1,0,.2),wire('r_legWireB',1,.22,.48)],
 't-motor-l':[wire('t_rollWireL',1,0,.2),wire('l_legWireB',1,.22,.48)],
 'head-yaw-wire':[plug('h_plug32',.55,1)],
 'head-core-horn-wire':[plug('h_plug33',.55,1)],
 'head-mouth-horn-wire':[plug('h_plugMouth',.55,1)],
 'head-neck-wire':[wire('h_neckWire',0,0,.5),wire('h_headLead',0,.35,1),plug('h_plugNeck',.55,1)],
 'final-power':[plug('f_powerPlug')],
 'final-buses':[plug('f_busPlug0',0,.28),plug('f_busPlug1',.32,.6),plug('f_busPlug2',.64,.92)],
};
const precisionParts: Record<string,[string,string][]>={
 'r-small-bearing':[['bearing','foot']], 'l-small-bearing':[['l_bearing','l_foot']],
 'r-axle':[['axle','foot']], 'l-axle':[['l_axle','l_foot']],
 'r-bearing':[['r_lowerBearing','r_support']], 'l-bearing':[['l_lowerBearing','l_support']],
 'r-top-bearing':[['r_topBearing','r_topLink']], 'l-top-bearing':[['l_topBearing','l_topLink']],
 't-yaw-r':[['t_yawBearingR','t_yawR']], 't-yaw-l':[['t_yawBearingL','t_yawL']],
 't-bearing-r':[['t_legBearingR','r_topLink']], 't-bearing-l':[['t_legBearingL','l_topLink']],
 'head-yaw-motor':[['h_bearingCrown','h_pitchSupport']],
 'head-bearings':[['h_bearingFront','h_yawSupport'],['h_bearingBack','h_yawSupport']],
};
const distance=(a: Vector,b: Vector)=>Math.hypot(...a.map((n,i)=>n-b[i]!));
function crossing(fn:(progress:number)=>boolean,first:boolean){
 let lo=0,hi=1;
 for(let i=0;i<16;i++){const p=(lo+hi)/2;if(fn(p)===first)hi=p;else lo=p;}
 return (lo+hi)/2;
}

export function buildFineCues(index: number):FineCue[]{
 if(cache.has(index))return cache.get(index)!;
 const step=STEPS[index];if(!step||step.software||step.overview){cache.set(index,[]);return [];}
 const samples=Array.from({length:9},(_,i)=>snapshot(index,i/8)),first=samples[0]!,last=samples.at(-1)!,all: FineCue[]=[];
 for(const [id,a]of Object.entries(ACTORS)){
  if(a.kind==='screw'){
   if(a.hardwareStatus==='pending-hole-alignment'||samples.some(s=>s[id]!.status==='pending')||samples.every(s=>!s[id]!.visible))continue;
   const turns=samples.map(s=>s[id]!.turn||0);if(Math.max(...turns)-Math.min(...turns)<.1)continue;
   const start=turns[0]!,end=turns.at(-1)!;
   const from=crossing(p=>Math.abs((snapshot(index,p)[id]!.turn||0)-start)>.0001,true);
   const to=crossing(p=>Math.abs((snapshot(index,p)[id]!.turn||0)-end)<.0001,true);
   all.push({id,actorId:id,type:'screw',from,to,operation:last[id]!.status==='removed'?'remove':last[id]!.status==='moving'?'partial':'fasten',label:a.fastener?.replace('x','×')||'原装螺丝'});
  }else if(a.kind==='horn'&&last[id]!.status==='removed'&&first[id]!.status!=='removed'){
   const start=first[id]!.position,end=last[id]!.position;if(distance(start,end)<.1)continue;
   all.push({id,actorId:id,type:'part',operation:'remove',from:crossing(p=>distance(snapshot(index,p)[id]!.position,start)>.001,true),to:crossing(p=>distance(snapshot(index,p)[id]!.position,end)<.001,true),label:'副舵盘'});
  }
 }
 for(const c of connections[step.id]||[])all.push({...c,label:c.operation==='route'?'线端余量':'插头'});
 for(const [actorId,targetActor]of precisionParts[step.id]||[]){
  const relative=(p: State)=>p[actorId]!.position.map((n,i)=>n-p[targetActor]!.position[i]!),start=relative(first),end=relative(last);
  if(distance(start,end)<.01)continue;
  all.push({id:actorId,actorId,targetActor,type:'part',operation:'seat',label:/axle/i.test(actorId)?'踝轴':'轴承',from:crossing(p=>distance(relative(snapshot(index,p)),start)>.001,true),to:crossing(p=>distance(relative(snapshot(index,p)),end)<.001,true)});
 }
 if(step.id==='final-route')for(const actorId of ['f_bus0','f_bus1','f_bus2']){
  const before=first[actorId]!.points!,after=last[actorId]!.points!;
  let point=1;for(let i=2;i<after.length-1;i++)if(distance(before[i]!,after[i]!)>distance(before[point]!,after[point]!))point=i;
  all.push({...wire(actorId,1,0,1,'route'),id:actorId+':route',point,guide:'routing-loop',label:'线束整理'});
 }
 all.sort((a,b)=>a.from-b.from||a.to-b.to);
 all.forEach((c,i)=>{c.ordinal=i+1;c.total=all.length;c.fitPending=fitsForCue(c).length>0;});cache.set(index,all);return all;
}

export function selectFineCue(cues:FineCue[],progress: number){
 if(!cues.length)return null;
 const started=cues.filter(c=>c.from<=progress+.00001),ongoing=started.filter(c=>c.to>progress+.00001);
 if(!ongoing.length)return started.at(-1)||cues[0];
 const latest=Math.max(...ongoing.map(c=>c.from)),near=ongoing.filter(c=>Math.abs(c.from-latest)<.0001);
 const identical=near.filter(c=>Math.abs(c.to-near[0]!.to)<.01);
 if(identical.length>1){const next=cues.filter(c=>c.from>latest+.0001).map(c=>c.from),until=Math.min(identical[0]!.to,...next);const t=Math.max(0,Math.min(.999999,(progress-latest)/Math.max(.001,until-latest)));return identical[Math.floor(t*identical.length)];}
 return near[0];
}
