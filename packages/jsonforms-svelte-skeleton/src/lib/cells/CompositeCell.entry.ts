import type { JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
import { compositeCellTester } from '@chobantonov/jsonforms-svelte';
import cell from './CompositeCell.svelte';
export const entry: JsonFormsCellRendererRegistryEntry = { cell, tester: compositeCellTester };
