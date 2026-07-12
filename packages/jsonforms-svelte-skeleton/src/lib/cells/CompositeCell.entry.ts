import type { JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
import cell from './CompositeCell.svelte';
export const entry: JsonFormsCellRendererRegistryEntry = { cell, tester: () => 1 };
