import { scopeDataSegments } from './schemaScope';
import { type ControlElement, type UISchemaElement } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import { errorTargetSegments, errorsForSummaryIndex, summaryErrorsAt } from './errorSummary';
import { containerErrorIndex } from './containerValidation';

type Segments = readonly (string | number)[];
const boundPaths = new WeakMap<UISchemaElement, string[][]>();
const boundControls = new WeakMap<UISchemaElement, { control: ControlElement; path: string[] }[]>();
const pointer = (segments: Segments) =>
  segments.length
    ? '/' +
      segments
        .map((segment) => String(segment).replaceAll('~', '~0').replaceAll('/', '~1'))
        .join('/')
    : '';

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

export function sectionBoundControls(
  element: UISchemaElement,
): { control: ControlElement; path: string[] }[] {
  const cached = boundControls.get(element);
  if (cached) return cached;
  const result: { control: ControlElement; path: string[] }[] = [];
  const seen = new Set<UISchemaElement>();
  const walk = (node: UISchemaElement) => {
    if (seen.has(node)) return;
    seen.add(node);
    const current = node as UISchemaElement & { scope?: string; elements?: UISchemaElement[] };
    if (current.type === 'Control' && typeof current.scope === 'string') {
      result.push({ control: current as ControlElement, path: scopeDataSegments(current.scope) });
    }
    current.elements?.forEach(walk);
  };
  walk(element);
  boundControls.set(element, result);
  return result;
}

/** Return each error once, even when a section has overlapping bound controls. */
export function sectionErrors(
  core:
    | { errors?: ErrorObject[]; additionalErrors?: ErrorObject[]; validationMode?: string }
    | undefined,
  context: Segments,
  paths: readonly (readonly string[])[],
  visible?: (error: ErrorObject) => boolean,
): ErrorObject[] {
  const errors = summaryErrorsAt(core, []);
  const bound = paths.map((path) => [...context.map(String), ...path]);
  return errors.filter((error) => {
    const target = errorTargetSegments(error);
    return (
      bound.some((scope) => scope.every((part, index) => target[index] === part)) &&
      (!visible || visible(error))
    );
  });
}

/** Scope-less Group/Category indicators count errors once across overlapping controls. */
export function sectionValidation(
  core:
    | { errors?: ErrorObject[]; additionalErrors?: ErrorObject[]; validationMode?: string }
    | undefined,
  context: Segments,
  element: UISchemaElement,
  config: Record<string, unknown> | undefined,
  paths = sectionBoundPaths(element),
  visible?: (error: ErrorObject) => boolean,
): { show: boolean; count?: number } {
  const extended = config?.jsonformsExtended as Record<string, unknown> | undefined;
  const option = (name: string) => (element.options?.[name] ?? extended?.[name]) === true;
  if (!option('showValidationIndicator')) return { show: false };
  const errors =
    core?.validationMode === 'NoValidation' || core?.validationMode === 'ValidateAndHide'
      ? undefined
      : core?.errors;
  if (visible) {
    const count = sectionErrors(core, context, paths, visible).length;
    return {
      show: count > 0,
      count: option('showValidationIndicatorCount') ? count : undefined,
    };
  }
  // Share the ancestor index with other container indicators; scan only for explicit counts.
  const ancestors = containerErrorIndex(errorsForSummaryIndex(errors), core?.additionalErrors);
  if (!paths.some((path) => ancestors.has(pointer([...context, ...path])))) return { show: false };
  if (!option('showValidationIndicatorCount')) return { show: true };
  const matches = sectionErrors(core, context, paths);
  const count = matches.length;
  return { show: count > 0, count };
}
