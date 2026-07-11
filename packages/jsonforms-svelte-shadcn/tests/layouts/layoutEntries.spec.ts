import type { JsonFormsRendererRegistryEntry, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  arrayLayoutRendererEntry,
  categorizationEntry,
  categorizationStepperEntry,
  groupRendererEntry,
  layoutRendererEntry,
  layoutRenderers,
} from '../../src/lib/layouts';

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

describe('layout entries', () => {
  it('matches expected ranks for layout and group renderers', () => {
    const schema = createSchema({ type: 'string' });
    const verticalLayout = {
      type: 'VerticalLayout',
      elements: [],
    } as UISchemaElement;
    const groupLayout = {
      type: 'Group',
      label: 'Profile',
      elements: [],
    } as UISchemaElement;

    expect(runTester(layoutRendererEntry, verticalLayout, schema)).toBe(1);
    expect(runTester(layoutRendererEntry, groupLayout, schema)).toBe(1);
    expect(runTester(groupRendererEntry, groupLayout, schema)).toBe(2);
  });

  it('matches expected ranks for categorization variants', () => {
    const schema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
      },
    } as JsonSchema;

    const categorization = {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'General',
          elements: [{ type: 'Control', scope: '#/properties/firstName' }],
        },
      ],
    } as UISchemaElement;

    const stepperCategorization = {
      ...categorization,
      options: { variant: 'stepper' },
    } as UISchemaElement;

    expect(runTester(categorizationEntry, categorization, schema)).toBe(2);
    expect(runTester(categorizationStepperEntry, categorization, schema)).toBe(-1);
    expect(runTester(categorizationEntry, stepperCategorization, schema)).toBe(2);
    expect(runTester(categorizationStepperEntry, stepperCategorization, schema)).toBe(3);
  });

  it('matches array layout renderer for object-array controls with nesting', () => {
    const schema = {
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

    const arrayControl = {
      type: 'Control',
      scope: '#/properties/items',
      options: {
        detail: 'GENERATED',
      },
    } as UISchemaElement;

    expect(runTester(arrayLayoutRendererEntry, arrayControl, schema)).toBe(4);
  });

  it('exports all layout entries in layoutRenderers', () => {
    expect(layoutRenderers).toHaveLength(5);
    expect(layoutRenderers).toContain(layoutRendererEntry);
    expect(layoutRenderers).toContain(groupRendererEntry);
    expect(layoutRenderers).toContain(arrayLayoutRendererEntry);
    expect(layoutRenderers).toContain(categorizationEntry);
    expect(layoutRenderers).toContain(categorizationStepperEntry);
  });
});
