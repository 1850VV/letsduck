import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { catalogSchema, designSchema, errorSchema } from '@letsduck/contracts';
import { validateDesign } from '@letsduck/domain';

const createApp = () => Fastify({ ajv: { customOptions: { coerceTypes: false, removeAdditional: false, useDefaults: false } } });

test('catalogue metadata retains explicit nulls and additional source fields', async () => {
  const app = createApp();
  const catalog = { version: 'synthetic', products: [{ id: 'p', series: 'PLA', material: 'PLA', hex: '#123456', colorCode: null, productUrl: null, hardness: null, extraIdentity: 'retained' }], extension: { checkedAt: 'synthetic' } };
  app.post('/catalog', { schema: { body: catalogSchema } }, async request => request.body);
  try {
    const result = await app.inject({ method: 'POST', url: '/catalog', payload: catalog });
    assert.equal(result.statusCode, 200, result.body);
    assert.deepEqual(result.json(), catalog);
  } finally { await app.close(); }
});

test('normalized design schema preserves Unicode length and never coerces invalid values', async () => {
  const app = createApp();
  app.post('/design', { schema: { body: designSchema } }, async request => request.body);
  try {
    const design = validateDesign({ colors: { p: '#aAbB11' }, assignments: { p: '🦆'.repeat(80) } }, ['p']);
    const valid = await app.inject({ method: 'POST', url: '/design', payload: design });
    assert.equal(valid.statusCode, 200, valid.body);
    assert.deepEqual(valid.json(), design);
    const invalid = await app.inject({ method: 'POST', url: '/design', payload: { ...design, assignments: { p: 123 } } });
    assert.equal(invalid.statusCode, 400);
  } finally { await app.close(); }
});

test('the error response schema retains adapter details during actual serialization', async () => {
  const app = createApp();
  const error = { error: 'offline', code: 'device.offline', params: { v0: 'board' }, details: { connected: false } };
  app.get('/error', { schema: { response: { 422: errorSchema } } }, async (_request, reply) => reply.code(422).send(error));
  try {
    const result = await app.inject('/error');
    assert.equal(result.statusCode, 422);
    assert.deepEqual(result.json(), error);
  } finally { await app.close(); }
});
