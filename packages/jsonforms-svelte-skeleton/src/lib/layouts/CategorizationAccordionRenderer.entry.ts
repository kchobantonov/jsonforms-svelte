import {
  and,
  isCategorization,
  optionIs,
  rankWith,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import renderer from './CategorizationAccordionRenderer.svelte';
export const entry: JsonFormsRendererRegistryEntry = {
  renderer,
  tester: rankWith(3, and(isCategorization, optionIs('variant', 'accordion'))),
};
