import { SvelteSet } from 'svelte/reactivity';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import { useUIDiagnosticReporter } from './authorDiagnostic.svelte';
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
  const reportDiagnostic = useUIDiagnosticReporter();
  const projection = $derived.by(() => {
    const input = get();
    return conditionalFieldsEnabled(input.uischema, input.config) &&
      hasConditionalFields(input.schema, new Set(), input.rootSchema) &&
      form.core?.ajv
      ? projectConditionalFields(input.schema, input.rootSchema, input.data, form.core.ajv)
      : { schema: input.schema, known: new SvelteSet<string>(), diagnostics: [] as string[] };
  });
  let reported = new Set<string>();
  $effect(() => {
    const path = get().path ?? '';
    const active = new Set<string>();
    for (const code of projection.diagnostics) {
      const key = JSON.stringify([path, code]);
      active.add(key);
      if (reported.has(key)) continue;
      reported.add(key);
      reportDiagnostic(code, {
        severity: 'warning',
        message:
          code === 'conditional.referenceFailed'
            ? 'A conditional field reference could not be resolved.'
            : 'Conditional field evaluation failed.',
        path,
      });
    }
    reported = active;
  });
  return {
    get value() {
      return projection;
    },
  };
}
