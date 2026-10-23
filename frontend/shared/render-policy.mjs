// Scheduling and quality-neutral policy; no resolution or material changes.
export function demandLoop(draw,request=requestAnimationFrame) {
  let pending=false;
  function invalidate(){if(pending)return;pending=true;request(()=>{pending=false;if(draw())invalidate();});}
  return invalidate;
}
const median=values=>{const a=[...values].sort((a,b)=>a-b);return a[Math.floor(a.length/2)];};
export function preferDepth(plain,depth) {
  if(plain.length<12||depth.length<12)return false;
  const g0=median(plain.map(s=>s.gpu)),g1=median(depth.map(s=>s.gpu));
  const c0=median(plain.map(s=>s.cpu)),c1=median(depth.map(s=>s.cpu));
  return [g0,g1,c0,c1].every(Number.isFinite)&&g1<g0*.93&&c1<c0+1&&c1<Math.max(4,g0);
}
