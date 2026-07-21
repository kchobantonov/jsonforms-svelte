import type {
  JsonFormsCellRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
} from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import {
  ColorCell,
  DurationCell,
  FileCell,
  NullCell,
  colorCellEntry,
  durationCellEntry,
  fileCellEntry,
  skeletonExtendedCells,
  nullCellEntry,
} from '../../src/lib/cells';

type TestSchema = JsonSchema & { contentEncoding?: string };

const runTester = (entry: JsonFormsCellRendererRegistryEntry, propertySchema: TestSchema) => {
  const schema = {
    type: 'object',
    properties: { value: propertySchema as unknown as JsonSchema },
  } as JsonSchema;
  const uischema = {
    type: 'Control',
    scope: '#/properties/value',
  } as UISchemaElement;

  return entry.tester(uischema, schema, { rootSchema: schema, config: {} });
};

describe('extended cell entries', () => {
  it('exports all data-oriented extended controls as table cells', () => {
    expect(skeletonExtendedCells).toEqual([
      colorCellEntry,
      durationCellEntry,
      fileCellEntry,
      nullCellEntry,
    ]);
    expect(colorCellEntry.cell).toBe(ColorCell);
    expect(durationCellEntry.cell).toBe(DurationCell);
    expect(fileCellEntry.cell).toBe(FileCell);
    expect(nullCellEntry.cell).toBe(NullCell);
  });

  it('matches color, duration, file, and null schemas', () => {
    expect(runTester(colorCellEntry, { type: 'string', format: 'color' })).toBe(2);
    expect(runTester(durationCellEntry, { type: 'string', format: 'duration' })).toBe(2);
    expect(runTester(fileCellEntry, { type: 'string', format: 'binary' })).toBe(2);
    expect(runTester(fileCellEntry, { type: 'string', contentEncoding: 'base64' })).toBe(2);
    expect(runTester(nullCellEntry, { type: 'null' })).toBe(2);

    expect(runTester(colorCellEntry, { type: 'string' })).toBe(-1);
    expect(runTester(durationCellEntry, { type: 'string' })).toBe(-1);
    expect(runTester(fileCellEntry, { type: 'string' })).toBe(-1);
    expect(runTester(nullCellEntry, { type: 'string' })).toBe(-1);
  });
});
