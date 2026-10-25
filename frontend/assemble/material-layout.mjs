/** Unknown quantities deliberately show a single example, never an inferred count. */
export function displayQuantity(material){return material.quantity==='数量待核对'?null:material.count;}

export function specimenLayout(material){
 const count=displayQuantity(material)??1,columns=material.id==='p_motor'?count:Math.min(count,8);
 const size=count>1?Math.min(36,480/(columns*1.2)):60,pitch=size+6,rows=Math.ceil(count/columns);
 return {size,positions:Array.from({length:count},(_,i)=>[(i%columns-(columns-1)/2)*pitch,0,(Math.floor(i/columns)-(rows-1)/2)*pitch])};
}

/** Pack each group intact, reserving its height for the projected labels behind it. */
export function arrangeGroups(materials,sizes){
 const limit=Math.max(540,...sizes.map(s=>s.x)),shelves=[];
 const empty=()=>({indices:[],width:0,depth:0,height:0});let shelf=empty();
 sizes.forEach((size,i)=>{
  if(materials[i].id==='p_motor'){
   if(shelf.indices.length)shelves.push(shelf);
   shelves.push({indices:[i],width:size.x,depth:size.z,height:size.y});shelf=empty();return;
  }
  if(shelf.indices.length&&shelf.width+28+size.x>limit){shelves.push(shelf);shelf=empty();}
  shelf.width+=(shelf.indices.length?28:0)+size.x;shelf.depth=Math.max(shelf.depth,size.z);shelf.height=Math.max(shelf.height,size.y);shelf.indices.push(i);
 });
 if(shelf.indices.length)shelves.push(shelf);
 const gaps=shelves.slice(1).map((s,i)=>Math.max(s.height,shelves[i].height)*1.25+26);
 let z=-(shelves.reduce((n,s)=>n+s.depth,0)+gaps.reduce((n,g)=>n+g,0))/2;const positions=[];
 for(const[si,s]of shelves.entries()){
  let x=-s.width/2;
  for(const i of s.indices){positions[i]=[x+sizes[i].x/2,0,z+s.depth/2];x+=sizes[i].x+28;}
  z+=s.depth+(gaps[si]||0);
 }
 return positions;
}
