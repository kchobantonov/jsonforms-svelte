import type { ControlElement, JsonSchema } from '@jsonforms/core';
import { expect, it } from 'vite-plus/test';
import { createMixedRenderInfos } from '../../src/lib/complex/util/schemaUtils';

it('selects each type-specific detail before the general mixed detail', () => {
  const types = ['string', 'number', 'integer', 'boolean', 'null', 'object', 'array'] as const;
  const schema = {
    type: [...types],
    properties: { name: { type: 'string' } },
    items: { type: 'string' },
  } as JsonSchema;
  const control = {
    type: 'Control',
    scope: '#',
    options: {
      detail: { type: 'Label', text: 'General detail' },
      ...Object.fromEntries(types.map((type) => [`${type}-detail`, { type: 'Label', text: type }])),
    },
  } as ControlElement;
  const infos = createMixedRenderInfos(schema, schema, schema, control, '', []);
  expect(infos.map(({ resolvedSchema, uischema }) => [resolvedSchema.type, uischema])).toEqual(
    types.map((type) => [type, { type: 'Label', text: type }]),
  );
});
