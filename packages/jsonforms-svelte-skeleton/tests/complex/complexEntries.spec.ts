import type { JsonFormsRendererRegistryEntry, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  allOfRendererEntry,
  anyOfRendererEntry,
  arrayControlRendererEntry,
  complexRenderers,
  enumArrayRendererEntry,
  mixedRendererEntry,
  objectRendererEntry,
  oneOfRendererEntry,
} from '../../src/lib/complex';

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

describe('complex entries', () => {
  it('matches expected rank for allOf/anyOf/oneOf renderers', () => {
    const controlUi = {
      type: 'Control',
      scope: '#/properties/value',
    } as UISchemaElement;

    expect(
      runTester(
        allOfRendererEntry,
        controlUi,
        createSchema({ allOf: [{ type: 'string' }, { minLength: 1 }] }),
      ),
    ).toBe(3);

    expect(
      runTester(
        anyOfRendererEntry,
        controlUi,
        createSchema({ anyOf: [{ type: 'string' }, { type: 'number' }] }),
      ),
    ).toBe(3);

    expect(
      runTester(
        oneOfRendererEntry,
        controlUi,
        createSchema({ oneOf: [{ type: 'string' }, { type: 'number' }] }),
      ),
    ).toBe(3);
  });

  it('matches expected rank for object and array control renderers', () => {
    const controlUi = {
      type: 'Control',
      scope: '#/properties/value',
    } as UISchemaElement;

    expect(runTester(objectRendererEntry, controlUi, createSchema({ type: 'object' }))).toBe(2);

    expect(
      runTester(
        arrayControlRendererEntry,
        controlUi,
        createSchema({ type: 'array', items: { type: 'string' } }),
      ),
    ).toBe(3);

    expect(
      runTester(
        arrayControlRendererEntry,
        controlUi,
        createSchema({
          type: 'array',
          items: { type: 'object', properties: { name: { type: 'string' } } },
        }),
      ),
    ).toBe(3);
  });

  it('matches expected rank for enum-array renderer', () => {
    const controlUi = {
      type: 'Control',
      scope: '#/properties/value',
    } as UISchemaElement;

    expect(
      runTester(
        enumArrayRendererEntry,
        controlUi,
        createSchema({
          type: 'array',
          uniqueItems: true,
          items: { type: 'string', enum: ['A', 'B'] },
        }),
      ),
    ).toBe(5);

    expect(
      runTester(
        enumArrayRendererEntry,
        controlUi,
        createSchema({
          type: 'array',
          uniqueItems: false,
          items: { type: 'string', enum: ['A', 'B'] },
        }),
      ),
    ).toBe(-1);
  });

  it('matches expected rank for mixed renderer', () => {
    const controlUi = {
      type: 'Control',
      scope: '#/properties/value',
    } as UISchemaElement;

    expect(
      runTester(mixedRendererEntry, controlUi, createSchema({ type: ['string', 'number'] })),
    ).toBe(20);

    expect(runTester(mixedRendererEntry, controlUi, createSchema({ type: 'string' }))).toBe(-1);
  });

  it('exports all complex entries in complexRenderers', () => {
    expect(complexRenderers).toHaveLength(7);
    expect(complexRenderers).toContain(allOfRendererEntry);
    expect(complexRenderers).toContain(anyOfRendererEntry);
    expect(complexRenderers).toContain(arrayControlRendererEntry);
    expect(complexRenderers).toContain(enumArrayRendererEntry);
    expect(complexRenderers).toContain(objectRendererEntry);
    expect(complexRenderers).toContain(oneOfRendererEntry);
    expect(complexRenderers).toContain(mixedRendererEntry);
  });
});
