import {dt} from './i18n.js';
import type {DuckAction} from './control.js';
// Picture of an Xbox-layout controller (Flydigi Vader prints A/B/X/Y like Xbox). Indexes are the browser's
// standard Gamepad mapping, which goes by position: 0 bottom, 1 right, 2 left, 3 top, 4 LB, 5 RB, 8 view, 12 d-pad up.
export type PadKey={key:string;button?:number;label:string;action?:DuckAction|'hold'|'policy'};
export const PAD_KEYS:readonly PadKey[]=[
 {key:'LB',button:4,label:'站稳',action:'hold'},{key:'RB',button:5,label:'走路',action:'policy'},
 {key:'A',button:0,label:'捡东西',action:'pick'},{key:'B',button:1,label:'右脚踢',action:'right-kick'},
 {key:'X',button:2,label:'左脚踢',action:'left-kick'},{key:'Y',button:3,label:'坐下',action:'sitstand'},
 {key:'↑',button:12,label:'翻滚',action:'roulade'},{key:'⧉',button:8,label:'全部放松'},
 {key:'L',label:'移动'},{key:'R',label:'转向'},
];
const face=(button:number,key:string,x:number,y:number)=>`<g class="pad-btn" data-pad-button="${button}"><circle cx="${x}" cy="${y}" r="7.5"/><text x="${x}" y="${y+3}">${key}</text></g>`;
const stick=(side:'L'|'R',x:number,y:number)=>`<circle class="pad-well" cx="${x}" cy="${y}" r="14"/><g class="pad-stick" data-pad-stick="${side}"><circle cx="${x}" cy="${y}" r="9"/><text x="${x}" y="${y+3}">${side}</text></g>`;
export function padMapHTML(label:(action:DuckAction)=>string){
 return `<div class="pad-title">${dt('🎮 手柄已连接')}</div><svg class="pad-svg" viewBox="0 0 240 132" aria-hidden="true">
 <g class="pad-btn" data-pad-button="4"><rect x="36" y="12" width="48" height="13" rx="6.5"/><text x="60" y="21.5">LB</text></g>
 <g class="pad-btn" data-pad-button="5"><rect x="156" y="12" width="48" height="13" rx="6.5"/><text x="180" y="21.5">RB</text></g>
 <path class="pad-body" d="M62 28H178C203 28 220 40 226 62L237 100C241 118 229 129 215 125C203 121 195 106 185 98H55C45 106 37 121 25 125C11 129-1 118 3 100L14 62C20 40 37 28 62 28Z"/>
 ${stick('L',62,58)}${stick('R',150,90)}
 <path class="pad-dpad" d="M85 85h10v20h-10zM75 85h30v10h-30z"/>
 <g class="pad-btn" data-pad-button="12"><rect x="85" y="74" width="10" height="11" rx="2"/></g>
 <g class="pad-btn" data-pad-button="8"><rect x="102" y="52" width="13" height="9" rx="4.5"/></g><rect class="pad-dpad" x="125" y="52" width="13" height="9" rx="4.5"/>
 ${face(3,'Y',178,42)}${face(2,'X',163,57)}${face(1,'B',193,57)}${face(0,'A',178,72)}
 </svg><ul class="pad-legend">${PAD_KEYS.map(k=>`<li data-pad-key="${k.key}"${k.button===undefined?'':` data-pad-button="${k.button}"`}><kbd>${k.key}</kbd><span>${dt(k.action&&k.action!=='hold'&&k.action!=='policy'?label(k.action):k.label)}</span></li>`).join('')}</ul>`;
}
/** Light up what is held down, nudge the sticks, grey out what cannot run right now. */
export function paintPad(root:HTMLElement,pad:Gamepad,enabled:(key:PadKey)=>boolean,label:(action:DuckAction)=>string){
 for(const el of root.querySelectorAll<SVGElement|HTMLElement>('[data-pad-button]'))el.classList.toggle('on',!!pad.buttons[Number(el.dataset.padButton)]?.pressed);
 for(const el of root.querySelectorAll<SVGGElement>('[data-pad-stick]')){const [x,y]=el.dataset.padStick==='L'?[0,1]:[2,3];el.setAttribute('transform',`translate(${(pad.axes[x!]??0)*5} ${(pad.axes[y!]??0)*5})`);}
 for(const key of PAD_KEYS){const li=root.querySelector<HTMLElement>(`li[data-pad-key="${key.key}"]`);if(!li)continue;li.classList.toggle('off',!enabled(key));if(key.action==='sitstand')li.querySelector('span')!.textContent=dt(label('sitstand'));}
}
