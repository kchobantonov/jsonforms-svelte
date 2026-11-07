import { defaultErrorTranslator, defaultTranslator } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import { useJsonForms, useTranslator } from './jsonFormsCompositions.svelte';
import { formatErrorSummary } from './errorSummary';

export function useErrorSummary(errors: () => readonly ErrorObject[]) {
  const form = useJsonForms(true);
  const translate = useTranslator(true);
  const entries = $derived(
    formatErrorSummary(
      errors(),
      form?.core?.schema,
      form?.core?.uischema,
      translate.value ?? defaultTranslator,
      form?.i18n?.translateError ?? defaultErrorTranslator,
    ),
  );
  return {
    get entries() {
      return entries;
    },
  };
}

/** Translate draft property-name schema failures without form-field paths. */
export function useNameConstraintMessage() {
  const form = useJsonForms(true);
  const translate = useTranslator(true);
  return (errors: readonly ErrorObject[] | undefined): string | undefined =>
    errors?.length
      ? formatErrorSummary(
          errors,
          undefined,
          undefined,
          translate.value ?? defaultTranslator,
          form?.i18n?.translateError ?? defaultErrorTranslator,
        )
          .map((entry) => entry.message)
          .join('\n')
      : undefined;
}
