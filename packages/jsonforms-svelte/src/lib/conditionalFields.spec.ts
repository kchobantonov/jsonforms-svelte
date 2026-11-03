import { createAjv, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { expect, it, vi } from 'vite-plus/test';
import {
  conditionalFieldsEnabled,
  conditionalLayout,
  hasConditionalFields,
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

it('reports an unresolved conditional reference without dropping base fields', () => {
  const broken = {
    type: 'object',
    properties: { kind: { type: 'string' } },
    allOf: [{ $ref: '#/definitions/missing' }],
  } as JsonSchema;
  const result = projectConditionalFields(broken, broken, { kind: 'business' }, createAjv());
  expect(result.diagnostics).toEqual(['conditional.referenceFailed']);
  expect(Object.keys(result.schema.properties!)).toEqual(['kind']);
});

it('projects ordinary fields from a referenced allOf branch when opted in', () => {
  const root = {
    type: 'object',
    definitions: { Extra: { properties: { vat: { type: 'string' } }, required: ['vat'] } },
    properties: {
      value: {
        type: 'object',
        properties: { kind: { type: 'string' } },
        allOf: [{ $ref: '#/definitions/Extra' }],
      },
    },
  } as JsonSchema;
  const valueSchema = root.properties?.value as JsonSchema;
  expect(hasConditionalFields(valueSchema, new Set(), root)).toBe(true);
  const result = projectConditionalFields(valueSchema, root, { kind: 'business' }, createAjv());
  expect(Object.keys(result.schema.properties ?? {})).toEqual(['kind', 'vat']);
  expect(result.schema.required).toEqual(['vat']);
  expect(result.diagnostics).toEqual([]);
  expect(
    hasConditionalFields({ type: 'object', allOf: [{ minProperties: 1 }] } as JsonSchema),
  ).toBe(false);
});

it('does not mistake a local reference to false for a missing conditional resource', () => {
  const root = {
    type: 'object',
    definitions: { impossible: false },
    properties: { name: { type: 'string' } },
    allOf: [{ $ref: '#/definitions/impossible' }],
  } as unknown as JsonSchema;
  expect(hasConditionalFields(root)).toBe(false);
  const result = projectConditionalFields(root, root, { name: 'Ada' }, createAjv());
  expect(result.diagnostics).toEqual([]);
  expect(result.schema.properties?.name).toEqual({ type: 'string' });
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

it('discovers a conditional branch reached through a root-local allOf reference', () => {
  const root = {
    definitions: {
      Branch: {
        if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
        then: { properties: { vat: { type: 'string' } } },
        else: { properties: { nickname: { type: 'string' } } },
      },
    },
    type: 'object',
    properties: { kind: { type: 'string' } },
    allOf: [{ $ref: '#/definitions/Branch' }],
  } as JsonSchema;
  expect(hasConditionalFields(root)).toBe(true);
  const active = projectConditionalFields(root, root, { kind: 'business' }, createAjv());
  expect(Object.keys(active.schema.properties!)).toEqual(['kind', 'vat']);
  const inactive = projectConditionalFields(root, root, { kind: 'person' }, createAjv());
  expect(Object.keys(inactive.schema.properties!)).toEqual(['kind', 'nickname']);
});

it('projects the same referenced conditional at successive recursive data paths', () => {
  const root = {
    $id: 'https://example.test/root.json',
    definitions: {
      Branch: {
        if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
        then: { properties: { vat: { type: 'string' } } },
        else: { properties: { nickname: { type: 'string' } } },
      },
      Node: {
        type: 'object',
        properties: { kind: { type: 'string' }, child: { $ref: '#/definitions/Node' } },
        allOf: [{ $ref: '#/definitions/Branch' }],
      },
    },
    properties: { value: { $ref: '#/definitions/Node' } },
  } as JsonSchema;
  const node = root.definitions!.Node as JsonSchema;
  expect(hasConditionalFields(node, new Set(), root)).toBe(true);
  const ajv = createAjv();
  const parent = projectConditionalFields(node, root, { kind: 'business' }, ajv);
  const child = projectConditionalFields(node, root, { kind: 'personal' }, ajv);
  expect(Object.keys(parent.schema.properties!)).toEqual(['kind', 'child', 'vat']);
  expect(Object.keys(child.schema.properties!)).toEqual(['kind', 'child', 'nickname']);
  expect(parent.schema.properties?.child.$ref).toBe('#/definitions/Node');
});
