import {
  and,
  formatIs,
  isStringControl,
  optionIs,
  or,
  rankWith,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import controlRenderer from './ColorControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, and(isStringControl, or(formatIs('color'), optionIs('format', 'color')))),
};
