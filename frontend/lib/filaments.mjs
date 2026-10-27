// A colour selection has a product identity as well as a display colour.
const rigid=new Set(['PLA','PETG','PET','ABS','ASA','PC','PC-ABS','PA','PA6','PA12','PA612','PAHT','PPA','PPS','PEEK','PP','HIPS','PVB','PBT','CoPA','CoPE']);
const hardness=value=>String(value||'').match(/\b(\d+(?:\.\d+)?[AD])\b/i)?.[1].toUpperCase();
export function compatibleProduct(material,product){
 if(!product||product.demo||product.selectable===false||!/^#[\da-f]{6}$/i.test(product.hex))return false;
 const family=product.material||String(product.series||'').split(/[ -]/)[0];
 if(String(material).startsWith('TPU'))return family==='TPU'&&!!hardness(material)&&hardness(product.hardness||product.series)===hardness(material);
 return rigid.has(family);
}
export function brandId(product){return product.brandId||({'Bambu Lab':'bambu',eSUN:'esun',Polymaker:'polymaker',SUNLU:'sunlu'}[product.brand])||String(product.brand||'').toLowerCase().replace(/[^a-z\d]+/g,'-');}
export function productLabel(product){return [product.brand,product.series,product.name,product.colorCode||product.skus?.[0]].filter(Boolean).join(' · ');}
export function seriesProducts(products,brand,material,series=''){return [...products].filter(p=>brandId(p)===brand&&compatibleProduct(material,p)&&(!series||p.series===series));}
