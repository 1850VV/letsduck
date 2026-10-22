// One place for the product name and mark, so a rename touches a single file.
export const BRAND={zh:'涂鸭',en:'DoodleDuck',tagline:'机器鸭涂装与配色社区'};

// Duck head (the robot's eye shell + beak) on a paint gradient, with a drop of colour and a brush stroke.
export function logoSVG(id='dd'){
  return `<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4d6bfe"/><stop offset=".6" stop-color="#7a5cff"/><stop offset="1" stop-color="#ff7a59"/></linearGradient></defs><rect width="40" height="40" rx="12" fill="url(#${id}-g)"/><path d="M8 25.5V17a8 8 0 0 1 16 0v3h7.5v5.5H14z" fill="#fff"/><circle cx="18.6" cy="15.6" r="2.3" fill="#4d6bfe"/><path d="M30.5 7.5c2 2.6 3 4.3 3 5.6a3 3 0 0 1-6 0c0-1.3 1-3 3-5.6z" fill="#ffd23f"/><path d="M9 30.5c5-1.6 12-1.6 22.5-.4" fill="none" stroke="#ffd23f" stroke-width="2.6" stroke-linecap="round"/></svg>`;
}
export function brandHTML(id){return `${logoSVG(id)}<span class="wordmark"><b>${BRAND.zh}</b><small>${BRAND.en}</small></span>`;}
export const faviconURL=()=>'data:image/svg+xml,'+encodeURIComponent(logoSVG('fav').replace('class="logo" ','xmlns="http://www.w3.org/2000/svg" '));
// Fills every [data-brand-slot] and the tab icon.
export function applyBrand(){
  document.querySelectorAll('[data-brand-slot]').forEach((el,i)=>{el.innerHTML=brandHTML('dd'+i);el.setAttribute('aria-label',BRAND.zh+' '+BRAND.en);});
  let link=document.querySelector('link[rel="icon"]');if(!link){link=document.createElement('link');link.rel='icon';document.head.append(link);}link.href=faviconURL();
}
