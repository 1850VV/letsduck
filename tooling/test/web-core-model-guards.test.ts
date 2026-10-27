import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseModelManifest,parseCatalog} from '../../frontend/shared/guards.js';
import {jsonParse,jsonStringify} from '../../frontend/shared/json.js';
test('authored unpaired parts retain explicit null and supplemental model metadata',()=>{
 const source='{"source_sha256":"synthetic","parts":[{"id":"p","uuid":"u","name":"n","originalName":"original","material":"PLA","color":"#FFFFFF","plate":1,"sourceObject":1,"sourcePart":1,"pair":null,"geometry":{"positionOffset":0,"indexOffset":0,"vertexCount":0,"indexCount":0},"printPositionOffset":0}],"hardware":[],"supplemental":1.0}';
 const model=parseModelManifest(jsonParse(source));assert.equal(model.parts[0]!.pair,null);assert.equal(jsonStringify(model),source);
 const catalog='{"products":[],"supplemental":1.0}';assert.equal(jsonStringify(parseCatalog(jsonParse(catalog))),catalog);
});
