import { expect, it } from 'vitest';
import { scalarAllOfSchema } from './scalarAllOf';

it('projects nested scalar references and annotations without changing the original schema', () => {
  const root = { definitions: { count: { type: 'integer', minimum: 0 } } };
  const schema = {
    allOf: [{ allOf: [{ $ref: '#/definitions/count' }, { default: 0 }] }],
    description: 'Count',
  };
  const before = JSON.stringify(schema);
  expect(scalarAllOfSchema(schema, root)).toEqual({
    type: 'integer',
    minimum: 0,
    default: 0,
    description: 'Count',
  });
  expect(JSON.stringify(schema)).toBe(before);
});

it('does not merge independent validation branches or alternatives', () => {
  for (const schema of [
    { allOf: [{ type: 'integer' }, { minimum: 0 }] },
    { allOf: [{ type: 'object', properties: { a: { type: 'string' } } }, { default: {} }] },
    { allOf: [{ type: 'string', oneOf: [{ const: 'a' }, { const: 'b' }] }, { default: 'a' }] },
    { allOf: [{ type: 'string', anyOf: [{ minLength: 2 }, { pattern: 'a' }] }, { default: 'a' }] },
    { allOf: [{ default: 0 }] },
    { allOf: [{ type: 'integer', default: 1 }, { default: 0 }] },
  ])
    expect(scalarAllOfSchema(schema as any, {})).toBeUndefined();
});

it('stops on recursive references and leaves dialect-dependent ref siblings alone', () => {
  const root = { definitions: { loop: { $ref: '#/definitions/loop' } } };
  expect(scalarAllOfSchema({ allOf: [{ $ref: '#/definitions/loop' }] }, root)).toBeUndefined();
  expect(scalarAllOfSchema({ $ref: '#/definitions/loop', title: 'Loop' }, root)).toBeUndefined();
});
