import { describe, expect, it } from 'vite-plus/test';
import type { JsonSchema } from '@jsonforms/core';
import { isMixedSchema, resolveMixedStructuredLayout } from './mixedSchema';
const test = (schema: JsonSchema, scope = '#') =>
  isMixedSchema({ type: 'Control', scope }, schema, { rootSchema: schema, config: {} });
describe('mixed schema selection', () => {
  it.each([
    {},
    { title: 'Value', default: 0 },
    { title: 'Value', i18n: 'value' },
    { type: ['string', 'number'] },
    { type: ['string', 'number'], enum: ['a', 1] },
    { type: ['string', 'number'], oneOf: [{ const: 'a' }, { const: 1 }] },
  ])('accepts %j', (schema) => expect(test(schema)).toBe(true));
  it.each([
    { type: 'string' },
    { type: ['null'] },
    { type: ['string'] },
    { enum: ['a', 1] },
    { const: null },
    { oneOf: [{}] },
    { anyOf: [{}] },
    { allOf: [{}] },
    { properties: {} },
    { additionalProperties: true },
    { minimum: 0 },
    { format: 'date' },
    { not: {} },
  ])('leaves specialized or constrained schemas alone: %j', (schema) =>
    expect(test(schema)).toBe(false),
  );
  it('resolves properties and references before testing', () => {
    const schema: JsonSchema = {
      definitions: { value: {} },
      properties: { value: { $ref: '#/definitions/value' }, restricted: { enum: [1, 2] } },
    };
    expect(test(schema, '#/properties/value')).toBe(true);
    expect(test(schema, '#/properties/restricted')).toBe(false);
    expect(test(schema, '#/properties/missing')).toBe(false);
  });
  it('accepts true and rejects false schemas', () => {
    expect(test(true as unknown as JsonSchema)).toBe(true);
    expect(test(false as unknown as JsonSchema)).toBe(false);
  });
});

it('resolves mixed presentation from local options before component defaults', () => {
  const config = { jsonformsExtended: { mixed: { structuredLayout: 'code' } } };
  expect(resolveMixedStructuredLayout(undefined, config)).toBe('code');
  expect(resolveMixedStructuredLayout({ structuredLayout: 'nested' }, config)).toBe('nested');
  expect(resolveMixedStructuredLayout({ structuredLayout: 'tree' }, config)).toBe('tree');
  expect(resolveMixedStructuredLayout(undefined, { structuredLayout: 'code' })).toBe('tree');
});
