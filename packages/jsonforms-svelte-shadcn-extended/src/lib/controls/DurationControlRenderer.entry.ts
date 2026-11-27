import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { extendedControlTesters } from '@chobantonov/jsonforms-svelte-extended';
import renderer from './DurationControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer,
  tester: extendedControlTesters.duration,
};
