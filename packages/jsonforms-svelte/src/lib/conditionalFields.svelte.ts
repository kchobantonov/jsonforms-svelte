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
    path?: string;
  },
) {
  const form = useJsonForms();
  const projection = $derived.by(() => {
    const input = get();
    return conditionalFieldsEnabled(input.uischema, input.config) &&
      hasConditionalFields(input.schema, new Set(), input.rootSchema) &&
      form.core?.ajv
      ? projectConditionalFields(input.schema, input.rootSchema, input.data, form.core.ajv)
      : { schema: input.schema, known: new SvelteSet<string>(), diagnostics: [] as string[] };
  });
  const reported = new Set<string>();
  $effect(() => {
    const path = get().path ?? '';
    for (const code of projection.diagnostics) {
      const key = `${path}:${code}`;
      if (reported.has(key)) continue;
      reported.add(key);
      console.warn(code, { path });
    }
  });
  return {
    get value() {
      return projection;
    },
  };
}
