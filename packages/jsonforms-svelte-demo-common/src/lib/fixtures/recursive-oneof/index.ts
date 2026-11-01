import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';
import schema from '../../examples/spec-recursive-tree/schema.json';
import sourceData from '../../examples/spec-recursive-tree/data.json';
import translations from '../../examples/spec-recursive-tree/translations.json';

const populated = structuredClone(sourceData.populated);
populated.children[0].name = '';

export const createRecursiveOneOfExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'recursive-oneof',
      label: 'Recursive oneOf in a regular form',
      schema: schema as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/populated' } as UISchemaElement,
      data: { populated },
    },
    translations,
    getLocale,
  );

const rootSchema = {
  $schema: schema.$schema,
  definitions: {
    ...schema.definitions,
    folder: {
      ...schema.definitions.folder,
      properties: {
        ...schema.definitions.folder.properties,
        children: {
          ...schema.definitions.folder.properties.children,
          items: { $ref: '#' },
        },
      },
    },
  },
  oneOf: schema.definitions.node.oneOf,
  default: schema.definitions.node.default,
} as JsonSchema;

export const createRootRecursiveOneOfExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'root-recursive-oneof',
      label: 'Root recursive oneOf reference',
      schema: rootSchema,
      uischema: { type: 'Control', scope: '#' } as UISchemaElement,
      data: populated,
    },
    translations,
    getLocale,
  );

export const createNestedIdRecursionExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'nested-id-recursion',
      label: 'Nested resource recursive object',
      exampleSource: 'development',
      schema: {
        $id: 'https://example.test/root.json',
        type: 'object',
        $defs: {
          Node: {
            $id: 'node.json',
            type: 'object',
            properties: { label: { type: 'string' }, child: { $ref: '#' } },
          },
        },
        properties: { node: { $ref: '#/$defs/Node' } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/node' },
      data: { node: { label: 'Root', child: { label: 'Leaf' } } },
    },
    {
      en: { 'node.label': 'Node', 'label.label': 'Label', 'child.label': 'Child' },
      bg: { 'node.label': 'Възел', 'label.label': 'Етикет', 'child.label': 'Дете' },
    },
    getLocale,
  );

export const createNestedAnchorRecursionExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'nested-anchor-recursion',
      label: 'Nested resource anchor recursion',
      exampleSource: 'development',
      schema: {
        $id: 'https://example.test/root.json',
        type: 'object',
        $defs: {
          Node: {
            $id: 'node.json',
            $anchor: 'node',
            type: 'object',
            properties: { label: { type: 'string' }, child: { $ref: '#node' } },
          },
        },
        properties: { node: { $ref: 'node.json#node' } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/node' },
      data: { node: { label: 'Root', child: { label: 'Leaf' } } },
    },
    {
      en: { 'node.label': 'Node', 'label.label': 'Label', 'child.label': 'Child' },
      bg: { 'node.label': 'Възел', 'label.label': 'Етикет', 'child.label': 'Дете' },
    },
    getLocale,
  );

export const createUnknownAnchorExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'unknown-anchor-reference',
      label: 'Unknown anchor reference',
      exampleSource: 'development',
      schema: {
        $id: 'https://example.test/root.json',
        type: 'object',
        properties: { value: { $ref: '#missing' } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/value' },
      data: { value: 'Kept' },
    },
    { en: {}, bg: {} },
    getLocale,
  );
