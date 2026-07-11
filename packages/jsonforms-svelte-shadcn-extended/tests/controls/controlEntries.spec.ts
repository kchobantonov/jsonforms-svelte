import type { JsonFormsRendererRegistryEntry, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  buttonRendererEntry,
  durationControlRendererEntry,
  extendedControlRenderers,
  fileControlRendererEntry,
  nullControlRendererEntry,
} from '../../src/lib/controls';

type TestJsonSchema = JsonSchema & {
  contentEncoding?: string;
};

const createSchema = (propertySchema: TestJsonSchema): JsonSchema =>
  ({
    type: 'object',
    properties: {
      // JsonForms JsonSchema is a draft-04/draft-07 union. Keep tests draft-agnostic.
      value: propertySchema as unknown as JsonSchema,
    },
  }) as JsonSchema;

const runTester = (
  entry: JsonFormsRendererRegistryEntry,
  propertySchema: TestJsonSchema,
  options?: Record<string, unknown>,
) => {
  const schema = createSchema(propertySchema);
  const uischema = {
    type: 'Control',
    scope: '#/properties/value',
    ...(options ? { options } : {}),
  } as UISchemaElement;

  return entry.tester(uischema, schema, {
    rootSchema: schema,
    config: {},
  });
};

describe('extended control entries', () => {
  it('matches button renderer by ui schema type', () => {
    const schema = createSchema({ type: 'string' });
    expect(
      buttonRendererEntry.tester({ type: 'Button', label: 'Submit' } as UISchemaElement, schema, {
        rootSchema: schema,
        config: {},
      }),
    ).toBe(1);
  });

  it('matches duration control by string format duration', () => {
    expect(runTester(durationControlRendererEntry, { type: 'string', format: 'duration' })).toBe(2);
    expect(runTester(durationControlRendererEntry, { type: 'string' })).toBe(-1);
  });

  it('matches file control by binary/base64 markers', () => {
    expect(runTester(fileControlRendererEntry, { type: 'string', format: 'binary' })).toBe(2);
    expect(runTester(fileControlRendererEntry, { type: 'string', format: 'byte' })).toBe(2);
    expect(runTester(fileControlRendererEntry, { type: 'string', contentEncoding: 'base64' })).toBe(
      2,
    );

    expect(runTester(fileControlRendererEntry, { type: 'string', format: 'uri' })).toBe(-1);
    expect(runTester(fileControlRendererEntry, { type: 'number' })).toBe(-1);
  });

  it('matches null control by null schema type', () => {
    expect(runTester(nullControlRendererEntry, { type: 'null' })).toBe(2);
    expect(runTester(nullControlRendererEntry, { type: ['null'] })).toBe(-1);
    expect(runTester(nullControlRendererEntry, { type: ['null', 'string'] })).toBe(-1);
    expect(runTester(nullControlRendererEntry, { type: 'string' })).toBe(-1);
  });

  it('exports all extended control entries', () => {
    expect(extendedControlRenderers).toHaveLength(4);
    expect(extendedControlRenderers).toContain(buttonRendererEntry);
    expect(extendedControlRenderers).toContain(durationControlRendererEntry);
    expect(extendedControlRenderers).toContain(fileControlRendererEntry);
    expect(extendedControlRenderers).toContain(nullControlRendererEntry);
  });
});
