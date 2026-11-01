import type {
  JsonFormsCellRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
} from '@jsonforms/core';
import { Generate } from '@jsonforms/core';
import { describe, expect, it } from 'vite-plus/test';
import {
  skeletonCells,
  skeletonRenderers,
  textCellEntry,
} from '@chobantonov/jsonforms-svelte-skeleton';
import {
  codeCellFallbackRegistryContract,
  extendedScalarCases,
  fileMaskRegistryContract,
  specializedScalarRegistryContract,
} from '../../../../tests/helpers/format-mask-registry';
import { skeletonExtendedRenderers } from '../../src/lib/renderers';
import {
  colorControlRendererEntry,
  cronControlRendererEntry,
  durationControlRendererEntry,
  fileControlRendererEntry,
  monacoControlRendererEntry,
  nullControlRendererEntry,
} from '../../src/lib/controls';
import {
  ColorCell,
  CronCell,
  DurationCell,
  FileCell,
  NullCell,
  colorCellEntry,
  cronCellEntry,
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
  codeCellFallbackRegistryContract(
    skeletonRenderers,
    skeletonExtendedRenderers,
    skeletonCells,
    skeletonExtendedCells,
    monacoControlRendererEntry,
    textCellEntry,
  );
  specializedScalarRegistryContract(
    [...skeletonRenderers, ...skeletonExtendedRenderers],
    [...skeletonCells, ...skeletonExtendedCells],
    Generate.uiSchema,
    extendedScalarCases({
      color: { renderer: colorControlRendererEntry, cell: colorCellEntry },
      cron: { renderer: cronControlRendererEntry, cell: cronCellEntry },
      duration: { renderer: durationControlRendererEntry, cell: durationCellEntry },
      file: { renderer: fileControlRendererEntry, cell: fileCellEntry },
      null: { renderer: nullControlRendererEntry, cell: nullCellEntry },
    }),
  );
  fileMaskRegistryContract(
    skeletonRenderers,
    skeletonExtendedRenderers,
    skeletonCells,
    skeletonExtendedCells,
    fileControlRendererEntry,
    fileCellEntry,
  );
  it('exports all data-oriented extended controls as table cells', () => {
    expect(skeletonExtendedCells).toEqual([
      colorCellEntry,
      cronCellEntry,
      durationCellEntry,
      fileCellEntry,
      nullCellEntry,
    ]);
    expect(colorCellEntry.cell).toBe(ColorCell);
    expect(cronCellEntry.cell).toBe(CronCell);
    expect(durationCellEntry.cell).toBe(DurationCell);
    expect(fileCellEntry.cell).toBe(FileCell);
    expect(nullCellEntry.cell).toBe(NullCell);
  });

  it('matches color, cron, duration, file, and null schemas', () => {
    expect(runTester(colorCellEntry, { type: 'string', format: 'color' })).toBe(3);
    expect(runTester(cronCellEntry, { type: 'string', format: 'cron' })).toBe(3);
    expect(runTester(durationCellEntry, { type: 'string', format: 'duration' })).toBe(3);
    expect(runTester(fileCellEntry, { type: 'string', format: 'binary' })).toBe(2);
    expect(runTester(fileCellEntry, { type: 'string', contentEncoding: 'base64' })).toBe(2);
    expect(runTester(nullCellEntry, { type: 'null' })).toBe(2);

    expect(runTester(colorCellEntry, { type: 'string' })).toBe(-1);
    expect(runTester(cronCellEntry, { type: 'string' })).toBe(-1);
    expect(runTester(durationCellEntry, { type: 'string' })).toBe(-1);
    expect(runTester(fileCellEntry, { type: 'string' })).toBe(-1);
    expect(runTester(nullCellEntry, { type: 'string' })).toBe(-1);
    expect(runTester(nullCellEntry, { type: ['string', 'null'] })).toBe(-1);
  });
});
