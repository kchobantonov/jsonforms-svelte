import { expect, it } from 'vite-plus/test';
import type { JsonSchema } from '@jsonforms/core';
import { schemaAtDataPath } from '../../../src/lib/compositeActions.svelte';

it('resolves prototype-looking dynamic property names through own schema members', () => {
  const dynamic: JsonSchema = { type: 'object', minProperties: 2 };
  const declared: JsonSchema = { type: 'object', minProperties: 1 };
  const root = {
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        items: {
          type: 'object',
          properties: { constructor: declared },
          additionalProperties: dynamic,
        },
      },
    },
  } as JsonSchema;
  expect(schemaAtDataPath(root, ['rows', '0', 'constructor'])).toBe(declared);
  expect(schemaAtDataPath(root, ['rows', '0', '__proto__'])).toBe(dynamic);
  expect(schemaAtDataPath(root, ['rows', '0', 'toString'])).toBe(dynamic);
});
