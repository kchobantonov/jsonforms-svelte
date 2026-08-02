import {
  and,
  optionIs,
  rankWith,
  schemaTypeIs,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import LazyAgGridArrayControlRenderer from './LazyAgGridArrayControlRenderer.svelte';

export const agGridArrayTester = rankWith(
  10,
  and(uiTypeIs('Control'), schemaTypeIs('array'), optionIs('variant', 'ag-grid')),
);

export const shadcnAgGridArrayRendererEntry: JsonFormsRendererRegistryEntry = {
  renderer: LazyAgGridArrayControlRenderer,
  tester: agGridArrayTester,
};
