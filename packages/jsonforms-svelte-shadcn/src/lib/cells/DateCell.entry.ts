import { isDateControl, rankWith, type JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
import cell from './DateCell.svelte';
export const entry: JsonFormsCellRendererRegistryEntry = {
  cell,
  tester: rankWith(3, isDateControl),
};
