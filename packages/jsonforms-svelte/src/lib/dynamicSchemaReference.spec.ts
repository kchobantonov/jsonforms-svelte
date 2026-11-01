import type { JsonSchema } from '@jsonforms/core';
import { expect, it } from 'vite-plus/test';
import { dynamicSchemaReference } from './dynamicSchemaReference';

it('finds a dynamic reference in a nested schema-valued keyword', () => {
  const schema = {
    $defs: {
      Node: {
        type: 'object',
        properties: { child: { $dynamicRef: '#node' } },
      },
    },
  } as JsonSchema;
  expect(dynamicSchemaReference(schema)).toBe('#node');
});

it('does not treat data literals or an unused dynamic anchor as a dynamic reference', () => {
  const schema = {
    $dynamicAnchor: 'node',
    const: { $dynamicRef: '#literal' },
    properties: { name: { type: 'string' } },
  } as JsonSchema;
  expect(dynamicSchemaReference(schema)).toBeUndefined();
});
