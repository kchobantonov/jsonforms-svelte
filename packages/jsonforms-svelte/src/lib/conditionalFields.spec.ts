import { createAjv, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { expect, it, vi } from 'vitest';
import {
  conditionalFieldsEnabled,
  conditionalLayout,
  projectConditionalFields,
} from './conditionalFields';

const schema = {
  type: 'object',
  properties: { kind: { type: 'string' }, name: { type: 'string', minLength: 2 } },
  if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
  then: { properties: { vat: { type: 'string' }, name: { maxLength: 10 } }, required: ['vat'] },
  else: { properties: { nickname: { type: 'string' } } },
  dependencies: { card: { properties: { billing: { type: 'string' } } }, name: ['kind'] },
} as JsonSchema;

it('projects conditions and presence dependencies without changing the schema or data', () => {
  const data = { kind: 'business', card: false, name: 'Ada', nickname: 'retained' };
  const before = JSON.stringify({ schema, data });
  const result = projectConditionalFields(schema, schema, data, createAjv());
  expect(Object.keys(result.schema.properties!)).toEqual(['kind', 'name', 'vat', 'billing']);
  expect(result.schema.required).toEqual(['vat', 'kind']);
  expect(result.schema.properties?.name.allOf).toHaveLength(2);
  expect(result.known.has('nickname')).toBe(true);
  expect(JSON.stringify({ schema, data })).toBe(before);
});

it('retains authored positions and base fields while omitting inactive bindings', () => {
  const result = projectConditionalFields(schema, schema, {}, createAjv());
  const layout = {
    type: 'Group',
    elements: ['vat', 'name', 'nickname'].map((name) => ({
      type: 'Control',
      scope: `#/properties/${name}`,
    })),
  };
  expect(conditionalLayout(layout, result.schema, result.known)).toEqual({
    type: 'Group',
    elements: layout.elements.slice(1),
  });
});

it('does not select else when compilation fails and reuses successful validators', () => {
  const ajv = createAjv();
  const compile = vi.spyOn(ajv, 'compile');
  projectConditionalFields(schema, schema, {}, ajv);
  projectConditionalFields(schema, schema, { kind: 'business' }, ajv);
  expect(compile).toHaveBeenCalledTimes(1);
  const broken = { ...schema, if: { $ref: '#/definitions/missing' } };
  const result = projectConditionalFields(broken, broken, {}, ajv);
  expect(result.diagnostics).toEqual(['conditional.evaluationFailed']);
  expect(Object.keys(result.schema.properties!)).toEqual(['kind', 'name']);
});

it('isolates condition defaults and honors explicit local opt-out', () => {
  const root = {
    type: 'object',
    if: { properties: { injected: { default: 1 } }, required: ['injected'] },
    then: { properties: { active: { type: 'string' } } },
  } as JsonSchema;
  const data = {};
  const projected = projectConditionalFields(root, root, data, createAjv({ useDefaults: true }));
  expect(projected.schema.properties).toHaveProperty('active');
  expect(data).toEqual({});
  expect(
    conditionalFieldsEnabled(
      { type: 'Control', options: { conditionalFields: false } } as UISchemaElement,
      { jsonformsExtended: { conditionalFields: true } },
    ),
  ).toBe(false);
});

it('projects the canonical fixture with dependencies and preserves authored grouping', async () => {
  const { default: source } =
    await import('../../../jsonforms-svelte-demo-common/src/lib/examples/spec-conditional-fields/schema.json');
  const { default: data } =
    await import('../../../jsonforms-svelte-demo-common/src/lib/examples/spec-conditional-fields/data.json');
  const { default: ui } =
    await import('../../../jsonforms-svelte-demo-common/src/lib/examples/spec-conditional-fields/uischema.json');
  const projected = projectConditionalFields(
    source as JsonSchema,
    source as JsonSchema,
    data,
    createAjv(),
  );
  expect(Object.keys(projected.schema.properties!)).toEqual([
    'customerType',
    'name',
    'purchaseOrder',
    'vatNumber',
    'billingAddress',
  ]);
  expect(projected.schema.required).toEqual(['vatNumber', 'name', 'billingAddress']);
  const detail = ui.elements[1].elements[0].options.detail as unknown as UISchemaElement;
  expect(
    JSON.stringify(conditionalLayout(detail, projected.schema, projected.known)),
  ).not.toContain('#/properties/nickname');
  expect(JSON.stringify(detail)).toContain('#/properties/nickname');
});
