import Ajv from 'ajv';
import type { JsonSchema } from '@jsonforms/core';
import { expect, it } from 'vite-plus/test';
import { suppliedSchemaResources } from './suppliedSchemaResources';

it('presents registered external documents through local pointers without changing validator input', () => {
  const common = {
    $id: 'https://example.test/common.json',
    definitions: {
      Name: { type: 'string', minLength: 2 },
      Profile: {
        type: 'object',
        properties: { name: { $ref: '#/definitions/Name' } },
      },
    },
  };
  const root = {
    $id: 'https://example.test/root.json',
    type: 'object',
    properties: { profile: { $ref: 'https://example.test/common.json#/definitions/Profile' } },
  } as JsonSchema;
  const hostAjv = new Ajv({ strict: false });
  hostAjv.addSchema(common);
  const presentation = suppliedSchemaResources(root, hostAjv);
  expect(presentation).not.toBe(root);
  expect((presentation as Record<string, unknown>).$id).toBeUndefined();
  expect(presentation.properties?.profile.$ref).toBe(
    '#/definitions/__jsonforms_external_0/definitions/Profile',
  );
  expect(root.properties?.profile.$ref).toBe(
    'https://example.test/common.json#/definitions/Profile',
  );
  const valid = { profile: { name: 'Ada' } };
  const invalid = { profile: { name: 'A' } };
  const originalValidate = hostAjv.compile(root);
  const presentationValidate = new Ajv({ strict: false }).compile(presentation);
  expect(presentationValidate(valid)).toBe(originalValidate(valid));
  expect(presentationValidate(invalid)).toBe(originalValidate(invalid));
  expect(presentationValidate(invalid)).toBe(false);
});

it('leaves a form unchanged when its host has no matching external document', () => {
  const root = {
    $id: 'https://example.test/root.json',
    properties: { name: { $ref: 'https://example.test/missing.json' } },
  } as JsonSchema;
  const unresolved: string[] = [];
  expect(
    suppliedSchemaResources(root, new Ajv({ strict: false }), (reference) =>
      unresolved.push(reference),
    ),
  ).toBe(root);
  expect(unresolved).toEqual(['https://example.test/missing.json']);
});

it('follows transitive registered documents while preserving unrelated definitions', () => {
  const root = {
    $id: 'https://example.test/root.json',
    definitions: { __jsonforms_external_0: { type: 'boolean' } },
    properties: { profile: { $ref: 'https://example.test/profile.json' } },
  } as JsonSchema;
  const hostAjv = new Ajv({ strict: false });
  hostAjv.addSchema({
    $id: 'https://example.test/profile.json',
    type: 'object',
    properties: { name: { $ref: 'https://example.test/name.json#Name' } },
  });
  hostAjv.addSchema({
    $id: 'https://example.test/name.json',
    $defs: { label: { $anchor: 'Name', type: 'string', minLength: 2 } },
  });
  const presentation = suppliedSchemaResources(root, hostAjv);
  expect(presentation.definitions?.__jsonforms_external_0).toEqual({ type: 'boolean' });
  expect(presentation.properties?.profile.$ref).toBe('#/definitions/__jsonforms_external_0_1');
  const validate = new Ajv({ strict: false }).compile(presentation);
  expect(validate({ profile: { name: 'Ada' } })).toBe(true);
  expect(validate({ profile: { name: 'A' } })).toBe(false);
});

it('reports an unknown anchor inside a registered external document', () => {
  const root = {
    $id: 'https://example.test/root.json',
    properties: { value: { $ref: 'https://example.test/common.json#missing' } },
  } as JsonSchema;
  const ajv = new Ajv({ strict: false });
  ajv.addSchema({ $id: 'https://example.test/common.json', type: 'string' });
  const unresolved: string[] = [];
  suppliedSchemaResources(root, ajv, (reference) => unresolved.push(reference));
  expect(unresolved).toEqual(['https://example.test/common.json#missing']);
});

