import {
  and,
  optionIs,
  rankWith,
  schemaTypeIs,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import FlowbiteAgGridArrayControlRenderer from './FlowbiteAgGridArrayControlRenderer.svelte';
import ShadcnAgGridArrayControlRenderer from './ShadcnAgGridArrayControlRenderer.svelte';
import SkeletonAgGridArrayControlRenderer from './SkeletonAgGridArrayControlRenderer.svelte';

export const agGridArrayTester = rankWith(
  10,
  and(uiTypeIs('Control'), schemaTypeIs('array'), optionIs('variant', 'ag-grid')),
);

export const shadcnAgGridArrayRendererEntry: JsonFormsRendererRegistryEntry = {
  renderer: ShadcnAgGridArrayControlRenderer,
  tester: agGridArrayTester,
};

export const skeletonAgGridArrayRendererEntry: JsonFormsRendererRegistryEntry = {
  renderer: SkeletonAgGridArrayControlRenderer,
  tester: agGridArrayTester,
};

export const flowbiteAgGridArrayRendererEntry: JsonFormsRendererRegistryEntry = {
  renderer: FlowbiteAgGridArrayControlRenderer,
  tester: agGridArrayTester,
};
