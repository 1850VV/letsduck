import { FINISHES } from '@letsduck/domain';
import type { ExportPlan, ManufacturingValidation } from '@letsduck/contracts';
import type { Catalog, Design, Finish, GeometryLayout, GeometryModel, Hardware, Matrix3x4, ModelManifest, ModelPart, PositionMetadata, PreparedMesh, Product, PublicAuthor, Scheme, User, Work, MessageScalar, WireInteger } from './types.js';

export const record = (value:unknown):value is Record<string,unknown> => value!==null&&typeof value==='object'&&!Array.isArray(value);
export const numberArray = (value:unknown):value is number[] => Array.isArray(value)&&value.every(item=>typeof item==='number');
export const stringRecord = (value:unknown):value is Record<string,string> => record(value)&&Object.values(value).every(item=>typeof item==='string');
export const matrix3x4 = (value:unknown):value is Matrix3x4 => Array.isArray(value)&&value.length===3&&value.every(row=>numberArray(row)&&row.length===4);
export const geometryLayout = (value:unknown):value is GeometryLayout => record(value)&&['positionOffset','indexOffset','vertexCount','indexCount'].every(key=>typeof value[key]==='number');
export function geometryModel(value:unknown):value is GeometryModel {
  return record(value)&&Array.isArray(value.parts)&&value.parts.every(part=>record(part)&&typeof part.id==='string'&&geometryLayout(part.geometry)&&typeof part.printPositionOffset==='number')&&Array.isArray(value.hardware)&&value.hardware.every(item=>record(item)&&typeof item.name==='string'&&geometryLayout(item.geometry));
}
export function positionMetadata(value:unknown):value is PositionMetadata {
  return record(value)&&typeof value.id==='string'&&(value.kind==='part'||value.kind==='hardware')&&['vertices','triangles','bits'].every(key=>typeof value[key]==='number')&&numberArray(value.min)&&numberArray(value.scale)&&numberArray(value.v)&&numberArray(value.i)&&(value.printMatrix===undefined||matrix3x4(value.printMatrix))&&(value.printMatrix64===undefined||numberArray(value.printMatrix64));
}
function modelPart(value:unknown):value is ModelPart {
  return record(value)&&['id','uuid','name','originalName','material','color'].every(key=>typeof value[key]==='string')&&['plate','sourceObject','sourcePart','printPositionOffset'].every(key=>typeof value[key]==='number')&&geometryLayout(value.geometry)&&(value.group===undefined||typeof value.group==='string')&&(value.pair===undefined||value.pair===null||typeof value.pair==='string')&&(value.assemblyEvidence===undefined||(record(value.assemblyEvidence)&&(value.assemblyEvidence.link===undefined||typeof value.assemblyEvidence.link==='string')));
}
function hardware(value:unknown):value is Hardware {return record(value)&&typeof value.name==='string'&&typeof value.color==='string'&&geometryLayout(value.geometry);}
function modelManifest(value:unknown):value is ModelManifest {
  return record(value)&&typeof value.source_sha256==='string'&&Array.isArray(value.parts)&&value.parts.every(modelPart)&&Array.isArray(value.hardware)&&value.hardware.every(hardware);
}
export function parseModelManifest(value:unknown):ModelManifest {if(!modelManifest(value))throw Error('Invalid model manifest');return value;}

function product(value:unknown):value is Product {
  return record(value)&&['id','name','hex','series','material'].every(key=>typeof value[key]==='string')&&['brand','brandId','role','preset','sourceUrl','finish'].every(key=>value[key]===undefined||typeof value[key]==='string')&&['colorCode','hardness','productUrl'].every(key=>value[key]===undefined||value[key]===null||typeof value[key]==='string')&&['demo','selectable'].every(key=>value[key]===undefined||typeof value[key]==='boolean')&&(value.diameter===undefined||typeof value.diameter==='string'||typeof value.diameter==='number')&&(value.alpha===undefined||typeof value.alpha==='number')&&(value.colors===undefined||(Array.isArray(value.colors)&&value.colors.every(item=>typeof item==='string')))&&(value.skus===undefined||(Array.isArray(value.skus)&&value.skus.every(item=>typeof item==='string')));
}
function catalog(value:unknown):value is Catalog {return record(value)&&Array.isArray(value.products)&&value.products.every(product)&&(value.version===undefined||typeof value.version==='string');}
export function parseCatalog(value:unknown):Catalog {if(!catalog(value))throw Error('Invalid model catalogue');return value;}

export function preparedMesh(value:unknown):value is PreparedMesh {return positionMetadata(value)&&record(value)&&value.positions instanceof Float32Array&&value.normals instanceof Float32Array&&value.indices instanceof Uint32Array;}

