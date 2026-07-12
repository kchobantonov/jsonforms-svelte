import {
  isObjectArrayControl,
  isPrimitiveArrayControl,
  optionIs,
  or,
  rankWith,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import controlRenderer from './ArrayControlRenderer.svelte';

const supportedArray = or(isObjectArrayControl, isPrimitiveArrayControl);
const defaultTester = rankWith(3, supportedArray);
const forcedTableTester = rankWith(5, or(optionIs('table', true), optionIs('format', 'table')));

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: (uischema, schema, context) =>
    supportedArray(uischema, schema, context)
      ? Math.max(
          defaultTester(uischema, schema, context),
          forcedTableTester(uischema, schema, context),
        )
      : -1,
};
