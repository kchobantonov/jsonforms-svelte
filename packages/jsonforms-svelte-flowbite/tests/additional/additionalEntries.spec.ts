import type { JsonFormsRendererRegistryEntry, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  additionalRenderers,
  labelRendererEntry,
  listWithDetailRendererEntry,
} from '../../src/lib/additional';

const createSchema = (propertySchema: JsonSchema, propertyName = 'value'): JsonSchema =>
  ({
    type: 'object',
    properties: {
      // JsonForms JsonSchema is a draft-04/draft-07 union, keep helper draft-agnostic.
      [propertyName]: propertySchema as unknown as JsonSchema,
    },
  }) as JsonSchema;

const runTester = (
  entry: JsonFormsRendererRegistryEntry,
  uischema: UISchemaElement,
  schema: JsonSchema,
) =>
  entry.tester(uischema, schema, {
    rootSchema: schema,
    config: {},
  });

describe('additional entries', () => {
  it('matches expected rank for Label renderer', () => {
    const schema = createSchema({ type: 'string' });
    const labelUi = {
      type: 'Label',
      text: 'Sample',
    } as UISchemaElement;
    const controlUi = {
      type: 'Control',
      scope: '#/properties/value',
    } as UISchemaElement;

    expect(runTester(labelRendererEntry, labelUi, schema)).toBe(1);
    expect(runTester(labelRendererEntry, controlUi, schema)).toBe(-1);
  });

  it('matches expected rank for ListWithDetail renderer', () => {
    const objectArraySchema = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
    } as JsonSchema;
    const primitiveArraySchema = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    } as JsonSchema;
    const listWithDetailUi = {
      type: 'ListWithDetail',
      scope: '#/properties/items',
    } as UISchemaElement;

    expect(runTester(listWithDetailRendererEntry, listWithDetailUi, objectArraySchema)).toBe(4);
    expect(runTester(listWithDetailRendererEntry, listWithDetailUi, primitiveArraySchema)).toBe(
      -1,
    );
  });

  it('exports all additional entries in additionalRenderers', () => {
    expect(additionalRenderers).toHaveLength(2);
    expect(additionalRenderers).toContain(labelRendererEntry);
    expect(additionalRenderers).toContain(listWithDetailRendererEntry);
  });
});
