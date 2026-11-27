/** Annotate copies of fixture nodes after visiting their children. */
export function annotateFixture(
  value: unknown,
  annotations: (node: Record<string, unknown>, path: string) => Record<string, unknown>,
  path = '',
): unknown {
  if (Array.isArray(value)) {
    return value.map((child, index) => annotateFixture(child, annotations, `${path}/${index}`));
  }
  if (!value || typeof value !== 'object') return value;
  const node = value as Record<string, unknown>;
  const children = Object.entries(node).map(([key, child]) => [
    key,
    annotateFixture(child, annotations, `${path}/${key}`),
  ]);
  return { ...Object.fromEntries(children), ...annotations(node, path) };
}
