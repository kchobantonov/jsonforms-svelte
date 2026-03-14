import type { JsonFormsRendererRegistryEntry, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import { arrayListRendererEntry, arrayRenderers } from '../../src/lib/array';

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

describe('array entries', () => {
  it('matches expected rank for array list renderer', () => {
    const arraySchema = createSchema({
      type: 'array',
      items: { type: 'string' },
    });
    const nonArraySchema = createSchema({ type: 'string' });

    const controlUi = {
      type: 'Control',
      scope: '#/properties/value',
    } as UISchemaElement;

    expect(runTester(arrayListRendererEntry, controlUi, arraySchema)).toBe(2);
    expect(runTester(arrayListRendererEntry, controlUi, nonArraySchema)).toBe(-1);
  });

  it('exports array renderer entry list', () => {
    expect(arrayRenderers).toHaveLength(1);
    expect(arrayRenderers).toContain(arrayListRendererEntry);
  });
});
