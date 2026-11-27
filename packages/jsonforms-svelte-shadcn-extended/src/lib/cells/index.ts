import { DispatchRendererCell } from '@chobantonov/jsonforms-svelte-shadcn';
import { extendedCellEntries } from '@chobantonov/jsonforms-svelte-extended';

export const {
  colorCellEntry,
  cronCellEntry,
  durationCellEntry,
  fileCellEntry,
  nullCellEntry,
  cells: shadcnExtendedCells,
} = extendedCellEntries(DispatchRendererCell);

export {
  DispatchRendererCell as ColorCell,
  DispatchRendererCell as CronCell,
  DispatchRendererCell as DurationCell,
  DispatchRendererCell as FileCell,
  DispatchRendererCell as NullCell,
};
