import {
  isAllOfControl,
  isObjectControl,
  Resolve,
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import { conditionalFieldsEnabled, hasConditionalFields } from '@chobantonov/jsonforms-svelte';
import controlRenderer from './ObjectRenderer.svelte';

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: (ui, schema, context) => {
    const object = isObjectControl(ui, schema, context);
    const allOf = isAllOfControl(ui, schema, context);
    if (!object && !allOf) return -1;
    if (conditionalFieldsEnabled(ui, context.config)) {
      try {
        const scoped = Resolve.schema(schema, (ui as ControlElement).scope, context.rootSchema);
        if (
          scoped &&
          (object || scoped.type === 'object') &&
          hasConditionalFields(scoped, new Set(), context.rootSchema)
        )
          return 25;
      } catch {
        // The form-level reference diagnostic owns failed resolution.
      }
    }
    return object ? 2 : -1;
  },
};
