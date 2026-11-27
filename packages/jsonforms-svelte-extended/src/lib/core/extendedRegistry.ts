import {
  and,
  formatIs,
  isStringControl,
  optionIs,
  or,
  rankWith,
  schemaMatches,
  uiTypeIs,
  type JsonFormsCellRendererRegistryEntry,
  type RankedTester,
} from '@jsonforms/core';
import { fileControlTester } from '../file/fileOptions';

const stringFormat = (format: string) =>
  rankWith(3, and(isStringControl, or(formatIs(format), optionIs('format', format))));

export const extendedControlTesters = {
  color: stringFormat('color'),
  cron: stringFormat('cron'),
  duration: stringFormat('duration'),
  file: fileControlTester,
  null: rankWith(
    2,
    and(
      uiTypeIs('Control'),
      schemaMatches((schema) => schema.type === 'null'),
    ),
  ),
};

export function extendedCellEntries(cell: JsonFormsCellRendererRegistryEntry['cell']) {
  const entry = (tester: RankedTester): JsonFormsCellRendererRegistryEntry => ({ cell, tester });
  const colorCellEntry = entry(extendedControlTesters.color);
  const cronCellEntry = entry(extendedControlTesters.cron);
  const durationCellEntry = entry(extendedControlTesters.duration);
  const fileCellEntry = entry(extendedControlTesters.file);
  const nullCellEntry = entry(extendedControlTesters.null);
  return {
    colorCellEntry,
    cronCellEntry,
    durationCellEntry,
    fileCellEntry,
    nullCellEntry,
    cells: [colorCellEntry, cronCellEntry, durationCellEntry, fileCellEntry, nullCellEntry],
  };
}

export const splitLayoutTester = rankWith(
  5,
  and(or(uiTypeIs('HorizontalLayout'), uiTypeIs('VerticalLayout')), (uischema) => {
    const variant = uischema.options?.variant;
    return typeof variant === 'string' && variant.toLowerCase() === 'splitter';
  }),
);