it('presents an absolute external reference from an anonymous root', () => {
  const root = {
    type: 'object',
    properties: { value: { $ref: 'https://example.test/common.json#/definitions/Name' } },
  } as JsonSchema;
  const ajv = new Ajv({ strict: false });
  ajv.addSchema({
    $id: 'https://example.test/common.json',
    definitions: { Name: { type: 'string', minLength: 2 } },
  });
  const presentation = suppliedSchemaResources(root, ajv);
  expect(presentation.properties?.value.$ref).toBe(
    '#/definitions/__jsonforms_external_0/definitions/Name',
  );
  expect((presentation as Record<string, unknown>).$id).toBeUndefined();
  expect((root as Record<string, unknown>).$id).toBeUndefined();
  expect(ajv.compile(root)({ value: 'Ada' })).toBe(true);
  expect(new Ajv({ strict: false }).compile(presentation)({ value: 'A' })).toBe(false);
});

it('diagnoses a relative external ref without inventing a base for an anonymous root', () => {
  const root = { properties: { value: { $ref: 'relative.json' } } } as JsonSchema;
  const unresolved: string[] = [];
  expect(
    suppliedSchemaResources(root, new Ajv({ strict: false }), (reference) =>
      unresolved.push(reference),
    ),
  ).toBe(root);
  expect(unresolved).toEqual(['relative.json']);
});

it('reports a missing pointer inside a registered external document', () => {
  const root = {
    $id: 'https://example.test/root.json',
    properties: { value: { $ref: 'https://example.test/common.json#/definitions/Missing' } },
  } as JsonSchema;
  const ajv = new Ajv({ strict: false });
  ajv.addSchema({
    $id: 'https://example.test/common.json',
    definitions: { Name: { type: 'string' } },
  });
  const unresolved: string[] = [];
  suppliedSchemaResources(root, ajv, (reference) => unresolved.push(reference));
  expect(unresolved).toEqual(['https://example.test/common.json#/definitions/Missing']);
});

it('reports a missing absolute external document from an anonymous root', () => {
  const root = {
    properties: { value: { $ref: 'https://example.test/missing.json' } },
  } as JsonSchema;
  const unresolved: string[] = [];
  expect(
    suppliedSchemaResources(root, new Ajv({ strict: false }), (reference) =>
      unresolved.push(reference),
    ),
  ).toBe(root);
  expect(unresolved).toEqual(['https://example.test/missing.json']);
});

it('reports a missing transitive document from a registered external schema', () => {
  const root = {
    $id: 'https://example.test/root.json',
    properties: { value: { $ref: 'https://example.test/common.json' } },
  } as JsonSchema;
  const ajv = new Ajv({ strict: false });
  ajv.addSchema({
    $id: 'https://example.test/common.json',
    $ref: 'https://example.test/missing.json',
  });
  const unresolved: string[] = [];
  suppliedSchemaResources(root, ajv, (reference) => unresolved.push(reference));
  expect(unresolved).toEqual(['https://example.test/missing.json']);
});

it('renders a nested resource exposed by Ajv under its own absolute URI', () => {
  const root = {
    $id: 'https://example.test/root.json',
    properties: { value: { $ref: 'https://example.test/nested.json' } },
  } as JsonSchema;
  const ajv = new Ajv({ strict: false });
  ajv.addSchema({
    $id: 'https://example.test/common.json',
    $defs: { Nested: { $id: 'nested.json', type: 'string', minLength: 2 } },
  });
  const presentation = suppliedSchemaResources(root, ajv);
  expect(presentation.properties?.value.$ref).toMatch(/^#\/definitions\/__jsonforms_external_/);
  expect(new Ajv({ strict: false }).compile(presentation)({ value: 'A' })).toBe(false);
});

it('does not duplicate a nested resource when both parent and child are referenced', () => {
  const root = {
    $id: 'https://example.test/root.json',
    properties: {
      parent: { $ref: 'https://example.test/common.json' },
      child: { $ref: 'https://example.test/nested.json' },
    },
  } as JsonSchema;
  const ajv = new Ajv({ strict: false });
  ajv.addSchema({
    $id: 'https://example.test/common.json',
    type: 'object',
    $defs: { Nested: { $id: 'nested.json', type: 'string', minLength: 2 } },
  });
  const presentation = suppliedSchemaResources(root, ajv);
  expect(presentation.properties?.child.$ref).toMatch(/^#\/definitions\/__jsonforms_external_/);
  expect(new Ajv({ strict: false }).compile(presentation)({ child: 'A' })).toBe(false);
});
