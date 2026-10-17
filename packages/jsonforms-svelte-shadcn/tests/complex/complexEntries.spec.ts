import type { JsonFormsRendererRegistryEntry, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  choiceCardsRendererEntry,
  allOfRendererEntry,
  anyOfRendererEntry,
  arrayControlRendererEntry,
  complexRenderers,
  enumArrayRendererEntry,
  mixedRendererEntry,
  objectRendererEntry,
  oneOfRendererEntry,
  tupleControlRendererEntry,
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
    expect(runTester(mixedRendererEntry, controlUi, createSchema({ type: ['null'] }))).toBe(20);

    expect(runTester(mixedRendererEntry, controlUi, createSchema({ type: 'string' }))).toBe(-1);
  });

  it('selects cards ahead of ordinary enum controls only with the cards hint', () => {
    const schema = createSchema({ enum: ['A', 'B'] });
    expect(
      runTester(
        choiceCardsRendererEntry,
        { type: 'Control', scope: '#/properties/value', options: { format: 'cards' } },
        schema,
      ),
    ).toBe(21);
    expect(
      runTester(choiceCardsRendererEntry, { type: 'Control', scope: '#/properties/value' }, schema),
    ).toBe(-1);
  });

  it('exports all complex entries in complexRenderers', () => {
    expect(complexRenderers).toContain(choiceCardsRendererEntry);
    expect(complexRenderers).toContain(tupleControlRendererEntry);
    expect(complexRenderers).toContain(allOfRendererEntry);
    expect(complexRenderers).toContain(anyOfRendererEntry);
    expect(complexRenderers).toContain(arrayControlRendererEntry);
    expect(complexRenderers).toContain(enumArrayRendererEntry);
    expect(complexRenderers).toContain(objectRendererEntry);
    expect(complexRenderers).toContain(oneOfRendererEntry);
    expect(complexRenderers).toContain(mixedRendererEntry);
  });
});

it('selects unrestricted roots and scoped references without taking finite choices or compositions', () => {
  const control = { type: 'Control', scope: '#' } as UISchemaElement;
  expect(runTester(mixedRendererEntry, control, {})).toBe(20);
  expect(runTester(mixedRendererEntry, control, { title: 'Anything' })).toBe(20);
  const schema: JsonSchema = {
    definitions: { value: {} },
    properties: { value: { $ref: '#/definitions/value' } },
  };
  expect(
    runTester(
      mixedRendererEntry,
      { type: 'Control', scope: '#/properties/value' } as UISchemaElement,
      schema,
    ),
  ).toBe(20);
  expect(runTester(mixedRendererEntry, control, { enum: ['a', 1] })).toBe(-1);
  expect(
    runTester(mixedRendererEntry, control, { type: ['string', 'number'], enum: ['a', 1] }),
  ).toBe(-1);
  expect(
    runTester(mixedRendererEntry, control, { anyOf: [{ type: 'string' }, { type: 'number' }] }),
  ).toBe(-1);
});
