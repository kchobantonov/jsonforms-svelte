import {
  isObjectArrayControl,
  isPrimitiveArrayControl,
  optionIs,
  or,
  rankWith,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import controlRenderer from './ArrayControlRenderer.svelte';
const supported = or(isObjectArrayControl, isPrimitiveArrayControl);
const normal = rankWith(3, supported);
const forced = rankWith(5, or(optionIs('table', true), optionIs('format', 'table')));

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: (u, s, c) => (supported(u, s, c) ? Math.max(normal(u, s, c), forced(u, s, c)) : -1),
};
