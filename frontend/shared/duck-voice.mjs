// MicroDuck's voice synthesizer, ported to JavaScript.
//
// Source: pollen-robotics/microduck, sounds/src/{rng,synth,personality,voices}.rs at commit
// 942e58e3aa6dbb28e7037203fff11866122c7567, Copyright Pollen Robotics, Apache License 2.0
// (see MICRODUCK-LICENSE.txt next to this file). Changes from the original: translated from Rust
// to JavaScript; u64 arithmetic emulated with 32-bit halves; f32 rounding reproduced with
// Math.fround so output tracks the Rust renderer; WAV writing, the hardware seed and the
// chorale/stream modules are not ported. The recipes themselves are unchanged.
//
// A single u32 seed derives a personality (register, tilt, nasality, quackiness, tempo…);
// each tag has variants so the duck never sounds like a stuck recording.

const f32=Math.fround,TAU=Math.PI*2;
export const SR=48000;
const TUNED_SR=22050;

// ---------- rng.rs: xoshiro256++ seeded through splitmix64 ----------
const M64=(1n<<64n)-1n;
class Rng{
  constructor(seed){
    let x=BigInt(seed>>>0);const next=()=>{x=(x+0x9E3779B97F4A7C15n)&M64;let z=x;z=((z^(z>>30n))*0xBF58476D1CE4E5B9n)&M64;z=((z^(z>>27n))*0x94D049BB133111EBn)&M64;return z^(z>>31n);};
    this.s=new Uint32Array(8);for(let i=0;i<4;i++){const v=next();this.s[i*2]=Number(v>>32n);this.s[i*2+1]=Number(v&0xFFFFFFFFn);}
    this.spare=null;
  }
  nextU64(){
    const s=this.s,[h0,l0,h1,l1,h2,l2,h3,l3]=s;
    // result = rotl(s0 + s3, 23) + s0
    let al=(l0+l3)>>>0,ah=(h0+h3+(al<l0?1:0))>>>0;
    const rh=((ah<<23)|(al>>>9))>>>0,rl=((al<<23)|(ah>>>9))>>>0;
    const ol=(rl+l0)>>>0,oh=(rh+h0+(ol<rl?1:0))>>>0;
    const th=((h1<<17)|(l1>>>15))>>>0,tl=(l1<<17)>>>0;
    let n2h=h2^h0,n2l=l2^l0,n3h=h3^h1,n3l=l3^l1;const n1h=h1^n2h,n1l=l1^n2l,n0h=h0^n3h,n0l=l0^n3l;
    n2h^=th;n2l^=tl;
    // rotl(s3, 45) = swap halves, then rotl 13
    const sh=n3l,sl=n3h;n3h=((sh<<13)|(sl>>>19))>>>0;n3l=((sl<<13)|(sh>>>19))>>>0;
    s[0]=n0h;s[1]=n0l;s[2]=n1h;s[3]=n1l;s[4]=n2h;s[5]=n2l;s[6]=n3h;s[7]=n3l;
    return [oh,ol];
  }
  random(){const [h,l]=this.nextU64();return (h*2097152+(l>>>11))/9007199254740992;}
  uniform(lo,hi){return lo+(hi-lo)*this.random();}
  integers(lo,hi){return lo+Math.floor(this.random()*(hi-lo));}
  choice(a){return a[this.integers(0,a.length)];}
  standardNormal(){
    if(this.spare!==null){const z=this.spare;this.spare=null;return z;}
    const r=1-this.random(),theta=TAU*this.random(),mag=Math.sqrt(-2*Math.log(r));
    this.spare=f32(mag*Math.sin(theta));return f32(mag*Math.cos(theta));
  }
}
export function crc32(text){let crc=0xFFFFFFFF;for(const b of new TextEncoder().encode(text)){crc^=b;for(let k=0;k<8;k++){const mask=-(crc&1);crc=(crc>>>1)^(0xEDB88320&mask);}}return (~crc)>>>0;}

