import { DispatchRendererCell } from '@chobantonov/jsonforms-svelte-flowbite';
import { extendedCellEntries } from '@chobantonov/jsonforms-svelte-extended';

export const {
  colorCellEntry,
  cronCellEntry,
  durationCellEntry,
  fileCellEntry,
  nullCellEntry,
  cells: flowbiteExtendedCells,
} = extendedCellEntries(DispatchRendererCell);

export {
  DispatchRendererCell as ColorCell,
  DispatchRendererCell as CronCell,
  DispatchRendererCell as DurationCell,
  DispatchRendererCell as FileCell,
  DispatchRendererCell as NullCell,
};
