import test from 'node:test';
import assert from 'node:assert/strict';
import {drawPoster} from '../frontend/shared/poster.mjs';

test('all poster sizes leave a positive model area even with 35 distinct materials', () => {
  const context = new Proxy({}, {get(target, key) {
    if (key === 'createLinearGradient') return () => ({addColorStop() {}});
    if (key === 'measureText') return text => ({width: text.length * 20});
    return target[key] ?? (() => {});
  }});
  const previous = globalThis.document;
  globalThis.document = {createElement: () => ({getContext: () => context})};
  try {
    const parts = Array.from({length:35}, (_, i) => ({id:'part-'+i}));
    const products = new Map(parts.map((p, i) => [p.id, {id:p.id,hex:'#345678',series:'PLA Basic',name:'色卡 '+i,colorCode:String(i)}]));
    const design = {colors:Object.fromEntries(parts.map(p=>[p.id,'#345678'])),assignments:Object.fromEntries(parts.map(p=>[p.id,p.id])),name:'许多颜色'};
    for (const ratio of ['3:4','1:1','9:16']) {
      drawPoster({view:{snapshot(w,h){assert.ok(h >= 200, ratio+' has no usable model area: '+h);return {};}},parts,products,design,
        opts:{ratio,theme:'light',materials:true,author:false,compare:false}});
    }
  } finally { globalThis.document = previous; }
});
