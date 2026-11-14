const record = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;

/** Radio orientation is scoped to radio controls; the removed flat key is ignored. */
export function resolveRadioVertical(options: unknown, config: unknown): boolean {
  const local = record(options)?.vertical;
  if (typeof local === 'boolean') return local;
  const scoped = record(record(record(config)?.jsonformsExtended)?.radio)?.vertical;
  return scoped === true;
}
