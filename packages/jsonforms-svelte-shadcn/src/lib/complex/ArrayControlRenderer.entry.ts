import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { arrayTableTester } from '@chobantonov/jsonforms-svelte-renderer-common';
import controlRenderer from './ArrayControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: arrayTableTester,
};
