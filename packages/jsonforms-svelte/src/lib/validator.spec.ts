import { expect, it } from 'vitest';
import { createRendererAjv } from './validator';

it('compiles anonymous recursive roots without changing schema identity or keeping a root registration', () => {
  const ajv = createRendererAjv();
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      children: { type: 'array', items: { $ref: '#' } },
    },
    required: ['name'],
  };
  const validate = ajv.compile(schema);
  expect(validate.schema).toBe(schema);
  expect(ajv.compile(schema)).toBe(validate);
  expect(ajv.getSchema('')).toBeUndefined();
  expect(validate({ name: 'root', children: [{ name: 'child' }] })).toBe(true);
  expect(validate({ name: 'root', children: [{ name: 2 }] })).toBe(false);
  expect(validate.errors?.[0].instancePath).toBe('/children/0/name');
  const other = ajv.compile({
    type: 'array',
    items: { anyOf: [{ type: 'number' }, { $ref: '#' }] },
  });
  expect(other([1, [2, [3]]])).toBe(true);
  expect(other([1, ['invalid']])).toBe(false);
  expect(validate({ name: 'root', children: [{ name: 'child' }] })).toBe(true);
  expect(ajv.getSchema('')).toBeUndefined();
  expect(Object.hasOwn(schema, '$id')).toBe(false);
});

it('retains host formats, external registrations and compilation options', () => {
  const ajv = createRendererAjv({ useDefaults: true });
  ajv.addFormat('code', /^[A-Z]+$/);
  ajv.addSchema({ $id: 'urn:test:code', type: 'string', format: 'code' });
  const validate = ajv.compile({
    type: 'object',
    properties: {
      code: { $ref: 'urn:test:code' },
      count: { type: 'number', default: 1 },
    },
  });
  const data = { code: 'ABC' };
  expect(validate(data)).toBe(true);
  expect(data).toEqual({ code: 'ABC', count: 1 });
  expect(validate({ code: 'abc' })).toBe(false);
  expect(ajv.getSchema('urn:test:code')).toBeDefined();
  expect(() =>
    ajv.compile({ type: 'object', properties: { bad: { $ref: 'urn:missing' } } }),
  ).toThrow();
  expect(ajv.getSchema('')).toBeUndefined();
});

it('releases the anonymous compile cache when the host removes a schema', () => {
  const ajv = createRendererAjv();
  const schema = { type: 'string' };
  const first = ajv.compile(schema);
  ajv.removeSchema(schema);
  expect(ajv.compile(schema)).not.toBe(first);
  const second = ajv.compile(schema);
  ajv.removeSchema();
  expect(ajv.compile(schema)).not.toBe(second);
});