// ---------- synth.rs ----------
function tAxis(dur){const n=Math.max(1,Math.round(dur*SR)),t=new Float32Array(n);for(let i=0;i<n;i++)t[i]=i/SR;return t;}
function lerp(t,pts){const out=new Float32Array(t.length);for(let i=0;i<t.length;i++){const x=t[i];if(x<=pts[0][0]){out[i]=pts[0][1];continue;}let v=pts.at(-1)[1];for(let k=0;k<pts.length-1;k++){const [x0,y0]=pts[k],[x1,y1]=pts[k+1];if(x<=x1){v=x1<=x0?y1:y0+(y1-y0)*(x-x0)/(x1-x0);break;}}out[i]=v;}return out;}
function expdecay(t,attackS,decayS){const a=f32(Math.max(attackS,1e-4)),d=f32(Math.max(decayS,1e-4)),out=new Float32Array(t.length);for(let i=0;i<t.length;i++){const x=t[i],av=Math.min(1,Math.max(0,f32(x/a))),dv=f32(Math.exp(f32(-Math.max(f32(x-a),0)/d)));out[i]=av*dv;}return out;}
function bell(t,attackS,releaseS){const total=t.length?t[t.length-1]:0,relStart=Math.max(total-releaseS,0),attack=Math.max(attackS,1e-4),release=Math.max(releaseS,1e-4),out=new Float32Array(t.length);for(let i=0;i<t.length;i++){const x=t[i];let v=1;if(x<attackS)v=x/attack;if(x>relStart)v=Math.max(1-(x-relStart)/release,0);out[i]=Math.min(1,Math.max(0,v));}return out;}
function phaseFromFreq(freq){const out=new Float32Array(freq.length);let acc=0;for(let i=0;i<freq.length;i++){acc+=freq[i];out[i]=TAU*acc/SR;}return out;}
function harmonicOsc(phase,weights){const out=new Float32Array(phase.length);weights.forEach((w,k)=>{if(w===0)return;const n=k+1,wf=f32(w);for(let i=0;i<phase.length;i++)out[i]=out[i]+f32(wf*f32(Math.sin(f32(n*phase[i]))));});return out;}
function vibrato(t,rate,depth,ph){const out=new Float32Array(t.length);if(rate<=0||depth<=0){out.fill(1);return out;}for(let i=0;i<t.length;i++)out[i]=2**(depth*Math.sin(TAU*rate*t[i]+ph)/12);return out;}
function movingAverageSame(x,k){const n=x.length,out=new Float32Array(n),offset=Math.floor((k-1)/2),inv=f32(1/k);let acc=0,hi=0;for(let i=0;i<n;i++){const want=Math.min(i+offset+1,n);while(hi<want){acc=f32(acc+x[hi]);hi++;}const lo=Math.max(i+offset+1-k,0);if(i>0){const prevLo=Math.max(i+offset-k,0);for(let j=prevLo;j<lo;j++)acc=f32(acc-x[j]);}out[i]=acc*inv;}return out;}
function jitter(t,depth,rng){const out=new Float32Array(t.length);if(depth<=0){out.fill(1);return out;}const raw=new Float32Array(t.length);for(let i=0;i<raw.length;i++)raw[i]=rng.standardNormal();const sm=movingAverageSame(raw,Math.max(1,Math.round(64*SR/TUNED_SR)));for(let i=0;i<sm.length;i++)out[i]=2**(depth*sm[i]/12);return out;}
function pinkNoise(n,rng){const a=f32(0.985**(TUNED_SR/SR)),out=new Float32Array(n);let leak=0,peak=0;for(let i=0;i<n;i++){leak=f32(f32(a*leak)+rng.standardNormal());out[i]=leak;peak=Math.max(peak,Math.abs(leak));}peak=f32(peak+1e-9);for(let i=0;i<n;i++)out[i]=out[i]/peak;return out;}
function click(n,rng,length){const out=new Float32Array(n),l=Math.min(length,n);for(let i=0;i<l;i++){const fade=f32(1-f32(i/l));out[i]=f32(f32(rng.uniform(-1,1))*fade)*fade;}return out;}
function normalise(x,db){let peak=0;for(const v of x)peak=Math.max(peak,Math.abs(v));peak=f32(peak+1e-9);const gain=f32(f32(10**(db/20))/peak);for(let i=0;i<x.length;i++)x[i]=x[i]*gain;return x;}
const mul=(a,b)=>{const o=new Float32Array(a.length);for(let i=0;i<a.length;i++)o[i]=a[i]*b[i];return o;};
const concat=(...parts)=>{const o=new Float32Array(parts.reduce((n,p)=>n+p.length,0));let k=0;for(const p of parts){o.set(p,k);k+=p.length;}return o;};

