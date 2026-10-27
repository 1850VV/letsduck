// Display-only rules for this source project. They never change print geometry.
export function detailRegion(parts: readonly {id: string; name: string; group?: string}[],id: string,single=false) {
  const p=parts.find(p=>p.id===id);
  if(!p)return {name:'部件',ids:[]};
  if(single)return {name:p.name,ids:[id]};
  if(p.group==='head'){
    const neck=['P3-02','P3-03','P6-01','P6-08'],isNeck=neck.includes(id);
    return {name:isNeck?'颈部连接':'头部',ids:parts.filter(x=>x.group==='head'&&neck.includes(x.id)===isNeck).map(x=>x.id)};
  }
  const group=p.group,side=group==='legs'?(p.name.includes('左')?'左':'右'):null;
  return {name:group==='head'?'头部与颈部':group==='body'?'身体':side+'腿与脚',
    ids:parts.filter(x=>x.group===group&&(!side||x.name.includes(side))).map(x=>x.id)};
}
export function gridSlots(count: number,aspect=1.25) {
  if(!count)return [];
  const columns=Math.ceil(Math.sqrt(count*aspect)),rows=Math.ceil(count/columns);
  return Array.from({length:count},(_,i)=>({x:(i%columns-(columns-1)/2)*150,y:((rows-1)/2-Math.floor(i/columns))*150}));
}
export function hsvToHex(h: number,s: number,v: number){
  h=((h%360)+360)%360;s=Math.max(0,Math.min(1,s));v=Math.max(0,Math.min(1,v));
  const c=v*s,x=c*(1-Math.abs(h/60%2-1)),m=v-c;
  const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return '#'+rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();
}
export function hexToHsv(hex: string){
  const [r,g,b]=[parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255],max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  return {h:d?((max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4)*60+360)%360:0,s:max?d/max:0,v:max};
}
