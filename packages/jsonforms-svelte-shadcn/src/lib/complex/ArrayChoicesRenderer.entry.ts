import { isChipsControl, isMultiSelectControl } from '@chobantonov/jsonforms-svelte';
import { or, rankWith, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import renderer from './ArrayChoicesRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer,
  tester: rankWith(6, or(isChipsControl, isMultiSelectControl)),
};
