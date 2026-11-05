import Ajv from 'ajv';
import type { JsonSchema } from '@jsonforms/core';
import { expect, it } from 'vite-plus/test';
import { localSchemaResources } from '../../../src/lib/localSchemaResources';

it('rebases local nested resource pointers without changing finite validation or user defaults', () => {
  const schema = {
    $id: 'https://example.test/root.json',
    type: 'object',
    $defs: {
      'node/with~pointer': {
        $id: 'node.json',
        type: 'object',
        properties: {
          label: { type: 'string' },
          child: { $ref: '#' },
          copy: { $ref: 'node.json#/properties/label' },
        },
      },
    },
    properties: {
      node: { $ref: 'node.json#' },
      metadata: { type: 'object', default: { $id: 'user data', $ref: '#' } },
    },
  };
  const normalized = localSchemaResources(schema as JsonSchema) as typeof schema;
  const node = normalized.$defs['node/with~pointer'];
  expect(node.$id).toBeUndefined();
  expect(node.properties.child.$ref).toBe('#/$defs/node~1with~0pointer');
  expect(node.properties.copy.$ref).toBe('#/$defs/node~1with~0pointer/properties/label');
  expect(normalized.properties.node.$ref).toBe('#/$defs/node~1with~0pointer');
  expect(normalized.properties.metadata.default).toEqual({ $id: 'user data', $ref: '#' });
  expect(schema.$defs['node/with~pointer'].$id).toBe('node.json');

  const data = { node: { label: 'Root', child: { label: 'Leaf' }, copy: 'Copy' } };
  const invalid = { node: { label: 'Root', child: { label: 4 } } };
  const originalValidate = new Ajv({ strict: false }).compile(schema);
  const normalizedValidate = new Ajv({ strict: false }).compile(normalized);
  expect(normalizedValidate(data)).toBe(originalValidate(data));
  expect(normalizedValidate(invalid)).toBe(originalValidate(invalid));
  expect(normalizedValidate(invalid)).toBe(false);
});

it('retains ordinary schema identity and external reference meaning', () => {
  const ordinary = { type: 'object', properties: { value: { type: 'string' } } } as JsonSchema;
  expect(localSchemaResources(ordinary)).toBe(ordinary);

  const unusedResource = {
    $id: 'https://example.test/root.json',
    $defs: { unused: { $id: 'unused.json', type: 'string' } },
  } as JsonSchema;
  expect(localSchemaResources(unusedResource)).toBe(unusedResource);

  const schema = {
    $id: 'https://example.test/root.json',
    $defs: { nested: { $id: 'nested.json', $ref: '../other.json#/value' } },
  };
  expect(localSchemaResources(schema as JsonSchema)).toBe(schema);

  const mixed = {
    $id: 'https://example.test/root.json',
    $defs: {
      nested: {
        $id: 'nested.json',
        properties: {
          self: { $ref: '#' },
          external: { $ref: '../other.json#/value' },
        },
      },
    },
  };
  expect(
    (localSchemaResources(mixed as JsonSchema) as typeof mixed).$defs.nested.properties.external
      .$ref,
  ).toBe('https://example.test/other.json#/value');

  const anchored = {
    $id: 'https://example.test/root.json',
    $defs: { nested: { $id: 'nested.json', $anchor: 'node', type: 'string' } },
    properties: { value: { $ref: 'nested.json#node' } },
  };
  const normalized = localSchemaResources(anchored as JsonSchema) as typeof anchored;
  expect(normalized.$defs.nested.$id).toBeUndefined();
  expect(normalized.$defs.nested.$anchor).toBeUndefined();
  expect(normalized.properties.value.$ref).toBe('#/$defs/nested');
  expect(new Ajv({ strict: false }).compile(normalized)({ value: 'text' })).toBe(true);
  expect(new Ajv({ strict: false }).compile(normalized)({ value: 4 })).toBe(false);
  expect(new Ajv({ strict: false }).compile(anchored)({ value: 4 })).toBe(false);
});

it('resolves a root-resource anchor without changing a non-schema default', () => {
  const schema = {
    $id: 'https://example.test/root.json',
    type: 'object',
    definitions: { Name: { $anchor: 'name', type: 'string', default: '#name' } },
    properties: { name: { $ref: '#name' } },
  };
  const normalized = localSchemaResources(schema as JsonSchema) as typeof schema;
  expect(normalized.properties.name.$ref).toBe('#/definitions/Name');
  expect(normalized.definitions.Name.default).toBe('#name');
  expect(new Ajv({ strict: false }).compile(normalized)({ name: 7 })).toBe(false);
  expect(new Ajv({ strict: false }).compile(schema)({ name: 7 })).toBe(false);
});

it('identifies an unknown local anchor without changing the schema', () => {
  const schema = {
    $id: 'https://example.test/root.json',
    type: 'object',
    properties: { value: { $ref: '#missing' } },
  } as JsonSchema;
  const unresolved: string[] = [];
  expect(localSchemaResources(schema, (reference) => unresolved.push(reference))).toBe(schema);
  expect(unresolved).toEqual(['https://example.test/root.json#missing']);
});
