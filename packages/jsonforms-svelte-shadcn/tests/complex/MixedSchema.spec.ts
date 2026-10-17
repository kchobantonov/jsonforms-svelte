import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import type { JsonSchema, JsonSchema7 } from '@jsonforms/core';
import {
  createMixedRenderInfos,
  findPropertySchema,
  getArrayItemSchema,
} from '../../src/lib/complex/util/schemaUtils';

const infos = (schema: JsonSchema) =>
  createMixedRenderInfos(schema, schema, schema, { type: 'Control', scope: '#' }, '', []);
const ajv = new Ajv({ strict: false });
describe('mixed delegated schemas', () => {
  it('preserves numeric constraints and exclusive composition matches', () => {
    const schema: JsonSchema7 = {
      type: ['string', 'number'],
      minimum: 5,
      oneOf: [{ type: 'string', minLength: 3 }, { type: 'number' }],
    };
    const snapshot = structuredClone(schema);
    for (const info of infos(schema)) {
      const expected = ajv.compile({ allOf: [schema, { type: info.label }] });
      const actual = ajv.compile(info.schema);
      for (const value of [null, 0, 5, 7.5, '', 'a', 'abcd', {}, []])
        expect(actual(value)).toBe(expected(value));
    }
    expect(schema).toEqual(snapshot);
  });
  it('retains forbidden and unrestricted item schemas without mutating them', () => {
    for (const items of [false, true, {}, { type: 'integer', minimum: 3 }]) {
      const schema = { type: ['array', 'null'], items } as JsonSchema;
      const snapshot = structuredClone(schema);
      const array = infos(schema).find((info) => info.label === 'array')!;
      expect(array.schema.items).toEqual(items);
      expect(schema).toEqual(snapshot);
    }
  });
  it('keeps impossible enum/type combinations impossible', () => {
    const schema: JsonSchema7 = { type: ['string', 'number'], enum: ['only'] };
    const number = infos(schema).find((info) => info.label === 'number')!;
    expect(ajv.compile(number.schema)(1)).toBe(false);
  });
  it('resolves literal property names when delegating object schemas', () => {
    const schema: JsonSchema7 = {
      type: ['object', 'null'],
      properties: { value: { type: 'string' } },
    };
    const parent: JsonSchema = { type: 'object', properties: { 'a.b/c~d': schema } };
    const result = createMixedRenderInfos(
      parent,
      schema,
      parent,
      { type: 'Control', scope: '#/properties/a.b~1c~0d' },
      '',
      [],
    );
    const object = result.find((info) => info.label === 'object')!;
    expect(object.schema.type).toBe('object');
    expect(object.schema.properties?.value.type).toBe('string');
    expect(object.uischema).toEqual({ type: 'Control', scope: '#' });
    expect(parent.properties!['a.b/c~d'].type).toEqual(['object', 'null']);
  });
});

describe('mixed child constraints', () => {
  it('intersects declared properties with every matching pattern', () => {
    const parent: JsonSchema = {
      properties: { code: { type: 'string' } },
      patternProperties: { '^co': { minLength: 3 }, de$: { pattern: '^A' } },
      additionalProperties: false,
    };
    const child = findPropertySchema(parent, 'code', parent)!;
    const validate = ajv.compile(child);
    expect(validate('Abc')).toBe(true);
    expect(validate('A')).toBe(false);
    expect(validate('Bcd')).toBe(false);
    expect(validate(123)).toBe(false);
    expect(ajv.compile(findPropertySchema(parent, 'other', parent)!)(null)).toBe(false);
  });
  it('retains boolean items and forbidden tuple tails', () => {
    const forbidden = { type: 'array', items: false } as unknown as JsonSchema;
    expect(ajv.compile(getArrayItemSchema(forbidden, 0, forbidden)!)(1)).toBe(false);
    const tuple: JsonSchema = {
      type: 'array',
      items: [{ type: 'string' }],
      additionalItems: false,
    };
    expect(ajv.compile(getArrayItemSchema(tuple, 1, tuple)!)(1)).toBe(false);
    expect(ajv.compile(getArrayItemSchema(tuple, 0, tuple)!)('a')).toBe(true);
  });
});

it('retains integer defaults in the number editor', () => {
  const result = infos({ type: ['number', 'string'], default: 12 });
  expect(result.find((info) => info.label === 'number')?.resolvedSchema.default).toBe(12);
  expect(result.find((info) => info.label === 'string')?.resolvedSchema.default).toBeUndefined();
});

it('retains child constraints contributed by referenced allOf clauses', () => {
  const parent: JsonSchema = {
    definitions: { constraints: { properties: { code: { minLength: 3 } }, items: { minimum: 3 } } },
    properties: { code: { type: 'string' } },
    items: { type: 'integer' },
    allOf: [{ $ref: '#/definitions/constraints' }],
  };
  const property = ajv.compile(findPropertySchema(parent, 'code', parent)!);
  expect(property('abc')).toBe(true);
  expect(property('a')).toBe(false);
  expect(property(123)).toBe(false);
  const item = ajv.compile(getArrayItemSchema(parent, 0, parent)!);
  expect(item(3)).toBe(true);
  expect(item(1)).toBe(false);
  expect(item(3.5)).toBe(false);
});
