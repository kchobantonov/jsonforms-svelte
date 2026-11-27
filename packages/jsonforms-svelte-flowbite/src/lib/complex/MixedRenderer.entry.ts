import { isMixedControl } from '@chobantonov/jsonforms-svelte-renderer-common';
import { rankWith, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import mixedRenderer from './MixedRenderer.svelte';
export { isMixedControl, isMixedSchema } from '@chobantonov/jsonforms-svelte-renderer-common';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: mixedRenderer,
  tester: rankWith(20, isMixedControl),
};
