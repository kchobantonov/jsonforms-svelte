import {
  getControlPath,
  getCombinedErrorMessage,
  getErrorTranslator,
  getTranslator,
  type JsonFormsState,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';

export const ScalarErrorsSymbol = Symbol.for('jsonforms:scalarErrors');
export interface ScalarErrorsContext {
  readonly path: string;
}

/** Display projection only. Never mutates core errors or additionalErrors. */
export function scalarErrorMessage(
  state: JsonFormsState,
  schema: JsonSchema,
  uischema: UISchemaElement,
  path: string,
): string {
  const core = state.jsonforms.core;
  const validation = core?.validationMode === 'ValidateAndHide' ? [] : (core?.errors ?? []);
  const atPath = validation.filter((error) => getControlPath(error) === path);
  const summaries = atPath.filter(
    (error) => error.keyword === 'oneOf' || error.keyword === 'anyOf',
  );
  // Hide failed alternative details only under a failing composition. Constraints
  // beside that composition still apply independently and remain visible.
  const errors = atPath.filter(
    (error) =>
      !summaries.some(
        (summary) => error !== summary && error.schemaPath.startsWith(summary.schemaPath + '/'),
      ),
  );
  const t = getTranslator()(state);
  const te = getErrorTranslator()(state);
  const displayErrors = errors.map((error) => {
    if (error.keyword !== 'oneOf' && error.keyword !== 'anyOf') return error;
    const multiple =
      error.keyword === 'oneOf' &&
      Array.isArray(error.params.passingSchemas) &&
      error.params.passingSchemas.length > 1;
    const key = multiple ? 'composition.multipleMatches' : 'composition.noMatch';
    const fallback = multiple
      ? 'Value matches more than one permitted alternative.'
      : 'Value does not match any permitted alternative.';
    // ajv-i18n and ajv-errors may have already supplied localized/custom text.
    // Replace only AJV's stock English fallback, never an upstream translation.
    const stockMessage =
      error.keyword === 'oneOf'
        ? 'must match exactly one schema in oneOf'
        : 'must match a schema in anyOf';
    const message = error.message && error.message !== stockMessage ? error.message : fallback;
    return { ...error, message: t(key, message, { error, schema, uischema, path }) };
  });
  // Preserve host error behavior, including visibility under ValidateAndHide.
  displayErrors.push(
    ...(core?.additionalErrors ?? []).filter((error) => getControlPath(error) === path),
  );
  return getCombinedErrorMessage(displayErrors, te, t, schema, uischema, path);
}
