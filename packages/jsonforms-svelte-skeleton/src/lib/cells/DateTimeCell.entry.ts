import {
  isDateTimeControl,
  rankWith,
  type JsonFormsCellRendererRegistryEntry,
} from '@jsonforms/core';
import cell from './DateTimeCell.svelte';
export const entry: JsonFormsCellRendererRegistryEntry = {
  cell,
  tester: rankWith(3, isDateTimeControl),
};
