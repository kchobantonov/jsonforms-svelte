/** JSON Forms core paths are dot-separated; brackets are literal characters. */
export const dataPathSegments = (path: string): string[] => (path === '' ? [] : path.split('.'));
/** Determine whether the exact parent of a control is an array. */
export function hasArrayParent(data: unknown, pathSegments: readonly string[]): boolean {
  if (!pathSegments.length) return false;
  const parent = pathSegments
    .slice(0, -1)
    .reduce<unknown>(
      (value, segment) =>
        value !== null && typeof value === 'object' && Object.hasOwn(value, segment)
          ? (value as Record<string, unknown>)[segment]
          : undefined,
      data,
    );
  return Array.isArray(parent);
}
export function dataPathToPointer(path: string | readonly string[]): string {
  const segments = typeof path === 'string' ? dataPathSegments(path) : path;
  return segments.length
    ? '/' + segments.map((segment) => segment.replaceAll('~', '~0').replaceAll('/', '~1')).join('/')
    : '';
}
