import { useJsonForms, useOverrideControl } from '@chobantonov/jsonforms-svelte';
import {
  Resolve,
  composePaths,
  defaultJsonFormsI18nState,
  getArrayTranslations,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import { collectionItemChoiceLabel, collectionItemDefaultLabelPath } from './collectionItemLabel';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import { rendererArrayDefaults } from '../locale/arrayTranslations';

export interface ArrayPresentationControl {
  label: string;
  required: boolean;
  config: unknown;
  uischema: UISchemaElement;
  schema: JsonSchema;
  rootSchema?: JsonSchema;
  path: string;
  data: unknown;
  childErrors: ErrorObject[];
  i18nKeyPrefix: string;
}

export function useArrayPresentation<I extends { control: ArrayPresentationControl }>(input: I) {
  const childLabelForIndex = (index: number | null) => {
    if (index === null) {
      return '';
    }
    const itemLabelPath =
      input.control.uischema.options?.elementLabelProp ??
      collectionItemDefaultLabelPath(input.control.schema, input.control.rootSchema);
    if (!itemLabelPath) {
      return '';
    }
    const labelValue = Resolve.data(input.control.data, composePaths(`${index}`, itemLabelPath));
    if (labelValue === undefined || labelValue === null || Number.isNaN(labelValue)) {
      return '';
    }
    const choiceLabel = collectionItemChoiceLabel(
      input.control.schema,
      itemLabelPath,
      labelValue,
      input.control.rootSchema,
      jsonforms.i18n?.translate,
      composePaths(composePaths(input.control.path, `${index}`), itemLabelPath),
    );
    return choiceLabel ?? `${labelValue}`;
  };
  // Summaries do not share child touch state yet. Preserve eligible errors instead of
  // suppressing matching keywords permanently after a child has been blurred.
  const jsonforms = useJsonForms();
  const arrayMessage = useRendererMessages();
  const translations = $derived(
    getArrayTranslations(
      jsonforms?.i18n?.translate ?? defaultJsonFormsI18nState.translate,
      rendererArrayDefaults(arrayMessage),
      input.control.i18nKeyPrefix,
      input.control.label,
    ),
  );

  const overriddenInput = useOverrideControl(input, {
    get childErrors() {
      return input.control.childErrors;
    },
    get translations() {
      return translations;
    },
  });

  return { childLabelForIndex, overriddenInput };
}
