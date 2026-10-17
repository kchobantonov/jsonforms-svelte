import type { ErrorObject } from 'ajv';
import type { UISchemaElement } from '@jsonforms/core';

const empty: ErrorObject[] = [];
const indices = new WeakMap<ErrorObject[], WeakMap<ErrorObject[], Map<string, number>>>();
const pointer = (segments: readonly (string | number)[]) =>
  segments.length
    ? '/' +
      segments
        .map((segment) => String(segment).replaceAll('~', '~0').replaceAll('/', '~1'))
        .join('/')
    : '';

/** Count validator errors at each ancestor, retaining literal JSON Pointer segments. */
export function containerErrorIndex(
  errors: ErrorObject[] = empty,
  additional: ErrorObject[] = empty,
): Map<string, number> {
  let secondary = indices.get(errors);
  if (!secondary) indices.set(errors, (secondary = new WeakMap()));
  const cached = secondary.get(additional);
  if (cached) return cached;
  const result = new Map<string, number>();
  for (const error of [...errors, ...additional]) {
    const segments = error.instancePath
      ? error.instancePath
          .slice(1)
          .split('/')
          .map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'))
      : [];
    const child =
      error.keyword === 'required' || error.keyword === 'dependencies'
        ? error.params.missingProperty
        : error.keyword === 'additionalProperties'
          ? error.params.additionalProperty
          : undefined;
    if (typeof child === 'string') segments.push(child);
    for (let length = 0; length <= segments.length; length++) {
      const key = pointer(segments.slice(0, length));
      result.set(key, (result.get(key) ?? 0) + 1);
    }
  }
  secondary.set(additional, result);
  return result;
}

export function containerValidation(
  core:
    | { errors?: ErrorObject[]; additionalErrors?: ErrorObject[]; validationMode?: string }
    | undefined,
  segments: readonly (string | number)[],
  ui: UISchemaElement,
  config: Record<string, unknown> | undefined,
  fallback = false,
): { show: boolean; count?: number } {
  const extended = config?.jsonformsExtended as Record<string, unknown> | undefined;
  const option = (name: string, defaultValue: boolean) =>
    (ui.options?.[name] ?? extended?.[name] ?? defaultValue) === true;
  if (!option('showValidationIndicator', fallback)) return { show: false };
  const errors =
    core?.validationMode === 'NoValidation' || core?.validationMode === 'ValidateAndHide'
      ? undefined
      : core?.errors;
  const count = containerErrorIndex(errors, core?.additionalErrors).get(pointer(segments)) ?? 0;
  return {
    show: count > 0,
    count: option('showValidationIndicatorCount', false) ? count : undefined,
  };
}
