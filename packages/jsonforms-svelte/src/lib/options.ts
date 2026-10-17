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
