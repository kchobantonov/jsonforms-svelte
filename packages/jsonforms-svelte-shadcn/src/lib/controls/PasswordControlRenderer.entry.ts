import {
  type JsonFormsRendererRegistryEntry,
  rankWith,
  and,
  isStringControl,
  formatIs,
  optionIs,
  or,
} from '@jsonforms/core';
import controlRenderer from './PasswordControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(
    4,
    and(isStringControl, or(formatIs('password'), optionIs('format', 'password'))),
  ),
};
