interface DisplayNode {
 readonly nodeType:number;readonly nodeName:string;nodeValue:string|null;readonly childNodes:ArrayLike<DisplayNode>;
 getAttributeNames?():string[];getAttribute?(name:string):string|null;setAttribute?(name:string,value:string):void;
}
const displayAttribute=/^(?:title|placeholder|alt|aria-(?:label|description|roledescription|valuetext))$/;
/** Copy explicitly rendered translations without replacing controls or changing their live state. */
export function copyDisplayTree(current:DisplayNode,next:DisplayNode):void {
 if(current.nodeType!==next.nodeType||current.nodeName!==next.nodeName)return;
 if(current.nodeType===3){if(current.nodeValue!==next.nodeValue)current.nodeValue=next.nodeValue;return;}
 if(current.setAttribute&&next.getAttributeNames&&next.getAttribute){
  for(const name of next.getAttributeNames())if(displayAttribute.test(name)){const value=next.getAttribute(name);if(value!==null&&current.getAttribute?.(name)!==value)current.setAttribute(name,value);}
 }
 if(current.childNodes.length!==next.childNodes.length)return;
 for(let index=0;index<current.childNodes.length;index++)copyDisplayTree(current.childNodes[index]!,next.childNodes[index]!);
}
let copyOnly=false;
export function refreshDisplayCopy(render:()=>void):void {copyOnly=true;try{render();}finally{copyOnly=false;}}
export function setLocalizedHTML(element:HTMLElement,html:string):void {
 if(!copyOnly){element.innerHTML=html;return;}
 const template=document.createElement('template');template.innerHTML=html;
 const current=[...element.childNodes].filter(node=>!(node instanceof Element&&node.hasAttribute('data-debug-persistent'))),next=[...template.content.childNodes];
 if(current.length!==next.length)return;
 for(let index=0;index<current.length;index++)copyDisplayTree(current[index]!,next[index]!);
}
export const isRefreshingCopy=()=>copyOnly;
