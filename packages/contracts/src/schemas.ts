import type { FromSchema } from 'json-schema-to-ts';

export const errorSchema = { type: 'object', required: ['error', 'code', 'params'], properties: { error: { type: 'string' }, code: { type: 'string' }, params: { type: 'object', additionalProperties: true } }, additionalProperties: true } as const;
export const siteSchema = { oneOf: [
  { type: 'object', required: ['publicUrl', 'edition', 'assembly', 'servoSetup', 'servoPreparation'], properties: { publicUrl: { type: 'string' }, edition: { const: 'personal' }, assembly: { type: 'boolean' }, servoSetup: { type: 'boolean' }, servoPreparation: { type: 'boolean' } }, additionalProperties: false },
  { type: 'object', required: ['publicUrl', 'edition'], properties: { publicUrl: { type: 'string' }, edition: { const: 'server' } }, additionalProperties: false },
] } as const;
export const designSchema = { type: 'object', required: ['colors', 'assignments', 'finishes'], properties: {
  colors: { type: 'object', additionalProperties: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' } },
  assignments: { type: 'object', additionalProperties: { type: ['string', 'null'], maxLength: 80 } },
  finishes: { type: 'object', additionalProperties: { enum: ['basic', 'matte', 'silk', 'translucent', 'tpu'] } },
}, additionalProperties: false } as const;
// The HTTP adapter passes input to domain validation so legacy coercions and error codes survive.
export const schemeInputSchema = { type: 'object', properties: { name: {}, design: {}, provenance: {}, voiceSalt: {} }, additionalProperties: true } as const;
export const productSchema = { type: 'object', required: ['id', 'series', 'material'], properties: {
  id: { type: 'string' }, series: { type: 'string' }, material: { type: 'string' }, name: { type: 'string' }, brand: { type: 'string' }, brandId: { type: 'string' },
  hex: { type: ['string', 'null'] }, hardness: { type: ['string', 'null'] }, demo: { type: 'boolean' }, selectable: { type: 'boolean' }, role: { type: 'string' },
  colors: { type: 'array', items: { type: 'string' } }, skus: { type: 'array', items: { type: 'string' } }, colorCode: { type: ['string', 'null'] }, diameter: { anyOf: [{ type: 'number' }, { type: 'string' }] },
  preset: { type: 'string' }, productUrl: { type: ['string', 'null'] }, sourceUrl: { type: 'string' },
}, additionalProperties: true } as const;
export const catalogSchema = { type: 'object', required: ['products'], properties: { products: { type: 'array', items: productSchema }, version: { type: 'string' } }, additionalProperties: true } as const;
export const profileSchema = { type: 'object', required: ['name', 'settings'], properties: { name: { type: 'string' }, compatibleP1P: { type: 'boolean' }, sourceUrl: { type: 'string' }, settings: { type: 'object', properties: { filament_type: { type: 'array', items: { type: 'string' } } }, additionalProperties: true } }, additionalProperties: true } as const;
export const profileDataSchema = { type: 'object', properties: { profiles: { type: 'object', additionalProperties: profileSchema } }, additionalProperties: true } as const;

export type ApiError = FromSchema<typeof errorSchema>;
export type SiteConfig = FromSchema<typeof siteSchema>;
export type Design = FromSchema<typeof designSchema>;
export type Finish = Design['finishes'][string];
export type SchemeInput = FromSchema<typeof schemeInputSchema>;
export type FilamentProduct = FromSchema<typeof productSchema>;
export type FilamentCatalog = FromSchema<typeof catalogSchema>;
export type FilamentProfile = FromSchema<typeof profileSchema>;
export type ProfileData = FromSchema<typeof profileDataSchema>;
