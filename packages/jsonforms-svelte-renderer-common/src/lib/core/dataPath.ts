/** JSON Forms core paths are dot-separated; brackets are literal characters. */
export const dataPathSegments = (path: string): string[] => (path === '' ? [] : path.split('.'));
/** Determine whether the exact parent of a control is an array. */
export function hasArrayParent(data: unknown, pathSegments: readonly string[]): boolean {
  if (!pathSegments.length) return false;
  return Array.isArray(parentData(data, pathSegments));
}

export function parentData(data: unknown, pathSegments: readonly string[]) {
  return dataAtSegments(data, pathSegments.slice(0, -1));
}

export function dataAtSegments(data: unknown, pathSegments: readonly string[]) {
  return pathSegments.reduce<unknown>(
    (value, segment) =>
      value !== null && typeof value === 'object' && Object.hasOwn(value, segment)
        ? (value as Record<string, unknown>)[segment]
        : undefined,
    data,
  );
}
export function dataPathToPointer(path: string | readonly (string | number)[]): string {
  const segments = typeof path === 'string' ? dataPathSegments(path) : path;
  return segments.length
    ? '/' +
        segments
          .map((segment) => String(segment).replaceAll('~', '~0').replaceAll('/', '~1'))
          .join('/')
    : '';
}
