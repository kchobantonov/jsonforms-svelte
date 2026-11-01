import { describe, expect, it } from 'vite-plus/test';
import { additionalPropertySchema } from './additionalPropertySchema';
import type { JsonSchema, JsonSchema7 } from '@jsonforms/core';

describe('dynamic property schema selection', () => {
  it('normalizes boolean value schemas before an Add command uses them', () => {
    const open: JsonSchema = { additionalProperties: true };
    const closed: JsonSchema = { additionalProperties: false };
    expect(additionalPropertySchema('new', open, open)).toEqual({ additionalProperties: true });
    expect(additionalPropertySchema('new', closed, closed)).toEqual({ not: {} });
    const patterned = {
      patternProperties: { '^sensor-': true },
      additionalProperties: false,
    } as unknown as JsonSchema; // JSON Forms' JsonSchema type omits boolean subschemas.
    expect(additionalPropertySchema('sensor-a', patterned, patterned)).toEqual({});
  });
  it('normalizes boolean value schemas reached through local references', () => {
    const schema = {
      definitions: { open: true, closed: false },
      patternProperties: {
        '^open-': { $ref: '#/definitions/open' },
        '^closed-': { $ref: '#/definitions/closed' },
      },
      additionalProperties: false,
    } as unknown as JsonSchema;
    expect(additionalPropertySchema('open-a', schema, schema)).toEqual({});
    expect(additionalPropertySchema('closed-a', schema, schema)).toEqual({ not: {} });
  });
  it('collects every match and takes the strongest compatible bounds regardless of order', () => {
    const entries: [string, JsonSchema7][] = [
      ['^price_', { type: 'number', minimum: 0, maximum: 2000 }],
      ['_total$', { minimum: 10, maximum: 1000 }],
    ];
    for (const pairs of [entries, [...entries].reverse()]) {
      const schema: JsonSchema = {
        patternProperties: Object.fromEntries(pairs),
        additionalProperties: true,
      };
      expect(additionalPropertySchema('price_total', schema, schema)).toEqual({
        type: 'number',
        minimum: 10,
        maximum: 1000,
      });
    }
  });
  it('uses fallback only without matches, including an empty regex', () => {
    const schema: JsonSchema = {
      patternProperties: { '^price_': { type: 'number' } },
      additionalProperties: { type: 'string' },
    };
    expect(additionalPropertySchema('note', schema, schema)).toEqual({ type: 'string' });
    expect(additionalPropertySchema('price_unit', schema, schema)).toEqual({ type: 'number' });
    schema.patternProperties![''] = { maximum: 10 };
    expect(additionalPropertySchema('price_unit', schema, schema)).toEqual({
      type: 'number',
      maximum: 10,
    });
  });
  it('resolves referenced matching schemas without modifying the root', () => {
    const schema: JsonSchema = {
      definitions: { amount: { type: 'number', minimum: 0 } },
      patternProperties: {
        '^price_': { $ref: '#/definitions/amount' },
        _total$: { maximum: 1000 },
      },
    };
    const before = JSON.stringify(schema);
    expect(additionalPropertySchema('price_total', schema, schema)).toEqual({
      type: 'number',
      minimum: 0,
      maximum: 1000,
    });
    expect(JSON.stringify(schema)).toBe(before);
  });
  it.each([
    [{ type: 'string' }, { type: 'number' }],
    [{ type: 'object', properties: { x: { type: 'number' } } }, { additionalProperties: false }],
    [{ type: 'string', pattern: '^a' }, { pattern: 'z$' }],
  ])('retains conflicting or structural schemas conjunctively', (first, second) => {
    const schema: JsonSchema = { patternProperties: { '^': first, $: second } };
    const result = additionalPropertySchema('key', schema, schema);
    expect(result.allOf).toHaveLength(2);
    expect(result.allOf).toEqual(expect.arrayContaining([first, second]));
    expect(result.type).toBeUndefined();
  });
  it('intersects number and integer', () => {
    const schema: JsonSchema = {
      patternProperties: { '^': { type: 'number' }, $: { type: 'integer' } },
    };
    expect(additionalPropertySchema('key', schema, schema)).toEqual({ type: 'integer' });
  });
});
