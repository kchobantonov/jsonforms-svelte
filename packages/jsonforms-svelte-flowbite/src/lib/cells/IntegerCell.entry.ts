import {
  isIntegerControl,
  rankWith,
  type JsonFormsCellRendererRegistryEntry,
} from '@jsonforms/core';
import cell from './IntegerCell.svelte';
export const entry: JsonFormsCellRendererRegistryEntry = {
  cell,
  tester: rankWith(3, isIntegerControl),
};
