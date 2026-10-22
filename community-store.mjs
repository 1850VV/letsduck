// Local demonstration data only. Published versions are immutable snapshots.
export const COMMUNITY_KEY = 'duck-studio-community-v1';
export const MODEL_ID = 'xgo-duck-v2';
const SOURCE = '731b5be439edd589d2c46330e4ed8c9bc3bd6d4ddcb7bebbc02026a6a740c58c';
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const hardness = part => part.material === 'TPU 90A' ? '90A' : null;
const exactKeys = (value, expected) => value && !Array.isArray(value) && typeof value === 'object' && Object.keys(value).length === expected.length && expected.every(id => Object.hasOwn(value, id));

export function designEnvelope(model, design) {
  return {...clone(design), schemaVersion:1, modelId:MODEL_ID, sourceHash:model.source_sha256, source_sha256:model.source_sha256,
    partsById:Object.fromEntries(model.parts.map(p=>[p.id,{uuid:p.uuid,material:p.material,hardness:hardness(p)}]))};
}
export function assertCompatible(model, catalog, design) {
  if (model.source_sha256 !== SOURCE || model.parts.length !== 35) throw Error('当前模型不是已确认的 XGO Duck V2 源文件。');
  if (!design || design.schemaVersion !== 1 || design.modelId !== MODEL_ID || design.sourceHash !== SOURCE || design.source_sha256 !== SOURCE) throw Error('方案版本、模型或源文件 SHA256 不匹配。');
  const ids = model.parts.map(p=>p.id);
  for (const key of ['colors','assignments','partsById']) if (!exactKeys(design[key],ids)) throw Error('方案必须包含且仅包含原模型的 35 个零件。');
  const products = new Map(catalog.products.map(p=>[p.id,p]));
  for (const part of model.parts) {
    const manifest = design.partsById[part.id];
    if (!manifest || manifest.uuid !== part.uuid || manifest.material !== part.material || manifest.hardness !== hardness(part)) throw Error('零件 ID、UUID、原材料或硬度不匹配：'+part.id);
    const color = design.colors[part.id], product = products.get(design.assignments[part.id]);
    if (typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color) || !product || product.series !== part.material || product.hardness !== hardness(part) || product.hex.toUpperCase() !== color.toUpperCase()) throw Error('颜色或实际耗材绑定不兼容：'+part.id);
  }
  return true;
}
function seedsFor(model,catalog) {
  return [
    ['蓝白经典','蓝色工坊','#FFFFFF','#0056B8',4.8,128,62,'blue','干净的白色外壳，配上钴蓝眼框和脚壳。保留机器鸭最轻快的样子。'],
    ['远洋巡航','阿屿','#0056B8','#FFFFFF',4.7,86,38,'blue','让蓝色成为主角，白色在眼框与脚壳收尾。'],
    ['日落邮差','小满','#F7E6DE','#FF6A13',4.6,42,21,'warm','柔和的杏色与醒目的橙色，像傍晚送来一封信。'],
    ['森林漫游','苔藓实验室','#FFFFFF','#3F8E43',4.9,13,14,'green','保留白色外壳，给眼框、下巴和脚壳换上森林绿。'],
    ['月面漫步','Nori','#D1D3D5','#545454',4.5,64,27,'mono','浅灰与深灰的层次，让结构本身成为主角。'],
    ['紫电信号','小宇宙','#FFFFFF','#5E43B7',4.8,8,9,'purple','白色机身和紫色小细节，留一点来自外太空的感觉。'],
    ['左岸 / 右岸','半边晴','#FFFFFF','#00B1B7',5,1,2,'green','左右不必相同。左腿和左脚用松石绿，另一侧保持白色。',true],
    ['蜜糖假日','糖盒','#F7E6DE','#FEC600',4.3,22,11,'warm','暖黄色搭配浅杏色，让工作台多一只轻松的小伙伴。']
  ].map((x,i)=>{
    const colors = {}, assignments = {};
    for (const p of model.parts) {
      const color = p.color === '#FFFFFF' ? x[2] : p.color === '#0056B8' ? x[3] : p.color;
      colors[p.id] = x[9] && p.id === 'P2-03' ? '#FFFFFF' : x[9] && ['P5-02','P6-05','P6-03','P2-04'].includes(p.id) ? x[3] : color;
      assignments[p.id] = catalog.products.find(product=>product.series===p.material&&product.hex===colors[p.id])?.id || null;
    }
    const id='demo-'+(i+1);
    return designEnvelope(model,{id,versionId:id,schemeId:id,title:x[0],author:x[1],ownerId:'demo-author-'+i,colors,assignments,baseAverage:x[4],baseCount:x[5],baseForks:x[6],family:x[7],description:x[8],created:i,private:false,version:1});
  });
}
export function readPrivateDesigns(model,catalog,storage=globalThis.localStorage) {
  let raw;
  try {raw=JSON.parse(storage.getItem('duck-studio-workflows-v1'));} catch {return [];}
  if (raw?.version !== 1 || raw.source !== model.source_sha256 || !Array.isArray(raw.saved)) return [];
  return raw.saved.filter(d=>d && typeof d.id==='string' && /^custom-[a-z\d-]+$/i.test(d.id) && typeof d.name==='string').flatMap(d=>{
    const entry=designEnvelope(model,{...d,title:d.name,ownerId:'me',author:'我的工作室',private:true,baseAverage:0,baseCount:0,baseForks:0,created:d.created||0,version:1});
    // Local private target colors may remain unbound. They may be opened, but
    // strict compatibility is still required before a community publication.
    if (!model.parts.every(p=>/^#[\da-f]{6}$/i.test(entry.colors?.[p.id]))) return [];
    const products=new Map(catalog.products.map(p=>[p.id,p]));
    entry.colors=Object.fromEntries(model.parts.map(p=>[p.id,entry.colors[p.id].toUpperCase()]));
    entry.assignments=Object.fromEntries(model.parts.map(p=>{
      const product=products.get(entry.assignments?.[p.id]);
      return [p.id,product?.series===p.material && product.hardness===hardness(p) && product.hex.toUpperCase()===entry.colors[p.id] ? product.id : null];
    }));
    return [entry];
  });
}
// Prefer the visible shells when classifying a new publication. Internal black
// structure and soft pads must not hide the exterior's dominant accent color.
const EXTERIOR_PARTS=new Set(['P4-01','P2-01','P2-02','P3-01','P5-06','P5-07','P4-03','P5-03','P5-01','P5-02','P6-04','P6-05','P6-02','P6-03','P2-03','P2-04']);
function colorFamily(hex) {
  const [r,g,b]=hex.slice(1).match(/../g).map(value=>parseInt(value,16)/255);
  const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
  if(max<.12 || delta<.06 || delta/max<.1)return null;
  const hue=((max===r?(g-b)/delta:max===g?(b-r)/delta+2:(r-g)/delta+4)*60+360)%360;
  return hue<75||hue>=335?'warm':hue<175?'green':hue<245?'blue':'purple';
}
function publicationFamily(model,colors) {
  const dominant=parts=>{
    const counts=new Map();
    for(const p of parts){const color=colors[p.id].toUpperCase();if(colorFamily(color))counts.set(color,(counts.get(color)||0)+1);}
    const winner=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
    return winner?colorFamily(winner[0]):null;
  };
  return dominant(model.parts.filter(p=>EXTERIOR_PARTS.has(p.id)))||dominant(model.parts)||'mono';
}
export function createCommunity(model,catalog,storage=globalThis.localStorage) {
  const seeds=seedsFor(model,catalog);
  seeds.forEach(d=>assertCompatible(model,catalog,d));
  const empty=()=>({schemaVersion:1,source:SOURCE,ratings:{},published:[],forks:{},pending:null,receipts:{}});
  function read() {
    let value;
    try {value=JSON.parse(storage.getItem(COMMUNITY_KEY));} catch {throw Error('社区演示数据无法读取；原数据仍保留。');}
    if (!value) return empty();
    if (value.schemaVersion!==1 || value.source!==SOURCE || !Array.isArray(value.published) || !value.ratings || !value.forks || !value.receipts) throw Error('社区演示存储版本不兼容；原数据仍保留。');
    return value;
  }
  function write(value) {
    try {storage.setItem(COMMUNITY_KEY,JSON.stringify(value));} catch {throw Error('浏览器存储失败，操作未完成；请先保留当前方案。');}
  }
  const validate=design=>{try{return assertCompatible(model,catalog,design);}catch{return false;}};
  function entries(state) {return [...seeds,...state.published.filter(validate)];}
  function list() {return clone(entries(read()));}
  function find(id) {return list().find(d=>d.id===id)||null;}
  function stats(design) {
    const state=read(),entry=entries(state).find(d=>d.id===design?.id)||design||{};
    const vote=state.ratings[entry.versionId||entry.id],validVote=Number.isInteger(vote)&&vote>=1&&vote<=5?vote:0;
    const count=(entry.baseCount||0)+(validVote?1:0),sum=(entry.baseAverage||0)*(entry.baseCount||0)+validVote;
    return {count,average:count?sum/count:0,rank:(sum+35)/(count+10),forks:(entry.baseForks||0)+(state.forks[entry.id]||0),vote:validVote};
  }
  function rate(id,value) {
    const state=read(),entry=entries(state).find(d=>d.id===id);
    if(!entry)throw Error('该发布版本不存在。');
    if(entry.ownerId==='me')throw Error('不能给自己的作品评分。');
    if(!Number.isInteger(value)||value<1||value>5)throw Error('评分必须为 1–5 星。');
    state.ratings[entry.versionId]=value;write(state);return stats(entry);
  }
  function requestFork(id) {
    const state=read(),entry=entries(state).find(d=>d.id===id);
    if(!entry)throw Error('该发布版本不存在。');assertCompatible(model,catalog,entry);
    if(state.pending?.sourceVersionId===id)return clone(state.pending);
    const source={derivedFromSchemeId:entry.schemeId,derivedFromVersionId:entry.versionId,sourceAuthor:entry.author,sourceTitle:entry.title};
    state.pending={id:'fork-'+crypto.randomUUID(),sourceVersionId:id,design:{...clone(entry),provenance:source},source};
    write(state);return clone(state.pending);
  }
  function pending() {return clone(read().pending);}
  function completeFork(requestId,customId) {
    const state=read();
    if(state.receipts[requestId]) {
      if(state.receipts[requestId].customId!==customId)throw Error('引用请求已对应另一份私有副本。');
      return clone(state.receipts[requestId]);
    }
    if(state.pending?.id!==requestId || !/^custom-[a-z\d-]+$/i.test(customId))throw Error('引用请求无效，未计入引用次数。');
    assertCompatible(model,catalog,state.pending.design);
    const sourceVersionId=state.pending.sourceVersionId,receipt={requestId,customId,sourceVersionId};
    state.forks[sourceVersionId]=(state.forks[sourceVersionId]||0)+1;
    state.receipts[requestId]=receipt;state.pending=null;write(state);return clone(receipt);
  }
  function publish(design,{title,description='',consent=false}={}) {
    if(consent!==true)throw Error('请明确同意允许其他人引用，再模拟发布。');
    if(typeof title!=='string'||!title.trim())throw Error('请输入方案名称。');
    assertCompatible(model,catalog,design);
    const state=read(),id='published-'+crypto.randomUUID();
    const entry={...clone(design),family:publicationFamily(model,design.colors),id,versionId:id,schemeId:id,title:title.trim().slice(0,40),description:String(description).trim().slice(0,240),ownerId:'me',author:'我的工作室',private:false,created:Date.now(),version:1,baseCount:0,baseAverage:0,baseForks:0};
    delete entry.locked;delete entry.dirty;delete entry.forkRequestId;
    // Do not copy a previous public version's ratings or mutable storage fields.
    state.published.push(entry);write(state);return clone(entry);
  }
  return {list,find,stats,rate,requestFork,pending,completeFork,publish,getState:()=>clone(read()),validate};
}
