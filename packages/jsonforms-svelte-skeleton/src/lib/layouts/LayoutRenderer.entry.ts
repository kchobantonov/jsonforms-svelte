import { isLayout, rankWith, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import layoutRenderer from './LayoutRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: layoutRenderer,
  tester: rankWith(1, (uischema) => uischema.type !== 'TemplateLayout' && isLayout(uischema)),
};
