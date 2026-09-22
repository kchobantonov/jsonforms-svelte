import { describe, expect, it } from 'vitest';
import { tupleDefinition, tupleTester, tupleInitialValue, tupleEmptyValue } from './tuple';
import type { JsonSchema, ControlElement } from '@jsonforms/core';
describe('tuple schemas and initialization', () => {
  it('selects positional drafts automatically but requires a variant for uniform arrays', () => {
    const ui: ControlElement = { type: 'Control', scope: '#' };
    const positional = { type: 'array', items: [{ type: 'string' }] } as JsonSchema;
    expect(tupleTester(ui, positional, { rootSchema: positional, config: {} })).toBe(25);
    const uniform = {
      type: 'array',
      items: { type: 'number' },
      minItems: 2,
      maxItems: 2,
    } as JsonSchema;
    expect(tupleTester(ui, uniform, { rootSchema: uniform, config: {} })).toBe(-1);
    expect(
      tupleTester({ ...ui, options: { variant: 'tuple' } }, uniform, {
        rootSchema: uniform,
        config: {},
      }),
    ).toBe(25);
  });
  it('resolves a scoped reference against the original root schema', () => {
    const root = {
      type: 'object',
      definitions: { pair: { type: 'array', items: [{ type: 'number' }, { type: 'number' }] } },
      properties: { coordinates: { $ref: '#/definitions/pair' } },
    } as JsonSchema;
    expect(
      tupleTester({ type: 'Control', scope: '#/properties/coordinates' }, root, {
        rootSchema: root,
        config: {},
      }),
    ).toBe(25);
  });
  it('uses prefixItems with items as the tail in 2020-12', () => {
    expect(
      tupleDefinition({
        type: 'array',
        prefixItems: [{ type: 'string' }],
        items: false,
      } as unknown as JsonSchema),
    ).toEqual({ prefix: [{ type: 'string' }], tail: false });
  });
  it('rejects invalid uniform lengths and supports an empty fixed tuple', () => {
    expect(
      tupleDefinition({ type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 }, true),
    ).toBeUndefined();
    expect(
      tupleDefinition({ type: 'array', items: { type: 'string' }, minItems: 0, maxItems: 0 }, true)
        ?.prefix,
    ).toEqual([]);
  });
  it('clones defaults and leaves ambiguous schemas uninitialized', () => {
    const schema = { type: 'object', default: { tags: ['a'] } } as JsonSchema;
    const value = tupleInitialValue(schema, schema) as { tags: string[] };
    value.tags.push('b');
    expect(schema.default).toEqual({ tags: ['a'] });
    expect(tupleInitialValue(true, {})).toBeUndefined();
    expect(tupleInitialValue({ type: ['string', 'number'] }, {})).toBeUndefined();
    expect(
      tupleInitialValue(
        { type: 'object', properties: { city: { type: 'string', default: 'Sofia' } } },
        {},
      ),
    ).toEqual({ city: 'Sofia' });
  });
  it('distinguishes initialization from clearing numeric values', () => {
    expect(tupleInitialValue({ type: 'number' }, {})).toBe(0);
    expect(tupleEmptyValue({ type: 'number' }, {})).toBeUndefined();
    expect(tupleEmptyValue({ type: 'string' }, {})).toBe('');
    expect(tupleEmptyValue({ type: ['number', 'null'] }, {})).toBeNull();
  });
});
