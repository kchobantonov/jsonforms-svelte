import { describe, expect, it } from 'vitest';
import { Generate } from '@jsonforms/core';
import { inferJsonSchema, generateRootUISchema } from './inference';

describe('root schema inference', () => {
  it('keeps absent data unrestricted instead of inventing object data', () => {
    expect(inferJsonSchema(undefined)).toEqual({});
  });
  it.each([
    [null, 'null'],
    [true, 'boolean'],
    [false, 'boolean'],
    ['', 'string'],
    ['text', 'string'],
    [0, 'integer'],
    [1.5, 'number'],
    [[], 'array'],
    [[1, 'two', false, null], 'array'],
  ])('infers %j as %s', (data, type) => {
    expect(inferJsonSchema(data).type).toBe(type);
  });
  it('retains upstream object inference and does not modify the sample', () => {
    const data = { name: 'Sample', active: false, nested: { count: 0 } };
    const before = structuredClone(data);
    expect(inferJsonSchema(data)).toEqual(Generate.jsonSchema(data));
    expect(data).toEqual(before);
  });
});

it('dispatches unrestricted root schemas when the core generator returns no layout', () => {
  expect(generateRootUISchema({})).toEqual({ type: 'Control', scope: '#' });
});

it.each([true, false])('generates a root control for boolean schema %s', (schema) => {
  expect(generateRootUISchema(schema)).toEqual({ type: 'Control', scope: '#' });
});