// ---------- personality.rs ----------
export function personalityFromSeed(seed){
  const rng=new Rng(seed),register=rng.choice([-1,0,0,1])+rng.uniform(-.4,.4),base=rng.uniform(160,380);
  const p={seed:seed>>>0,pitchCenterHz:Math.min(620,Math.max(110,base*2**(register*.45))),register};
  // Field order matters: each draws from the stream in the Rust struct's order.
  for(const [k,lo,hi] of [['pitchSpread',.4,1.2],['glideBias',-1,1],['brightness',.05,.55],['tilt',1.4,2.8],['nasal',.1,1],['harmonicSkew',-1,1]])p[k]=rng.uniform(lo,hi);
  p.formantN=rng.integers(1,6);
  for(const [k,lo,hi] of [['formantGain',0,1.4],['vibratoRateHz',3.5,9.5],['vibratoDepth',0,.7],['jitterDepth',.03,.35],['breath',0,.3],['quackiness',.2,1],['amRateHz',18,55],['amDepth',.15,.7],['warbleHz',7,18],['warbleDepth',0,1.4],['attackSharpness',0,1],['speed',.82,1.22]])p[k]=rng.uniform(lo,hi);
  return p;
}
function variantRng(p,tag,variant){return new Rng(((Math.imul(p.seed,1000003)>>>0)^crc32(tag)^(Math.imul(variant,2654435761|0)>>>0))>>>0);}
function harmonics(p){const N=7,w=[];for(let n=1;n<=N;n++){const base=1/n**p.tilt,lift=p.brightness*(n/N)**1.5,nasal=p.nasal*(n===2||n===3?.6:0),skew=p.harmonicSkew>=0?p.harmonicSkew*(n%2===0?.4:-.2):-p.harmonicSkew*(n%2===0?-.3:.4),formant=n===p.formantN?p.formantGain:0;w.push(Math.max(0,base+lift+nasal+skew+formant*base*1.5));}w[0]=Math.max(w[0],.7);return w;}

