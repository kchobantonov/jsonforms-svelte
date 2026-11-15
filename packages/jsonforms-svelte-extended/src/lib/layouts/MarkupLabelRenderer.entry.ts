import { and, rankWith, uiTypeIs, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { wantsMarkup } from '../presentation/markup';
import renderer from './MarkupLabelRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer,
  tester: rankWith(
    3,
    and(uiTypeIs('Label'), (uischema) => wantsMarkup(uischema.options)),
  ),
};
