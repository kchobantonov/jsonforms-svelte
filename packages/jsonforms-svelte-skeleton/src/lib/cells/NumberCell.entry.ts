import {
  isNumberControl,
  rankWith,
  type JsonFormsCellRendererRegistryEntry,
} from '@jsonforms/core';
import cell from './NumberCell.svelte';
export const entry: JsonFormsCellRendererRegistryEntry = {
  cell,
  tester: rankWith(2, isNumberControl),
};
