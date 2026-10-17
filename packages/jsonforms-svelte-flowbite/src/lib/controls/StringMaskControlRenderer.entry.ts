import {
  type JsonFormsRendererRegistryEntry,
  rankWith,
  and,
  isStringControl,
} from '@jsonforms/core';
import controlRenderer from './StringMaskControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(
    2,
    and(isStringControl, (uischema) => {
      const mask = uischema.options?.mask;
      return (
        typeof mask === 'string' ||
        typeof mask === 'function' ||
        (Array.isArray(mask) && mask.every((item) => typeof item === 'string'))
      );
    }),
  ),
};
