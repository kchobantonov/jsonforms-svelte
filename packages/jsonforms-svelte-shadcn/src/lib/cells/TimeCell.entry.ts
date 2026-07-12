import { isTimeControl, rankWith, type JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
import cell from './TimeCell.svelte';

export const entry: JsonFormsCellRendererRegistryEntry = {
  cell,
  tester: rankWith(3, isTimeControl),
};
