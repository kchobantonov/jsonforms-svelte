import { describe, expect, it } from 'vitest';
import type { JsonSchema } from '@jsonforms/core';
import { resolveScopeSchema, scopeDataSegments } from './schemaScope';

describe('literal schema scopes', () => {
  it('decodes pointers once and skips structural composition segments', () => {
    expect(scopeDataSegments('#/properties/a~01~0~1/properties/')).toEqual(['a~1~/', '']);
    expect(scopeDataSegments('#/oneOf/1/properties/then/then/properties/#')).toEqual(['then', '#']);
    expect(scopeDataSegments('#')).toEqual([]);
  });

  it('follows recursive references for a finite property path', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { next: { $ref: '#' }, image: { type: 'string' } },
    };
    expect(
      resolveScopeSchema(schema, '#/properties/next/properties/next/properties/image', schema),
    ).toEqual({ type: 'string' });
  });

  it('terminates reference-only cycles and unresolved paths', () => {
    const schema = { definitions: { loop: { $ref: '#/definitions/loop' } } };
    expect(
      resolveScopeSchema(schema, '#/definitions/loop/properties/missing', schema),
    ).toBeUndefined();
  });

  it('does not traverse inherited schema properties', () => {
    const schema = { properties: Object.create({ image: { type: 'string' } }) };
    expect(resolveScopeSchema(schema, '#/properties/image', schema)).toBeUndefined();
  });

  it('resolves escaped reference targets and preserves false fallback results', () => {
    const schema = {
      definitions: { 'a~b~c': false },
      anyOf: [
        { properties: { image: { $ref: '#/definitions/a~0b~0c' } } },
        { properties: { image: true } },
      ],
    } as unknown as JsonSchema;
    expect(resolveScopeSchema(schema, '#/properties/image', schema)).toBe(false);
  });
});
