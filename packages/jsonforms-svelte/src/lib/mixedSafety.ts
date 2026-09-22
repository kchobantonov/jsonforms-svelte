import { Resolve, type JsonSchema } from '@jsonforms/core';

/** These keys cannot be represented unambiguously by the current dot-path dispatch. */
export const isUnsupportedMixedKey = (key: string): boolean => key === '' || /[.\u0000]/.test(key);

export function hasUnsupportedMixedKeys(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasUnsupportedMixedKeys);
  return Object.entries(value).some(
    ([key, child]) => isUnsupportedMixedKey(key) || hasUnsupportedMixedKeys(child),
  );
}

/** Evaluate readonly along the actual path, including refs and matching property schemas. */
export function mixedPathIsReadOnly(
  schema: JsonSchema,
  root: JsonSchema,
  data: any,
  segments: string[],
): boolean {
  function expand(s: JsonSchema, seen = new Set<JsonSchema>()): JsonSchema[] {
    if (!s || typeof s !== 'object' || seen.has(s)) return [];
    seen.add(s);
    const resolved = s.$ref ? Resolve.schema(root, s.$ref, root) : undefined;
    return [
      s,
      ...(resolved ? expand(resolved, seen) : []),
      ...(s.allOf ?? []).flatMap((part) => expand(part, seen)),
    ];
  }
  let candidates = expand(schema);
  for (let index = 0; ; index++) {
    if (candidates.some((s) => (s as JsonSchema & { readOnly?: boolean }).readOnly === true))
      return true;
    if (index === segments.length) return false;
    const key = segments[index];
    candidates = candidates.flatMap((s) => {
      if (Array.isArray(data)) {
        const prefix = (s as JsonSchema & { prefixItems?: JsonSchema[] }).prefixItems;
        const item = prefix
          ? (prefix[Number(key)] ?? s.items)
          : Array.isArray(s.items)
            ? (s.items[Number(key)] ?? s.additionalItems)
            : s.items;
        return typeof item === 'object' && !Array.isArray(item) ? expand(item) : [];
      }
      const matched: JsonSchema[] = [];
      if (s.properties?.[key]) matched.push(s.properties[key]);
      for (const [pattern, child] of Object.entries(s.patternProperties ?? {}))
        if (new RegExp(pattern).test(key)) matched.push(child);
      if (!matched.length && typeof s.additionalProperties === 'object')
        matched.push(s.additionalProperties);
      return matched.flatMap((child) => expand(child));
    });
    data = data != null && Object.prototype.hasOwnProperty.call(data, key) ? data[key] : undefined;
  }
}
