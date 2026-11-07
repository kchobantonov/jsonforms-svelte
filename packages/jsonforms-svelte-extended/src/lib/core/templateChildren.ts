import type { UISchemaElement } from '@jsonforms/core';
import type { NamedUISchemaElement } from './types';

const cache = new WeakMap<
  UISchemaElement[],
  { elements: NamedUISchemaElement[]; duplicateNames: string[] }
>();

/** Explicit names reserve their slots before unnamed children receive decimal names. */
export function templateChildren(children: UISchemaElement[]) {
  const cached = cache.get(children);
  if (cached) return cached;
  const explicit = (element: UISchemaElement) => (element as { name?: unknown }).name;
  const reserved = new Set(
    children.map(explicit).filter((name): name is string => typeof name === 'string'),
  );
  const used = new Set<string>();
  const duplicateNames: string[] = [];
  const elements: NamedUISchemaElement[] = [];
  children.forEach((element, index) => {
    const declared = explicit(element);
    let name: string;
    if (typeof declared === 'string') {
      name = declared;
      if (used.has(name)) {
        duplicateNames.push(name);
        return;
      }
    } else {
      let candidate = index;
      while (reserved.has(String(candidate)) || used.has(String(candidate))) candidate += 1;
      name = String(candidate);
    }
    used.add(name);
    elements.push({ ...element, name });
  });
  const result = { elements, duplicateNames };
  cache.set(children, result);
  return result;
}
