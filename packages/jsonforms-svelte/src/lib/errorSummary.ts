import {
  defaultErrorTranslator,
  getCombinedErrorMessage,
  getI18nKey,
  type JsonSchema,
  type Translator,
  type UISchemaElement,
} from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import { resolveScopeSchema } from './schemaScope';

export interface ErrorSummaryEntry {
  path: string;
  message: string;
}

/** Drop provisional item failures emitted while a failing contains searches for a match. */
export function withoutContainsCandidateErrors(errors: readonly ErrorObject[]): ErrorObject[] {
  const containsErrors = errors.filter((error) => error.keyword === 'contains');
  if (containsErrors.length === 0) return [...errors];
  return errors.filter(
    (error) =>
      !containsErrors.some(
        (container) =>
          error.schemaPath.startsWith(`${container.schemaPath}/`) &&
          error.instancePath.startsWith(`${container.instancePath}/`),
      ),
  );
}

/** Preserve literal pointer members and route errors addressed to an object's child. */
export function errorTargetSegments(error: ErrorObject): string[] {
  const segments =
    error.instancePath === ''
      ? []
      : error.instancePath
          .slice(1)
          .split('/')
          .map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'));
  const child =
    'propertyName' in error
      ? error.propertyName
      : error.keyword === 'propertyNames'
        ? error.params.propertyName
        : error.keyword === 'required' || error.keyword === 'dependencies'
          ? error.params.missingProperty
          : error.keyword === 'additionalProperties'
            ? error.params.additionalProperty
            : undefined;
  if (typeof child === 'string') segments.push(child);
  return segments;
}

/** One entry per validator error: equal text or schema paths do not merge distinct rows. */
export function formatErrorSummary(
  errors: readonly ErrorObject[],
  rootSchema: JsonSchema | undefined,
  rootUiSchema: UISchemaElement | undefined,
  translate: Translator,
  translateError = defaultErrorTranslator,
): ErrorSummaryEntry[] {
  const controls = new Map<string, UISchemaElement>();
  const visited = new Set<object>();
  const visit = (element: unknown) => {
    if (!element || typeof element !== 'object' || visited.has(element)) return;
    visited.add(element);
    const node = element as UISchemaElement & { scope?: string; elements?: unknown[] };
    if (node.type === 'Control' && typeof node.scope === 'string') controls.set(node.scope, node);
    if (Array.isArray(node.elements)) node.elements.forEach(visit);
  };
  visit(rootUiSchema);
  const escape = (part: string) => part.replaceAll('~', '~0').replaceAll('/', '~1');
  return errors.map((error) => {
    let schema: JsonSchema | undefined = rootSchema;
    let scope = '#';
    const labels: string[] = [];
    const parts = errorTargetSegments(error);
    for (let index = 0; index < parts.length; index++) {
      const segment = parts[index];
      if (schema && rootSchema) {
        const resolved = resolveScopeSchema(schema, '#', rootSchema);
        schema = typeof resolved === 'object' ? resolved : undefined;
      }
      const prefix = parts.slice(0, index + 1).join('.');
      if (schema?.items !== undefined && /^\d+$/.test(segment)) {
        const tuple = Array.isArray(schema.items);
        const item = Array.isArray(schema.items)
          ? (schema.items[Number(segment)] ?? schema.additionalItems)
          : schema.items;
        schema = typeof item === 'object' ? item : undefined;
        scope += tuple ? '/items/' + segment : '/items';
        labels.push(String(Number(segment) + 1));
      } else {
        const properties = schema?.properties;
        schema =
          properties && Object.hasOwn(properties, segment)
            ? properties[segment]
            : typeof schema?.additionalProperties === 'object'
              ? schema.additionalProperties
              : undefined;
        scope += '/properties/' + escape(segment);
        const control = controls.get(scope);
        const label =
          control && 'label' in control && typeof control.label === 'string'
            ? control.label
            : (schema?.title ?? (segment || '""'));
        labels.push(translate(getI18nKey(schema, control, prefix, 'label'), label) ?? label);
      }
    }
    return {
      path: labels.join(' / '),
      message: getCombinedErrorMessage(
        [error],
        translateError,
        translate,
        schema,
        controls.get(scope),
        parts.join('.'),
      ),
    };
  });
}

/** Eligible structured errors at a target and descendants; root includes every target. */
export function summaryErrorsAt(
  core:
    | { errors?: ErrorObject[]; additionalErrors?: ErrorObject[]; validationMode?: string }
    | undefined,
  segments: readonly string[],
): ErrorObject[] {
  const schemaErrors =
    core?.validationMode === 'NoValidation' || core?.validationMode === 'ValidateAndHide'
      ? []
      : (core?.errors ?? []);
  const primary = withoutContainsCandidateErrors(schemaErrors);
  return [...primary, ...(core?.additionalErrors ?? [])].filter((error) => {
    const target = errorTargetSegments(error);
    return segments.every((part, index) => target[index] === part);
  });
}
