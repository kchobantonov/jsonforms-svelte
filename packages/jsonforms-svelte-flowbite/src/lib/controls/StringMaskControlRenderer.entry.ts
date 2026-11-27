import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { stringMaskTester } from '@chobantonov/jsonforms-svelte-renderer-common';
import controlRenderer from './StringMaskControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: stringMaskTester,
};
