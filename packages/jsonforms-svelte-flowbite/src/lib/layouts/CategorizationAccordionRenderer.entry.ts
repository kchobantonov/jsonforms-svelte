import {
  and,
  categorizationHasCategory,
  isCategorization,
  optionIs,
  rankWith,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import renderer from './CategorizationAccordionRenderer.svelte';
export const entry: JsonFormsRendererRegistryEntry = {
  renderer,
  tester: rankWith(
    3,
    and(isCategorization, categorizationHasCategory, optionIs('variant', 'accordion')),
  ),
};
