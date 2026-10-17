import { isObjectControl, type JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { conditionalFieldsEnabled, hasConditionalFields } from '@chobantonov/jsonforms-svelte';
import controlRenderer from './ObjectRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: (ui, schema, context) =>
    isObjectControl(ui, schema, context)
      ? conditionalFieldsEnabled(ui, context.config) && hasConditionalFields(schema)
        ? 25
        : 2
      : -1,
};
