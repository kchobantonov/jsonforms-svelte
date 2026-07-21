import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import { entry as anyOfStringOrEnumControlRendererEntry } from '../controls/AnyOfStringOrEnumControlRenderer.entry';
import { entry as booleanToggleControlRendererEntry } from '../controls/BooleanToggleControlRenderer.entry';
import { entry as multiStringControlRendererEntry } from '../controls/MultiStringControlRenderer.entry';
import { entry as oneOfRadioGroupControlRendererEntry } from '../controls/OneOfRadioGroupControlRenderer.entry';
import { entry as passwordControlRendererEntry } from '../controls/PasswordControlRenderer.entry';
import { entry as radioGroupControlRendererEntry } from '../controls/RadioGroupControlRenderer.entry';
import { entry as sliderControlRendererEntry } from '../controls/SliderControlRenderer.entry';
import { entry as stringMaskControlRendererEntry } from '../controls/StringMaskControlRenderer.entry';
import cell from './DispatchRendererCell.svelte';

const asCellEntry = (
  rendererEntry: JsonFormsRendererRegistryEntry,
): JsonFormsCellRendererRegistryEntry => ({
  cell,
  tester: rendererEntry.tester,
});

export const anyOfStringOrEnumCellEntry = asCellEntry(anyOfStringOrEnumControlRendererEntry);
export const booleanToggleCellEntry = asCellEntry(booleanToggleControlRendererEntry);
export const multiStringCellEntry = asCellEntry(multiStringControlRendererEntry);
export const oneOfRadioGroupCellEntry = asCellEntry(oneOfRadioGroupControlRendererEntry);
export const passwordCellEntry = asCellEntry(passwordControlRendererEntry);
export const radioGroupCellEntry = asCellEntry(radioGroupControlRendererEntry);
export const sliderCellEntry = asCellEntry(sliderControlRendererEntry);
export const stringMaskCellEntry = asCellEntry(stringMaskControlRendererEntry);
