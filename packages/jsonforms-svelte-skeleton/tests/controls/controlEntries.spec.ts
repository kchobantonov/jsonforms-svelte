import type { JsonFormsRendererRegistryEntry, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  anyOfStringOrEnumControlRendererEntry,
  booleanControlRendererEntry,
  booleanToggleControlRendererEntry,
  controlRenderers,
  dateControlRendererEntry,
  dateTimeControlRendererEntry,
  enumControlRendererEntry,
  integerControlRendererEntry,
  multiStringControlRendererEntry,
  numberControlRendererEntry,
  oneOfEnumControlRendererEntry,
  oneOfRadioGroupControlRendererEntry,
  passwordControlRendererEntry,
  radioGroupControlRendererEntry,
  sliderControlRendererEntry,
  stringControlRendererEntry,
  stringMaskControlRendererEntry,
  timeControlRendererEntry,
} from '../../src/lib/controls';

const createControl = (options?: Record<string, unknown>): UISchemaElement => {
  const control: UISchemaElement = {
    type: 'Control',
    scope: '#/properties/value',
    ...(options ? { options } : {}),
  };

  return control;
};

const createSchema = (propertySchema: JsonSchema): JsonSchema => {
  const schema = {
    type: 'object',
    properties: {
      // JsonForms JsonSchema is a draft-04/draft-07 union; keep the helper draft-agnostic.
      value: propertySchema as unknown as JsonSchema,
    },
  } as JsonSchema;

  return schema;
};

const runTester = (
  entry: JsonFormsRendererRegistryEntry,
  propertySchema: JsonSchema,
  options?: Record<string, unknown>,
) => {
  const schema = createSchema(propertySchema);
  const uischema = createControl(options);
  return entry.tester(uischema, schema, {
    rootSchema: schema,
    config: {},
  });
};

