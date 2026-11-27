import { untrack } from 'svelte';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import type { ValidationPopoverProps } from './validationPresentation';
import { useDynamicTreeResolver } from '../dynamic/dynamicTree.svelte.js';
import { useJsonForms, useTranslator } from '@chobantonov/jsonforms-svelte';
import { formatErrorSummary } from './errorSummary.js';
import { defaultErrorTranslator, defaultTranslator } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';

export function useErrorSummary(errors: () => readonly ErrorObject[]) {
  const form = useJsonForms(true);
  const translate = useTranslator(true);
  const resolveTree = useDynamicTreeResolver();
  const effective = $derived(form?.core?.uischema ? resolveTree(form.core.uischema) : undefined);
  const entries = $derived(
    formatErrorSummary(
      errors(),
      form?.core?.schema,
      effective,
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

export function useValidationPopover(
  props: Pick<ValidationPopoverProps, 'errors' | 'optionalContext'>,
) {
  const message = useRendererMessages(untrack(() => props.optionalContext) || undefined);
  const summary = useErrorSummary(() => props.errors);
  return { summary, message };
}
