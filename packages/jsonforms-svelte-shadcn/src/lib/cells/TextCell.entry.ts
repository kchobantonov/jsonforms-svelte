import {
  isStringControl,
  rankWith,
  type JsonFormsCellRendererRegistryEntry,
} from '@jsonforms/core';
import cell from './TextCell.svelte';
export const entry: JsonFormsCellRendererRegistryEntry = {
  cell,
  tester: rankWith(1, isStringControl),
};
