import { expect, it } from 'vitest';
import { entry } from '../../src/lib/complex/ObjectRenderer.entry';
import type { JsonSchema } from '@jsonforms/core';

it('selects conditional object projection over allOf only when opted in', () => {
  const schema = {
    type: 'object',
    allOf: [{ if: { required: ['kind'] }, then: { properties: { value: { type: 'string' } } } }],
  } as JsonSchema;
  const ui = { type: 'Control', scope: '#' };
  const context = {
    rootSchema: schema,
    config: { jsonformsExtended: { conditionalFields: true } },
  };
  expect(entry.tester(ui, schema, context)).toBe(25);
  expect(entry.tester({ ...ui, options: { conditionalFields: false } }, schema, context)).toBe(2);
});
