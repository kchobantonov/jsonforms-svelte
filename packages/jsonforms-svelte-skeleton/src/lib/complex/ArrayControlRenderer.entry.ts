import {
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import controlRenderer from './ArrayControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, or(isObjectArrayControl, isPrimitiveArrayControl)),
};