describe('controls entries', () => {
  it('prefers toggle boolean renderer when toggle option is enabled', () => {
    const propertySchema: JsonSchema = { type: 'boolean' };

    expect(runTester(booleanControlRendererEntry, propertySchema)).toBe(1);
    expect(runTester(booleanToggleControlRendererEntry, propertySchema)).toBe(-1);
    expect(runTester(booleanToggleControlRendererEntry, propertySchema, { toggle: true })).toBe(3);
  });

  it('prefers radio renderer for enum controls with radio format', () => {
    const enumSchema: JsonSchema = { type: 'string', enum: ['A', 'B'] };

    expect(runTester(enumControlRendererEntry, enumSchema)).toBe(2);
    expect(runTester(radioGroupControlRendererEntry, enumSchema)).toBe(-1);
    expect(runTester(radioGroupControlRendererEntry, enumSchema, { format: 'radio' })).toBe(20);
  });

  it('prefers oneOf radio renderer for oneOf enums with radio format', () => {
    const oneOfSchema: JsonSchema = {
      type: 'string',
      oneOf: [
        { const: 'A', title: 'A' },
        { const: 'B', title: 'B' },
      ],
    };

    expect(runTester(oneOfEnumControlRendererEntry, oneOfSchema)).toBe(5);
    expect(runTester(oneOfRadioGroupControlRendererEntry, oneOfSchema)).toBe(-1);
    expect(runTester(oneOfRadioGroupControlRendererEntry, oneOfSchema, { format: 'radio' })).toBe(
      20,
    );
  });

  it('uses string mask renderer only when mask option is present', () => {
    const stringSchema: JsonSchema = { type: 'string' };

    expect(runTester(stringControlRendererEntry, stringSchema)).toBe(1);
    expect(runTester(stringMaskControlRendererEntry, stringSchema)).toBe(-1);
    expect(runTester(stringMaskControlRendererEntry, stringSchema, { mask: '###-###' })).toBe(2);
  });

  it('matches anyOf text-or-enum renderer only for supported anyOf schemas', () => {
    const anyOfSupported: JsonSchema = {
      anyOf: [{ enum: ['A', 'B'] }, { type: 'string' }],
    };
    const anyOfUnsupported: JsonSchema = {
      anyOf: [{ enum: ['A', 'B'] }, { type: 'number' }],
    };

    expect(runTester(anyOfStringOrEnumControlRendererEntry, anyOfSupported)).toBe(5);
    expect(runTester(anyOfStringOrEnumControlRendererEntry, anyOfUnsupported)).toBe(-1);
  });

  it('exports all control entries in the renderer list', () => {
    expect(controlRenderers).toHaveLength(17);
    expect(controlRenderers).toContain(anyOfStringOrEnumControlRendererEntry);
    expect(controlRenderers).toContain(booleanControlRendererEntry);
    expect(controlRenderers).toContain(booleanToggleControlRendererEntry);
    expect(controlRenderers).toContain(stringControlRendererEntry);
    expect(controlRenderers).toContain(stringMaskControlRendererEntry);
    expect(controlRenderers).toContain(enumControlRendererEntry);
    expect(controlRenderers).toContain(radioGroupControlRendererEntry);
    expect(controlRenderers).toContain(oneOfEnumControlRendererEntry);
    expect(controlRenderers).toContain(oneOfRadioGroupControlRendererEntry);
  });

  it('matches representative schema/options for every control entry', () => {
    expect(runTester(stringControlRendererEntry, { type: 'string' })).toBeGreaterThan(-1);
    expect(runTester(numberControlRendererEntry, { type: 'number' })).toBeGreaterThan(-1);
    expect(runTester(integerControlRendererEntry, { type: 'integer' })).toBeGreaterThan(-1);
    expect(runTester(booleanControlRendererEntry, { type: 'boolean' })).toBeGreaterThan(-1);
    expect(
      runTester(booleanToggleControlRendererEntry, { type: 'boolean' }, { toggle: true }),
    ).toBe(3);
    expect(
      runTester(enumControlRendererEntry, { type: 'string', enum: ['A', 'B'] }),
    ).toBeGreaterThan(-1);
    expect(
      runTester(
        radioGroupControlRendererEntry,
        { type: 'string', enum: ['A', 'B'] },
        { format: 'radio' },
      ),
    ).toBe(20);
    expect(
      runTester(oneOfEnumControlRendererEntry, {
        type: 'string',
        oneOf: [
          { const: 'A', title: 'A' },
          { const: 'B', title: 'B' },
        ],
      }),
    ).toBeGreaterThan(-1);
    expect(
      runTester(
        oneOfRadioGroupControlRendererEntry,
        {
          type: 'string',
          oneOf: [
            { const: 'A', title: 'A' },
            { const: 'B', title: 'B' },
          ],
        },
        { format: 'radio' },
      ),
    ).toBe(20);
    expect(
      runTester(multiStringControlRendererEntry, { type: 'string' }, { multi: true }),
    ).toBeGreaterThan(-1);
    expect(
      runTester(passwordControlRendererEntry, { type: 'string', format: 'password' }),
    ).toBeGreaterThan(-1);
    expect(
      runTester(
        sliderControlRendererEntry,
        { type: 'number', minimum: 0, maximum: 10, default: 0 },
        { slider: true },
      ),
    ).toBeGreaterThan(-1);
    expect(runTester(stringMaskControlRendererEntry, { type: 'string' }, { mask: '###-###' })).toBe(
      2,
    );
    expect(
      runTester(anyOfStringOrEnumControlRendererEntry, {
        anyOf: [{ enum: ['A', 'B'] }, { type: 'string' }],
      }),
    ).toBeGreaterThan(-1);
    expect(runTester(dateControlRendererEntry, { type: 'string', format: 'date' })).toBeGreaterThan(
      -1,
    );
    expect(
      runTester(dateTimeControlRendererEntry, { type: 'string', format: 'date-time' }),
    ).toBeGreaterThan(-1);
    expect(runTester(timeControlRendererEntry, { type: 'string', format: 'time' })).toBeGreaterThan(
      -1,
    );
  });
});