// ---------- voices.rs ----------
const attack=(p,dur,snappy)=>{const soft=.04*dur,sharp=.003*dur;return Math.max(soft+(sharp-soft)*p.attackSharpness*snappy,.001);};
function voice(p,t,freq,rng,amScale,breathScale){
  const vib=vibrato(t,p.vibratoRateHz,p.vibratoDepth,rng.uniform(0,TAU)),jit=jitter(t,p.jitterDepth,rng),f=new Float32Array(t.length);
  for(let i=0;i<t.length;i++)f[i]=f32(freq[i]*vib[i])*jit[i];
  const body=harmonicOsc(phaseFromFreq(f),harmonics(p)),amD=p.amDepth*amScale*p.quackiness;
  if(amD>.01)for(let i=0;i<t.length;i++)body[i]=body[i]*f32(1-amD*(.5+.5*Math.sin(TAU*p.amRateHz*t[i])));
  const breath=p.breath*breathScale;
  if(breath>0){const noise=pinkNoise(t.length,rng),b=f32(breath);for(let i=0;i<t.length;i++)body[i]=body[i]+f32(b*noise[i]);}
  return body;
}
function alarm(p,variant){
  const rng=variantRng(p,'alarm',variant),dur=(.2+.12*rng.random())/p.speed,t=tAxis(dur);
  const f0=p.pitchCenterHz*(1.25+.35*p.pitchSpread)*(.94+.12*rng.random()),peakMul=1.15+.25*p.pitchSpread+.1*rng.random(),fallMul=.75+.2*(1-p.pitchSpread);
  const freq=lerp(t,[[0,f0],[.05*dur,f0*peakMul],[dur,f0*fallMul]]),env=expdecay(t,attack(p,dur,1),dur*(.4+.2*rng.random()));
  const sig=mul(voice(p,t,freq,rng,.5,1),env),crackle=f32(.04+.1*p.brightness);
  for(let i=0;i<sig.length;i++)sig[i]=sig[i]+f32(f32(crackle*rng.standardNormal())*env[i]);
  return normalise(sig,-3);
}
function greetSyllable(p,rng,durScale,f0Scale){
  const dur=(.32+.25*rng.random())*durScale/p.speed,t=tAxis(dur),f0=p.pitchCenterHz*(.9+.15*rng.random())*f0Scale;
  const bias=p.glideBias,bend=.1+.15*p.pitchSpread,start=f0*(1-bias*bend*.5),mid=f0*(1+bias*bend),end=f0*(1-bias*bend*.3)*(.92+.08*rng.random());
  return mul(voice(p,t,lerp(t,[[0,start],[.18*dur,mid],[dur,end]]),rng,1,1),expdecay(t,attack(p,dur,.5),dur*.7));
}
function greet(p,variant){
  const rng=variantRng(p,'greet',variant);let sig=greetSyllable(p,rng,1,1);
  if(rng.random()<.4){const gap=Math.floor((.05+.06*rng.random())/p.speed*SR),f0Scale=.95+.06*rng.random();sig=concat(sig,new Float32Array(gap),greetSyllable(p,rng,.8,f0Scale));}
  return normalise(sig,-3);
}
function inquire(p,variant){
  const rng=variantRng(p,'inquire',variant),dur=(.42+.25*rng.random())/p.speed,t=tAxis(dur),f0=p.pitchCenterHz*(.88+.1*rng.random());
  const rise=1.15+.5*p.pitchSpread+.2*Math.max(p.glideBias,0)+.1*rng.random(),freq=lerp(t,[[0,f0*.92],[.3*dur,f0*.95],[dur,f0*rise]]);
  const env=bell(t,dur*(.06+.1*(1-p.attackSharpness)),dur*.32);
  return normalise(mul(voice(p,t,freq,rng,.6,1),env),-3);
}
function peck(p,variant){
  const rng=variantRng(p,'peck',variant),dur=(.16+.12*rng.random())/p.speed,t=tAxis(dur),f0=p.pitchCenterHz*(.45+.2*rng.random());
  const body=mul(voice(p,t,lerp(t,[[0,f0*1.5],[.04*dur,f0],[dur,f0*.8]]),rng,.3,.5),expdecay(t,attack(p,dur,1),dur*.35));
  const c=click(t.length,rng,Math.floor((.003+.006*p.attackSharpness)*SR)),g=f32(.4+.4*p.attackSharpness);
  for(let i=0;i<body.length;i++)body[i]=body[i]+f32(g*c[i]);
  return normalise(body,-3);
}
function chirpSyllable(p,rng,f0,dur,contour){
  const t=tAxis(dur),warble=vibrato(t,p.warbleHz,p.warbleDepth,rng.uniform(0,TAU)),shape=lerp(t,contour),freq=new Float32Array(t.length),f0f=f32(f0);
  for(let i=0;i<t.length;i++)freq[i]=f32(f0f*shape[i])*warble[i];
  const env=expdecay(t,attack(p,dur,.7),dur*.55),soft={...p,quackiness:p.quackiness*.2,brightness:p.brightness*.5,formantGain:p.formantGain*.5};
  return mul(voice(soft,t,freq,rng,1,.4),env);
}
function chirp(p,variant){
  const rng=variantRng(p,'chirp',variant),shape=variant%4,f0=p.pitchCenterHz*(.95+.75*rng.random());let sig;
  if(shape===0){const dur=(.1+.1*rng.random())/p.speed,peak=1.12+.1*rng.random();sig=chirpSyllable(p,rng,f0,dur,[[0,.88],[.5*dur,peak],[dur,1.05]]);}
  else if(shape===1){const dur=(.1+.1*rng.random())/p.speed,start=1.12+.1*rng.random();sig=chirpSyllable(p,rng,f0,dur,[[0,start],[.3*dur,1],[dur,.78]]);}
  else if(shape===2){const dur=(.22+.14*rng.random())/p.speed;sig=chirpSyllable({...p,warbleDepth:Math.max(p.warbleDepth,.7)*1.6},rng,f0,dur,[[0,1],[.5*dur,1.06],[dur,.94]]);}
  else{const dur=(.08+.05*rng.random())/p.speed,a=chirpSyllable(p,rng,f0,dur,[[0,.95],[.4*dur,1.1],[dur,.88]]),gap=Math.floor((.03+.03*rng.random())/p.speed*SR),durB=dur*.9,f0B=f0*(.92+.1*rng.random());
    sig=concat(a,new Float32Array(gap),chirpSyllable(p,rng,f0B,durB,[[0,.95],[.4*durB,1.1],[durB,.88]]));}
  return normalise(sig,-6);
}
function coo(p,variant){
  const rng=variantRng(p,'coo',variant),dur=(.85+.55*rng.random())/p.speed,t=tAxis(dur);
  const f0=p.pitchCenterHz*(.42+.15*(1-p.attackSharpness))*(.94+.12*rng.random()),driftA=1+.05*rng.random()+.04*p.glideBias;
  const freq=lerp(t,[[0,f0*.94],[dur*.5,f0*driftA],[dur,f0*.9]]),env=bell(t,dur*(.18+.1*(1-p.attackSharpness)),dur*.3);
  const soft={...p,breath:Math.max(p.breath,.12)+.1,quackiness:p.quackiness*.25,amRateHz:p.amRateHz*.3,vibratoRateHz:p.vibratoRateHz*.45,vibratoDepth:p.vibratoDepth*.7};
  return normalise(mul(voice(soft,t,freq,rng,1,1),env),-5);
}
export function wheeeSegments(p,variant){
  const rng=variantRng(p,'wheee',variant),dStart=(.8+.3*rng.random())/p.speed,dLoop=(1.6+.6*rng.random())/p.speed,dEnd=(.55+.25*rng.random())/p.speed,total=dStart+dLoop+dEnd,t=tAxis(total),t1=dStart,t2=dStart+dLoop;
  const f0=p.pitchCenterHz*(.95+.1*rng.random()),top=1.6+.5*p.pitchSpread+.25*rng.random();
  const base=lerp(t,[[0,f0*.85],[.15*dStart,f0],[t1,f0*top],[t2,f0*top],[t2+.25*dEnd,f0*top*1.04],[total,f0*.6]]),wobHz=4.5+3*rng.random(),swell=lerp(t,[[0,.15],[t1,1],[total,1]]),freq=new Float32Array(t.length);
  for(let i=0;i<t.length;i++)freq[i]=base[i]*f32(2**(.5*swell[i]*Math.sin(TAU*wobHz*t[i])/12));
  const env=lerp(t,[[0,0],[Math.min(.06,.5*dStart),1],[t2+.4*dEnd,1],[total,0]]),joy={...p,vibratoDepth:p.vibratoDepth*.5,quackiness:p.quackiness*.5};
  const sig=normalise(mul(voice(joy,t,freq,rng,.5,.5),env),-4),n1=Math.floor(t1*SR),n2=Math.floor(t2*SR);
  const start=sig.slice(0,n1),loop=sig.slice(n1,n2),end=sig.slice(n2),nx=Math.min(Math.floor(.08*SR),Math.floor(loop.length/2),n1),len=loop.length;
  for(let i=0;i<nx;i++){const w=f32(i/Math.max(f32(Math.max(nx,1)-1),1)),k=len-nx+i;loop[k]=f32(f32(1-w)*loop[k])+f32(w*sig[n1-nx+i]);}
  return [start,loop,end];
}
function wheee(p,variant){const [s,l,e]=wheeeSegments(p,variant);return concat(s,l,l,e);}

export const TAGS={alarm,greet,inquire,peck,chirp,coo,wheee};
export const variantCount=tag=>tag==='greet'||tag==='chirp'?12:tag==='wheee'?6:10;
export function render(tag,p,variant){const recipe=TAGS[tag];if(!recipe)throw Error('unknown tag '+tag);return recipe(p,variant);}
