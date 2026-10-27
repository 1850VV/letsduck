import test from 'node:test';
import assert from 'node:assert/strict';
import {compatibleProduct,brandId,productLabel,seriesProducts} from '../frontend/lib/filaments.mjs';
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
