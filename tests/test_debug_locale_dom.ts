import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal node surface keeps this algorithm test independent of a browser or new DOM dependency.
class DisplayNode {
 nodeValue:string|null=null;
 childNodes:DisplayNode[]=[];
 attributes=new Map<string,string>();
 value='';checked=false;selectionStart=0;selectionEnd=0;oninput:unknown;
 constructor(public nodeType:number,public nodeName:string,text?:string){if(text!==undefined)this.nodeValue=text;}
 getAttributeNames(){return [...this.attributes.keys()];}
 getAttribute(name:string){return this.attributes.get(name)??null;}
 setAttribute(name:string,value:string){this.attributes.set(name,value);}
}
const text=(value:string)=>new DisplayNode(3,'#text',value);

test('Debug locale refresh changes display copy while retaining input nodes, values, selection and handlers',async()=>{
 const module=await import('../frontend/debug/localized-dom.js').catch(()=>null);
 assert.ok(module,'Debug needs a copy-only locale refresh');
 const current=new DisplayNode(1,'DIV'),next=new DisplayNode(1,'DIV');
 const label=new DisplayNode(1,'LABEL'),newLabel=new DisplayNode(1,'LABEL'),input=new DisplayNode(1,'INPUT'),newInput=new DisplayNode(1,'INPUT');
 label.childNodes=[text('目标位置'),input];newLabel.childNodes=[text('Target position'),newInput];current.childNodes=[label];next.childNodes=[newLabel];
 const handler=()=>{};input.value='2077';input.checked=true;input.selectionStart=1;input.selectionEnd=3;input.oninput=handler;
 input.setAttribute('aria-label','目标位置');input.setAttribute('placeholder','目标位置 · 单次±10');input.setAttribute('value','2077');input.setAttribute('aria-pressed','true');
 newInput.setAttribute('aria-label','Target position');newInput.setAttribute('placeholder','Target position · ±10 per move');newInput.setAttribute('value','2048');newInput.setAttribute('aria-pressed','false');
 module.copyDisplayTree(current,next);
 assert.equal(label.childNodes[0]!.nodeValue,'Target position');assert.equal(label.childNodes[1],input);
 assert.equal(input.getAttribute('aria-label'),'Target position');assert.equal(input.getAttribute('placeholder'),'Target position · ±10 per move');
 assert.equal(input.value,'2077');assert.equal(input.getAttribute('value'),'2077');assert.equal(input.checked,true);
 assert.equal(input.selectionStart,1);assert.equal(input.selectionEnd,3);assert.equal(input.oninput,handler);assert.equal(input.getAttribute('aria-pressed'),'true');
});
