import { scopeDataSegments } from './schemaScope';
import { type UISchemaElement } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import { containerErrorIndex } from './containerValidation';

type Segments = readonly (string | number)[];
const pointer = (segments: Segments) =>
  segments.length
    ? '/' +
      segments
        .map((segment) => String(segment).replaceAll('~', '~0').replaceAll('/', '~1'))
        .join('/')
    : '';

const boundPaths = new WeakMap<UISchemaElement, string[][]>();

/** Bound controls belong to the section even when their own rules hide them. */
export function sectionBoundPaths(element: UISchemaElement): string[][] {
  const cached = boundPaths.get(element);
  if (cached) return cached;
  const result: string[][] = [];
  const seen = new Set<UISchemaElement>();
  const walk = (node: UISchemaElement) => {
    if (seen.has(node)) return;
    seen.add(node);
    const current = node as UISchemaElement & { scope?: string; elements?: UISchemaElement[] };
    if (
      (current.type === 'Control' || current.type === 'ListWithDetail') &&
      typeof current.scope === 'string'
    ) {
      result.push(scopeDataSegments(current.scope));
    }
    current.elements?.forEach(walk);
  };
  walk(element);
  boundPaths.set(element, result);
  return result;
}

const errorPointer = (error: ErrorObject) => {
  const child =
    error.keyword === 'required' || error.keyword === 'dependencies'
      ? error.params.missingProperty
      : error.keyword === 'additionalProperties'
        ? error.params.additionalProperty
        : undefined;
  return (
    error.instancePath +
    (typeof child === 'string' ? '/' + child.replaceAll('~', '~0').replaceAll('/', '~1') : '')
  );
};

/** Scope-less Group/Category indicators count errors once across overlapping controls. */
export function sectionValidation(
  core:
    | { errors?: ErrorObject[]; additionalErrors?: ErrorObject[]; validationMode?: string }
    | undefined,
  context: Segments,
  element: UISchemaElement,
  config: Record<string, unknown> | undefined,
  paths = sectionBoundPaths(element),
): { show: boolean; count?: number } {
  const extended = config?.jsonformsExtended as Record<string, unknown> | undefined;
  const option = (name: string) => (element.options?.[name] ?? extended?.[name]) === true;
  if (!option('showValidationIndicator')) return { show: false };
  const errors =
    core?.validationMode === 'NoValidation' || core?.validationMode === 'ValidateAndHide'
      ? undefined
      : core?.errors;
  const index = containerErrorIndex(errors, core?.additionalErrors);
  const bound = paths.map((path) => pointer([...context, ...path]));
  if (!bound.some((path) => index.has(path))) return { show: false };
  if (!option('showValidationIndicatorCount')) return { show: true };
  const count = [...(errors ?? []), ...(core?.additionalErrors ?? [])].filter((error) => {
    const path = errorPointer(error);
    return bound.some((scope) => scope === '' || path === scope || path.startsWith(scope + '/'));
  }).length;
  return { show: count > 0, count };
}
