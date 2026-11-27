import { specializedCellEntries } from '@chobantonov/jsonforms-svelte-renderer-common';
import cell from './DispatchRendererCell.svelte';

export const {
  anyOfStringOrEnumCellEntry,
  booleanToggleCellEntry,
  multiStringCellEntry,
  oneOfRadioGroupCellEntry,
  passwordCellEntry,
  radioGroupCellEntry,
  sliderCellEntry,
  stringMaskCellEntry,
} = specializedCellEntries(cell);
