import { expect, it } from 'vite-plus/test';
import type { JsonSchema } from '@jsonforms/core';
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
    expect(scalarAllOfSchema(schema, {})).toBeUndefined();
});

it('projects compatible temporal bounds as one editor without changing the composed validator schema', () => {
  const schema = {
    allOf: [
      { type: 'string', format: 'date' },
      { type: 'string', format: 'date', formatMinimum: '2026-10-10' },
    ],
  };
  expect(scalarAllOfSchema(schema, {})).toEqual({
    type: 'string',
    format: 'date',
    formatMinimum: '2026-10-10',
  });
  expect(schema.allOf).toHaveLength(2);
  expect(
    scalarAllOfSchema({ ...schema, definitions: { __jsonforms_root: { type: 'object' } } }, {}),
  ).toEqual({
    type: 'string',
    format: 'date',
    formatMinimum: '2026-10-10',
    definitions: { __jsonforms_root: { type: 'object' } },
  });
  expect(
    scalarAllOfSchema(
      {
        allOf: [
          { type: 'string', format: 'date' },
          { type: 'string', format: 'time' },
        ],
      },
      {},
    ),
  ).toBeUndefined();
  expect(
    scalarAllOfSchema(
      {
        allOf: [
          { type: 'string', format: 'date', formatMinimum: '2026-10-10' },
          { type: 'string', format: 'date', formatMinimum: '2026-10-12' },
        ],
      } as unknown as JsonSchema,
      {},
    ),
  ).toBeUndefined();
});

it('stops on recursive references and leaves dialect-dependent ref siblings alone', () => {
  const root = { definitions: { loop: { $ref: '#/definitions/loop' } } };
  expect(scalarAllOfSchema({ allOf: [{ $ref: '#/definitions/loop' }] }, root)).toBeUndefined();
  expect(scalarAllOfSchema({ $ref: '#/definitions/loop', title: 'Loop' }, root)).toBeUndefined();
});
