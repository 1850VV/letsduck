import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=readFileSync(new URL('../../frontend/gallery/gallery.ts',import.meta.url),'utf8');
const start=source.indexOf('function missingDetail('),end=source.indexOf('\nasync function rate(',start);
if(start<0||end<0)throw Error('Shipping gallery missingDetail declaration not found');
const implementation=stripTypeScriptTypes(source.slice(start,end));

// This narrow DOM fixture parses the actual generated controls; it does not recreate
// missingDetail. The full built-bundle journey separately exercises the real browser.
class NodeFixture {
  hidden=true;onclick:(()=>unknown)|null=null;readonly classes=new Set<string>();
  readonly classList={add:(name:string)=>{this.classes.add(name);}};
  constructor(readonly nodes:Map<string,NodeFixture>){}
  set innerHTML(html:string){for(const match of html.matchAll(/\bid="([^"]+)"/g)){const id=match[1];if(id)this.nodes.set('#'+id,new NodeFixture(this.nodes));}}
}
for(const unavailable of [false,true])test('missing gallery detail '+(unavailable?'offers retry':'has no retry')+' and returns home',()=>{
 const nodes=new Map<string,NodeFixture>();for(const id of ['#detail','#detail-body'])nodes.set(id,new NodeFixture(nodes));
 const query=(selector:string)=>nodes.get(selector)??null;
 const required=(selector:string)=>{const node=query(selector);if(!node)throw Error('Missing element: '+selector);return node;};
 const location={hash:'#d/deleted'},turntable:boolean[]=[];let refreshed=0;
 const body=new NodeFixture(nodes);
 const detailId:unknown=runInNewContext(implementation+'\nmissingDetail('+unavailable+');detailId;',{
  detailId:'initial',$:required,document:{body,querySelector:query},view:{setTurntable:(value:boolean)=>turntable.push(value)},_t:(key:string)=>key,refresh:()=>{refreshed++;},location,
 });
 assert.equal(detailId,'missing');assert.equal(required('#detail').hidden,false);assert.deepEqual(turntable,[false]);assert.equal(body.classes.has('locked'),true);
 required('#missing-home').onclick?.();assert.equal(location.hash,'#');
 const retry=query('#missing-retry');assert.equal(retry!==null,unavailable);retry?.onclick?.();assert.equal(refreshed,unavailable?1:0);
});
test('missing gallery detail ignores unavailable previous/next keyboard controls',()=>{
 const start=source.indexOf("window.addEventListener('keydown',"),end=source.indexOf("\n$('#app').addEventListener",start);assert.ok(start>=0&&end>start);
 let keydown:((event:{target:null;key:string})=>void)|undefined;
 runInNewContext(stripTypeScriptTypes(source.slice(start,end)),{
  window:{addEventListener:(_type:string,listener:typeof keydown)=>{keydown=listener;}},Element:class {},document:{querySelector:()=>null},detailId:'missing',
  $:(selector:string)=>{throw Error('Missing element: '+selector);},
 });
 assert.ok(keydown);assert.doesNotThrow(()=>{keydown?.({target:null,key:'ArrowLeft'});keydown?.({target:null,key:'ArrowRight'});});
});
test('locale refresh of missing gallery detail tolerates absent spin control',()=>{
 const start=source.indexOf('_onLocale(() => {');assert.ok(start>=0);const detail={scrollTop:23};let restoredScroll:number[]=[];
 assert.doesNotThrow(()=>runInNewContext(stripTypeScriptTypes(source.slice(start)),{
  _onLocale:(listener:()=>void)=>listener(),scrollY:17,$:(selector:string)=>{if(selector==='#detail')return detail;throw Error('Missing element: '+selector);},
  document:{querySelector:()=>null},view:{turntable:false,setTurntable:()=>{}},route:()=>{},detailId:'missing',
  scrollTo:(x:number,y:number)=>{restoredScroll=[x,y];},bindTranslations:()=>{},lastToast:undefined,
 }));
 assert.deepEqual(restoredScroll,[0,17]);assert.equal(detail.scrollTop,23);
});