const finishNames:readonly string[]=FINISHES;
const finishValue=(value:unknown):value is Finish=>typeof value==='string'&&finishNames.includes(value);
export const wireNumber=(value:unknown):value is WireInteger=>typeof value==='number'||typeof value==='bigint';
export function designValue(value:unknown):value is Design {
  return record(value)&&stringRecord(value.colors)&&record(value.assignments)&&Object.values(value.assignments).every(item=>item===null||typeof item==='string')&&record(value.finishes)&&Object.values(value.finishes).every(finishValue);
}
export function parseDesign(value:unknown):Design {
  if(record(value)&&value.finishes===undefined)value.finishes={};
  if(!designValue(value))throw new TypeError('Invalid design response');return value;
}
export function publicAuthorValue(value:unknown):value is PublicAuthor {return record(value)&&['id','name','avatar','color'].every(key=>typeof value[key]==='string');}
export function userValue(value:unknown):value is User {return record(value)&&wireNumber(value.created)&&publicAuthorValue(value);}
export function parseUser(value:unknown):User {if(!userValue(value))throw new TypeError('Invalid user response');return value;}
export function schemeValue(value:unknown):value is Scheme {
  return record(value)&&typeof value.id==='string'&&typeof value.name==='string'&&designValue(value.design)&&wireNumber(value.voiceSalt)&&wireNumber(value.created)&&wireNumber(value.updated);
}
export function parseScheme(value:unknown):Scheme {if(!schemeValue(value))throw new TypeError('Invalid scheme response');return value;}
export function workValue(value:unknown):value is Work {
  return record(value)&&['id','title','description'].every(key=>typeof value[key]==='string')&&publicAuthorValue(value.author)&&designValue(value.design)&&(value.parentId===null||typeof value.parentId==='string')&&(value.schemeId===null||typeof value.schemeId==='string')&&wireNumber(value.created)&&record(value.rating)&&typeof value.rating.average==='number'&&typeof value.rating.count==='number'&&typeof value.rating.mine==='number';
}
export function parseWork(value:unknown):Work {if(!workValue(value))throw new TypeError('Invalid work response');return value;}
function displayScalar(value:unknown):MessageScalar {return value===null||value===undefined||typeof value==='string'||typeof value==='number'||typeof value==='bigint'||typeof value==='boolean'?value:String(value);}
/** Preserve raw provenance in DTOs; this projection is only for existing display fields. */
export function provenanceFields(value:unknown):{title:MessageScalar;author:MessageScalar;workId:MessageScalar} {
  const fields=record(value)?value:{};return {title:displayScalar(fields.title),author:displayScalar(fields.author),workId:displayScalar(fields.workId)};
}
function validationValue(value:unknown):value is ManufacturingValidation {
  return record(value)&&value.status==='passed'&&typeof value.source_sha256==='string'&&typeof value.geometryEntriesByteIdentical==='number'&&value.plateCount===6&&value.objectCount===25&&value.partCount===35&&value.nonMaterialObjectMetadataUnchanged===true&&Array.isArray(value.changedConfigurationKeys)&&value.changedConfigurationKeys.every(key=>typeof key==='string')&&value.sliced===false&&value.physicalPrintVerified===false;
}
type PlanSlot=ExportPlan['slots'][number];
type PlanPart=ExportPlan['parts'][number];
function planSlot(value:unknown):value is PlanSlot {
  return record(value)&&typeof value.slot==='number'&&typeof value.sourceTemplateSlot==='number'&&product(value.product)&&typeof value.used==='boolean'&&record(value.profile)&&typeof value.profile.status==='string'&&typeof value.profile.name==='string';
}
function planPart(value:unknown):value is PlanPart {
  return record(value)&&['id','uuid','name','originalName'].every(key=>typeof value[key]==='string')&&['plate','objectId','partId','slot'].every(key=>typeof value[key]==='number')&&product(value.product);
}
function exportPlanValue(value:unknown):value is ExportPlan {
  return record(value)&&value.schema==='duck-studio-materials/2'&&['name','createdAt','source_sha256','sourceFile','sourceBambuVersion'].every(key=>typeof value[key]==='string')&&record(value.catalogue)&&value.plateCount===6&&value.objectCount===25&&value.partCount===35&&Array.isArray(value.slots)&&value.slots.every(planSlot)&&Array.isArray(value.parts)&&value.parts.every(planPart)&&numberArray(value.mixedColorPlates)&&Array.isArray(value.warnings)&&value.warnings.every(item=>typeof item==='string')&&(value.previewNote===undefined||typeof value.previewNote==='string')&&(value.preservationNote===undefined||typeof value.preservationNote==='string')&&(value.validation===undefined||validationValue(value.validation));
}
export function parseExportPlan(value:unknown):ExportPlan {if(!exportPlanValue(value))throw new TypeError('Invalid export plan response');return value;}
