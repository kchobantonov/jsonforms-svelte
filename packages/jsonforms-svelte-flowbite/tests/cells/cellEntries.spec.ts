import type {
  JsonFormsCellRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
} from '@jsonforms/core';
import { Generate } from '@jsonforms/core';
import { describe, expect, it } from 'vite-plus/test';
import {
  baseScalarCases,
  compositeCellRegistryContract,
  formatMaskRegistryContract,
  specializedScalarRegistryContract,
} from '../../../../tests/helpers/format-mask-registry';
import {
  anyOfStringOrEnumControlRendererEntry,
  booleanControlRendererEntry,
  booleanToggleControlRendererEntry,
  controlRenderers,
  dateControlRendererEntry,
  dateTimeControlRendererEntry,
  enumControlRendererEntry,
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
import {
  DispatchRendererCell,
  anyOfStringOrEnumCellEntry,
  booleanCellEntry,
  booleanToggleCellEntry,
  compositeCellEntry,
  flowbiteCells,
  dateCellEntry,
  dateTimeCellEntry,
  enumCellEntry,
  timeCellEntry,
  multiStringCellEntry,
  numberCellEntry,
  oneOfEnumCellEntry,
  oneOfRadioGroupCellEntry,
  passwordCellEntry,
  radioGroupCellEntry,
  sliderCellEntry,
  stringMaskCellEntry,
  textCellEntry,
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
  compositeCellRegistryContract(
    flowbiteCells,
    {
      composite: compositeCellEntry,
      text: textCellEntry,
      number: numberCellEntry,
    },
    it,
  );
  specializedScalarRegistryContract(
    controlRenderers,
    flowbiteCells,
    Generate.uiSchema,
    baseScalarCases({
      suggested: {
        renderer: anyOfStringOrEnumControlRendererEntry,
        cell: anyOfStringOrEnumCellEntry,
      },
      toggle: { renderer: booleanToggleControlRendererEntry, cell: booleanToggleCellEntry },
      multiline: { renderer: multiStringControlRendererEntry, cell: multiStringCellEntry },
      oneOfRadio: { renderer: oneOfRadioGroupControlRendererEntry, cell: oneOfRadioGroupCellEntry },
      password: { renderer: passwordControlRendererEntry, cell: passwordCellEntry },
      radio: { renderer: radioGroupControlRendererEntry, cell: radioGroupCellEntry },
      slider: { renderer: sliderControlRendererEntry, cell: sliderCellEntry },
      mask: { renderer: stringMaskControlRendererEntry, cell: stringMaskCellEntry },
      boolean: { renderer: booleanControlRendererEntry, cell: booleanCellEntry },
      string: { renderer: stringControlRendererEntry, cell: textCellEntry },
      oneOf: { renderer: oneOfEnumControlRendererEntry, cell: oneOfEnumCellEntry },
      enum: { renderer: enumControlRendererEntry, cell: enumCellEntry },
      number: { renderer: numberControlRendererEntry, cell: numberCellEntry },
    }),
    it,
  );
  formatMaskRegistryContract(
    controlRenderers,
    flowbiteCells,
    {
      date: { renderer: dateControlRendererEntry, cell: dateCellEntry },
      time: { renderer: timeControlRendererEntry, cell: timeCellEntry },
      'date-time': { renderer: dateTimeControlRendererEntry, cell: dateTimeCellEntry },
      password: { renderer: passwordControlRendererEntry, cell: passwordCellEntry },
    },
    it,
  );
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

  it('selects password presentation from UI options only for string data', () => {
    expect(runTester(passwordCellEntry, { type: 'string' }, { format: 'password' })).toBe(4);
    expect(runTester(passwordCellEntry, { type: 'number' }, { format: 'password' })).toBe(-1);
    expect(runTester(passwordCellEntry, { type: 'string' }, { format: 'text' })).toBe(-1);
  });

  it('registers every specialized control as a renderer-backed table cell', () => {
    expect(flowbiteCells).toHaveLength(19);
    for (const entry of specializedEntries) {
      expect(flowbiteCells).toContain(entry);
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
    expect(runTester(passwordCellEntry, { type: 'string', format: 'password' })).toBe(4);
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
