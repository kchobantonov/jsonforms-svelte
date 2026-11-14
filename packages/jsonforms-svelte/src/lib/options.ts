import cloneDeep from 'lodash/cloneDeep';
import mergeWith from 'lodash/mergeWith';

/** Local arrays and native editor option bags replace global values as units. */
export function mergeRendererOptions<T extends Record<string, unknown> = Record<string, unknown>>(
  ...sources: unknown[]
): T {
  return mergeWith(
    {},
    ...sources.map((source) => cloneDeep(source)),
    (_previous: unknown, next: unknown, key: string) => {
      if (Array.isArray(next) || key === 'monaco' || key === 'agGridOptions')
        return cloneDeep(next);
      return undefined;
    },
  ) as T;
}

/** Spec §15: explicit local boolean, then authored global boolean, then true.
 * Call with useAuthoredConfig().value, not the reducer's injected defaults.
 */
export function resolveRestrict(
  options: { restrict?: unknown } | undefined,
  authoredConfig: Record<string, unknown> | undefined,
): boolean {
  if (typeof options?.restrict === 'boolean') return options.restrict;
  if (typeof authoredConfig?.restrict === 'boolean') return authoredConfig.restrict;
  return true;
}
