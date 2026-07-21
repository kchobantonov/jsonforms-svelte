import { DispatchRendererCell } from '@chobantonov/jsonforms-svelte-shadcn';
import type { JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
import {
  durationControlRendererEntry,
  fileControlRendererEntry,
  nullControlRendererEntry,
} from '../controls';

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

export const shadcnExtendedCells = [durationCellEntry, fileCellEntry, nullCellEntry];

export {
  DispatchRendererCell as DurationCell,
  DispatchRendererCell as FileCell,
  DispatchRendererCell as NullCell,
};
