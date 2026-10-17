import { scopeDataSegments } from './schemaScope';
import {
  composePaths,
  getCombinedErrorMessage,
  getControlPath,
  getErrorTranslator,
  getTranslator,
  type JsonFormsState,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';

/** Label previews report only errors that their explicit detail controls can edit. */
export function labelDetailErrorPaths(path: string, detail: unknown): string[] {
  const paths = new Set<string>();
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    const element = value as Record<string, unknown>;
    if (element.type === 'Control' && typeof element.scope === 'string') {
      paths.add(composePaths(path, scopeDataSegments(element.scope).join('.')));
    }
    if (Array.isArray(element.elements)) element.elements.forEach(visit);
  };
  visit(detail);
  return [...paths];
}

export function labelSummaryErrorMessage(
  state: JsonFormsState,
  schema: JsonSchema,
  uischema: UISchemaElement,
  path: string,
  detail: unknown,
): string {
  const paths = labelDetailErrorPaths(path, detail);
  const core = state.jsonforms.core;
  const errors = [
    ...(core?.validationMode === 'ValidateAndHide' ? [] : (core?.errors ?? [])),
    ...(core?.additionalErrors ?? []),
  ].filter((error) => {
    const target = getControlPath(error);
    return paths.some(
      (included) => !included || target === included || target.startsWith(included + '.'),
    );
  });
  return getCombinedErrorMessage(
    [...new Set(errors)],
    getErrorTranslator()(state),
    getTranslator()(state),
    schema,
    uischema,
    path,
  );
}
