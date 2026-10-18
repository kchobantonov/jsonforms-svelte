import type { JsonFormsRendererRegistryEntry, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  buttonRendererEntry,
  cronControlRendererEntry,
  colorControlRendererEntry,
  durationControlRendererEntry,
  extendedControlRenderers,
  fileControlRendererEntry,
  nullControlRendererEntry,
  monacoControlRendererEntry,
  shadcnAgGridArrayRendererEntry,
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
    expect(runTester(durationControlRendererEntry, { type: 'string', format: 'duration' })).toBe(3);
    expect(runTester(durationControlRendererEntry, { type: 'string' })).toBe(-1);
  });

  it('matches color control by string format color', () => {
    expect(runTester(colorControlRendererEntry, { type: 'string', format: 'color' })).toBe(3);
    expect(runTester(colorControlRendererEntry, { type: 'string' })).toBe(-1);
  });

  it.each([
    ['color', colorControlRendererEntry],
    ['duration', durationControlRendererEntry],
    ['cron', cronControlRendererEntry],
  ] as const)('selects %s through local format only for compatible strings', (format, entry) => {
    expect(runTester(entry, { type: 'string' }, { format })).toBe(3);
    expect(runTester(entry, { type: 'number' }, { format })).toBe(-1);
    expect(runTester(entry, { type: 'object' }, { format })).toBe(-1);
    const schema = createSchema({ type: 'string' });
    expect(
      entry.tester({ type: 'Label', options: { format } }, schema, {
        rootSchema: schema,
        config: {},
      }),
    ).toBe(-1);
    expect(
      entry.tester({ type: 'Control', scope: '#/properties/value' } as UISchemaElement, schema, {
        rootSchema: schema,
        config: { format },
      }),
    ).toBe(-1);
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

  it('matches Monaco code controls and converted JSON objects', () => {
    expect(
      runTester(
        monacoControlRendererEntry,
        { type: 'string' },
        { format: 'code', language: 'typescript' },
      ),
    ).toBe(3);
    expect(
      runTester(
        monacoControlRendererEntry,
        { type: 'object' },
        { format: 'code', language: 'json', convertJson: true },
      ),
    ).toBe(3);
    // Spec §18.26: omitted language falls back to plaintext.
    expect(runTester(monacoControlRendererEntry, { type: 'string' }, { format: 'code' })).toBe(3);
    expect(runTester(monacoControlRendererEntry, { type: 'string' })).toBe(-1);
    expect(runTester(monacoControlRendererEntry, { type: 'number' }, { format: 'code' })).toBe(-1);
  });

  it('exports all extended control entries', () => {
    expect(extendedControlRenderers).toEqual([
      cronControlRendererEntry,
      buttonRendererEntry,
      colorControlRendererEntry,
      durationControlRendererEntry,
      fileControlRendererEntry,
      monacoControlRendererEntry,
      nullControlRendererEntry,
      shadcnAgGridArrayRendererEntry,
    ]);
  });
});
