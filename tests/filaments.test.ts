import test from 'node:test';
import assert from 'node:assert/strict';
import {compatibleProduct,brandId,productLabel,seriesProducts} from '../frontend/lib/filaments.js';
const product={id:'sample-cf',brand:'Sample Maker',series:'PLA-CF',material:'PLA',name:'Sample blue',hex:'#123456',colorCode:'A1'};
test('real rigid products retain their series and identity',()=>{
 assert.equal(compatibleProduct('PLA Basic',product),true);
 assert.equal(productLabel(product),'Sample Maker · PLA-CF · Sample blue · A1');
 assert.equal(brandId({brand:'Bambu Lab'}),'bambu');
 assert.deepEqual(seriesProducts([product],brandId(product),'PLA Basic','PLA-CF').map(p=>p.id),['sample-cf']);
});
test('soft parts keep their specified hardness across brands',()=>{
 const tpu={...product,material:'TPU',series:'Sample Flex',hardness:'90A'};
 assert.equal(compatibleProduct('TPU 90A',tpu),true);
 assert.equal(compatibleProduct('TPU 90A',{...tpu,hardness:'95A'}),false);
 assert.equal(compatibleProduct('TPU 90A',product),false);
 assert.equal(compatibleProduct('PLA Basic',tpu),false);
});
test('unverified swatches and support materials are not printable part choices',()=>{
 for(const patch of [{hex:null},{selectable:false},{demo:true},{material:'SUPPORT'}])assert.equal(compatibleProduct('PLA Basic',{...product,...patch}),false);
});
test('BOM rows preserve series, missing codes, all SKUs and all published colours',async()=>{
 const {materialRows,csvText}=await import('../frontend/lib/filaments.js');
 const p={...product,colorCode:null,skus:['S1','S2'],colors:['#123456','#FEDCBA'],sourceUrl:'https://example.test/official'};
 const rows=materialRows({parts:[{id:'part',plate:2,name:'Part',originalName:'part.stl',slot:5,uuid:'uuid',product:p}],slots:[{slot:5,profile:{name:'Generic PLA-CF'}}]});
 assert.deepEqual(rows[0],['part',2,'Part','part.stl','PLA','Sample Maker','PLA-CF','Sample blue','','S1 | S2','sample-cf','','#123456','#123456 #FEDCBA',5,'Generic PLA-CF','https://example.test/official','uuid']);
 assert.equal(csvText([['a"b',null]]),'\ufeff"a""b",""');
});

test('support filaments cannot become structural parts through their broad polymer family',()=>{
 for(const [series,material]of [['PolySupport for PLA','PLA'],['PolySupport for PA12','PA12']] as const)assert.equal(compatibleProduct('PLA Basic',{...product,series,material}),false);
});
