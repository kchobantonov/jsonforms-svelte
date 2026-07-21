import type {
  JsonFormsCellRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
} from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  DispatchRendererCell,
  anyOfStringOrEnumCellEntry,
  booleanToggleCellEntry,
  shadcnCells,
  multiStringCellEntry,
  oneOfRadioGroupCellEntry,
  passwordCellEntry,
  radioGroupCellEntry,
  sliderCellEntry,
  stringMaskCellEntry,
} from '../../src/lib/cells';

const runTester = (
  entry: JsonFormsCellRendererRegistryEntry,
  propertySchema: JsonSchema,
  options?: Record<string, unknown>,
) => {
  const schema = {
    type: 'object',
    properties: { value: propertySchema as unknown as JsonSchema },
  } as JsonSchema;
  const uischema = {
    type: 'Control',
    scope: '#/properties/value',
    ...(options ? { options } : {}),
  } as UISchemaElement;

  return entry.tester(uischema, schema, { rootSchema: schema, config: {} });
};

describe('specialized cell entries', () => {
  const specializedEntries = [
    anyOfStringOrEnumCellEntry,
    booleanToggleCellEntry,
    multiStringCellEntry,
    oneOfRadioGroupCellEntry,
    passwordCellEntry,
    radioGroupCellEntry,
    sliderCellEntry,
    stringMaskCellEntry,
  ];

  it('registers every specialized control as a renderer-backed table cell', () => {
    expect(shadcnCells).toHaveLength(18);
    for (const entry of specializedEntries) {
      expect(shadcnCells).toContain(entry);
      expect(entry.cell).toBe(DispatchRendererCell);
    }
  });

  it('matches the same schema and UI options as the specialized controls', () => {
    expect(
      runTester(anyOfStringOrEnumCellEntry, {
        anyOf: [{ enum: ['A', 'B'] }, { type: 'string' }],
      }),
    ).toBe(5);
    expect(runTester(booleanToggleCellEntry, { type: 'boolean' }, { toggle: true })).toBe(3);
    expect(runTester(multiStringCellEntry, { type: 'string' }, { multi: true })).toBe(2);
    expect(
      runTester(
        oneOfRadioGroupCellEntry,
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
    expect(runTester(passwordCellEntry, { type: 'string', format: 'password' })).toBe(2);
    expect(
      runTester(radioGroupCellEntry, { type: 'string', enum: ['A', 'B'] }, { format: 'radio' }),
    ).toBe(20);
    expect(
      runTester(
        sliderCellEntry,
        { type: 'number', minimum: 0, maximum: 10, default: 0 },
        { slider: true },
      ),
    ).toBe(4);
    expect(runTester(stringMaskCellEntry, { type: 'string' }, { mask: '###-###' })).toBe(2);
  });
});
