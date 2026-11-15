import { scopeDataSegments } from './schemaScope';
import { dataPathSegments } from './dataPath';
import { errorTargetSegments } from './errorSummary';
import {
  getCombinedErrorMessage,
  getErrorTranslator,
  getTranslator,
  type JsonFormsState,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';

/** Label previews report only errors that their explicit detail controls can edit. */
function labelDetailErrorSegments(
  path: string,
  detail: unknown,
  contextSegments: readonly string[] = dataPathSegments(path),
): string[][] {
  const paths = new Map<string, string[]>();
  const visited = new Set<object>();
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    const element = value as Record<string, unknown>;
    if (element.type === 'Control' && typeof element.scope === 'string') {
      const segments = [...contextSegments, ...scopeDataSegments(element.scope)];
      paths.set(JSON.stringify(segments), segments);
    }
    if (Array.isArray(element.elements)) element.elements.forEach(visit);
  };
  visit(detail);
  return [...paths.values()];
}

/** Retain the existing dotted-path API for display; it cannot identify literal dots. */
export function labelDetailErrorPaths(path: string, detail: unknown): string[] {
  return [...new Set(labelDetailErrorSegments(path, detail).map((segments) => segments.join('.')))];
}

export function labelSummaryErrorMessage(
  state: JsonFormsState,
  schema: JsonSchema,
  uischema: UISchemaElement,
  path: string,
  detail: unknown,
  contextSegments?: readonly string[],
): string {
  const paths = labelDetailErrorSegments(path, detail, contextSegments);
  const core = state.jsonforms.core;
  const errors = [
    ...(core?.validationMode === 'ValidateAndHide' || core?.validationMode === 'NoValidation'
      ? []
      : (core?.errors ?? [])),
    ...(core?.additionalErrors ?? []),
  ].filter((error) => {
    const target = errorTargetSegments(error);
    return paths.some((included) => included.every((segment, index) => target[index] === segment));
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
