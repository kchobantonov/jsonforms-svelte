import {
  type JsonFormsRendererRegistryEntry,
  rankWith,
  and,
  isStringControl,
  formatIs,
  schemaMatches,
} from '@jsonforms/core';
import controlRenderer from './StringMaskControlRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(
    2,
    and(isStringControl, (uischema, schema, context) => {
      // Format-specific editors own these values even when a mask is also configured.
      if (
        ['date', 'time', 'date-time', 'color', 'password', 'duration', 'byte', 'binary'].some(
          (format) => formatIs(format)(uischema, schema, context),
        ) ||
        schemaMatches(
          (candidate) =>
            candidate.type === 'string' &&
            'contentEncoding' in candidate &&
            candidate.contentEncoding === 'base64',
        )(uischema, schema, context) ||
        uischema.options?.format === 'password'
      ) {
        return false;
      }
      const mask = uischema.options?.mask;
      return (
        typeof mask === 'string' ||
        typeof mask === 'function' ||
        (Array.isArray(mask) && mask.every((item) => typeof item === 'string'))
      );
    }),
  ),
};
