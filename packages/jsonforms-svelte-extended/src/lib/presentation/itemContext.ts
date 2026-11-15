import { dataPathSegments } from '@chobantonov/jsonforms-svelte';

/** Find the nearest array item on the renderer's data path without following prototypes. */
export function nearestArrayItem(data: unknown, path: string | readonly string[]): unknown {
  let current = data;
  let item: unknown;
  for (const segment of typeof path === 'string' ? dataPathSegments(path) : path) {
    if (current === null || typeof current !== 'object' || !Object.hasOwn(current, segment))
      return undefined;
    const child = (current as Record<string, unknown>)[segment];
    if (Array.isArray(current) && /^(0|[1-9]\d*)$/.test(segment)) item = child;
    current = child;
  }
  return item;
}
