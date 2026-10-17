import {
  getCombinedErrorMessage,
  getControlPath,
  type ControlElement,
  type ErrorTranslator,
  type JsonFormsCore,
  type JsonSchema,
  type Translator,
} from '@jsonforms/core';

export interface PreTouchErrorsInput {
  touched: boolean;
  errors: string;
  options: Record<string, unknown>;
  core: Pick<JsonFormsCore, 'errors' | 'additionalErrors' | 'validationMode'> | undefined;
  path: string;
  schema: JsonSchema;
  uischema: ControlElement;
  translate: Translator;
  translateError: ErrorTranslator;
}

/** Filter displayed control text only; structured errors and validity stay unchanged. */
export function filterErrorsBeforeTouch({
  touched,
  errors,
  options,
  core,
  path,
  schema,
  uischema,
  translate,
  translateError,
}: PreTouchErrorsInput): string {
  if (touched || !errors || options.enableFilterErrorsBeforeTouch !== true) return errors;
  const keywords = options.filterErrorKeywordsBeforeTouch;
  if (!Array.isArray(keywords) || keywords.length === 0) return '';
  const schemaErrors =
    core?.validationMode === 'ValidateAndHide' || core?.validationMode === 'NoValidation'
      ? []
      : (core?.errors ?? []);
  const atControl = [...schemaErrors, ...(core?.additionalErrors ?? [])].filter(
    (error) => getControlPath(error) === path,
  );
  const visible = atControl.filter((error) => !keywords.includes(error.keyword));
  if (visible.length === atControl.length) return errors;
  return getCombinedErrorMessage(visible, translateError, translate, schema, uischema, path);
}
