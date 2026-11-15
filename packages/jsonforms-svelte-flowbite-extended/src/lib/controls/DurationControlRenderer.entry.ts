import {
  and,
  formatIs,
  isStringControl,
  optionIs,
  or,
  rankWith,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import controlRenderer from './DurationControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(
    3,
    and(isStringControl, or(formatIs('duration'), optionIs('format', 'duration'))),
  ),
};
