import type { FilamentProduct } from '@letsduck/contracts';
type Candidate = Partial<FilamentProduct>;
// A colour selection has a product identity as well as a display colour.
const rigid=new Set(['PLA','PETG','PET','ABS','ASA','PC','PC-ABS','PA','PA6','PA12','PA612','PAHT','PPA','PPS','PEEK','PP','HIPS','PVB','PBT','CoPA','CoPE']);
const hardness=(value: unknown)=>String(value||'').match(/\b(\d+(?:\.\d+)?[AD])\b/i)?.[1]?.toUpperCase();
export function compatibleProduct(material: string,product: Candidate | null | undefined): boolean {
 if(product?.role==='support'||/support|支撑|支撐/i.test(product?.series||''))return false;
 if(!product||product.demo||product.selectable===false||typeof product.hex!=='string'||!/^#[\da-f]{6}$/i.test(product.hex))return false;
 const family=product.material||String(product.series||'').split(/[ -]/)[0];
 if(String(material).startsWith('TPU'))return family==='TPU'&&!!hardness(material)&&hardness(product.hardness||product.series)===hardness(material);
 return typeof family==='string'&&rigid.has(family);
}
export function brandId(product: Candidate){const brands: Record<string,string>={'Bambu Lab':'bambu',eSUN:'esun',Polymaker:'polymaker',SUNLU:'sunlu'};return product.brandId||(product.brand&&brands[product.brand])||String(product.brand||'').toLowerCase().replace(/[^a-z\d]+/g,'-');}
export function productLabel(product: Candidate){return [product.brand,product.series,product.name,product.colorCode||product.skus?.[0]].filter(Boolean).join(' · ');}
export function seriesProducts<T extends Candidate>(products: Iterable<T>,brand: string,material: string,series=''){return [...products].filter(p=>brandId(p)===brand&&compatibleProduct(material,p)&&(!series||p.series===series));}

export interface MaterialReport { parts: {id: string; plate: number; name: string; originalName: string; product: FilamentProduct; slot: number; uuid: string}[]; slots: {slot: number; profile?: {status?: string; name?: string} | null}[] }
export function materialRows(report: MaterialReport,label: (value: string)=>string=value=>value){
 return report.parts.map(p=>{const v=p.product,profile=report.slots.find(s=>s.slot===p.slot)?.profile;return [p.id,p.plate,label(p.name),p.originalName,v.material,v.brand,v.series,v.name,v.colorCode||'',(v.skus||[]).join(' | '),v.id,v.diameter??'',v.hex,(v.colors||[v.hex]).join(' '),p.slot,profile?.status==='unavailable'?'':profile?.name||v.preset||'',v.productUrl||v.sourceUrl||'',p.uuid];});
}
export function csvText(rows: readonly (readonly unknown[])[]){return '\ufeff'+rows.map(row=>row.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\r\n');}
