// Instance counts come from the current model/plan, never the prototype examples.
export function paintScope(parts, targets, locks = new Set()) {
 const byId = new Map(parts.map(p => [p.id, p]));
 const ids = [...new Set(targets)].filter(id => byId.has(id));
 const locked = ids.filter(id => locks.has(id)).length;
 return {ids, count:ids.length, editable:ids.length-locked, locked,
  materials:[...new Set(ids.map(id => byId.get(id).material.startsWith('TPU') ? byId.get(id).material : 'PLA'))]};
}
export function deliverySummary(parts, assignments) {
 return {plates:new Set(parts.map(p => p.plate)).size, parts:parts.length,
  materials:new Set(parts.map(p => assignments[p.id])).size};
}
export function toolShortcut(event, step) {
 if(step!==2 || event.metaKey || event.ctrlKey || event.altKey || event.target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName))return null;
 return {v:'select',b:'brush',i:'pick',f:'focus',p:'side',escape:'select'}[String(event.key).toLowerCase()] || null;
}
