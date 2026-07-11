import {
  and,
  categorizationHasCategory,
  isCategorization,
  optionIs,
  rankWith,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import layoutRenderer from './CategorizationStepperRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: layoutRenderer,
  tester: rankWith(
    3,
    and(isCategorization, categorizationHasCategory, optionIs('variant', 'stepper')),
  ),
};
