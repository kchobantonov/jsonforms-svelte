import { DispatchRendererCell } from '@chobantonov/jsonforms-svelte-shadcn';
import type { JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
import {
  colorControlRendererEntry,
  durationControlRendererEntry,
  fileControlRendererEntry,
  nullControlRendererEntry,
} from '../controls';

export const colorCellEntry: JsonFormsCellRendererRegistryEntry = {
  cell: DispatchRendererCell,
  tester: colorControlRendererEntry.tester,
};

export const durationCellEntry: JsonFormsCellRendererRegistryEntry = {
  cell: DispatchRendererCell,
  tester: durationControlRendererEntry.tester,
};
export const fileCellEntry: JsonFormsCellRendererRegistryEntry = {
  cell: DispatchRendererCell,
  tester: fileControlRendererEntry.tester,
};
export const nullCellEntry: JsonFormsCellRendererRegistryEntry = {
  cell: DispatchRendererCell,
  tester: nullControlRendererEntry.tester,
};

export const shadcnExtendedCells = [
  colorCellEntry,
  durationCellEntry,
  fileCellEntry,
  nullCellEntry,
];

export {
  DispatchRendererCell as ColorCell,
  DispatchRendererCell as DurationCell,
  DispatchRendererCell as FileCell,
  DispatchRendererCell as NullCell,
};
