/** JSON Forms core paths are dot-separated; brackets are literal characters. */
export const dataPathSegments = (path: string): string[] => (path === '' ? [] : path.split('.'));
export function dataPathToPointer(path: string): string {
  const segments = dataPathSegments(path);
  return segments.length
    ? '/' + segments.map((segment) => segment.replaceAll('~', '~0').replaceAll('/', '~1')).join('/')
    : '';
}
