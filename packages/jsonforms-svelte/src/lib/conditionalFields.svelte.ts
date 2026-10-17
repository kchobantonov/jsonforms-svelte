import { SvelteSet } from 'svelte/reactivity';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import {
  conditionalFieldsEnabled,
  hasConditionalFields,
  projectConditionalFields,
} from './conditionalFields';

export function useConditionalFields(
  get: () => {
    schema: JsonSchema;
    rootSchema: JsonSchema;
    data: unknown;
    uischema: UISchemaElement;
    config: unknown;
  },
) {
  const form = useJsonForms();
  const projection = $derived.by(() => {
    const input = get();
    return conditionalFieldsEnabled(input.uischema, input.config) &&
      hasConditionalFields(input.schema) &&
      form.core?.ajv
      ? projectConditionalFields(input.schema, input.rootSchema, input.data, form.core.ajv)
      : { schema: input.schema, known: new SvelteSet<string>(), diagnostics: [] as string[] };
  });
  return {
    get value() {
      return projection;
    },
  };
}
