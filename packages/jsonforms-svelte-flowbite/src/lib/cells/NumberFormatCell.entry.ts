import {
  isNumberFormatControl,
  rankWith,
  type JsonFormsCellRendererRegistryEntry,
} from '@jsonforms/core';
import cell from './NumberFormatCell.svelte';

export const entry: JsonFormsCellRendererRegistryEntry = {
  cell,
  tester: rankWith(4, isNumberFormatControl),
};
