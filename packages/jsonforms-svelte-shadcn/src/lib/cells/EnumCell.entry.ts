import { isEnumControl, rankWith, type JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
import cell from './EnumCell.svelte';
export const entry: JsonFormsCellRendererRegistryEntry = {
  cell,
  tester: rankWith(4, isEnumControl),
};
