import type { JsonSchema } from '@jsonforms/core';

const pointerSegments = (pointer: string): string[] => {
  const path = pointer.startsWith('#') ? pointer.slice(1) : pointer;
  if (path === '') return [];
  return (path.startsWith('/') ? path.slice(1) : path)
    .split('/')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'));
};

/** JSON Forms scope semantics, preserving every literal JSON Pointer member. */
export const scopeDataSegments = (scope: string): string[] => {
  const tokens = pointerSegments(scope);
  const result: string[] = [];
  for (let index = 0; index < tokens.length; ) {
    const keyword = tokens[index++];
    if (keyword === 'then' || keyword === 'else') continue;
    const member = tokens[index++];
    if (keyword === 'oneOf' || keyword === 'anyOf' || keyword === 'allOf') continue;
    if (member !== undefined) result.push(member);
  }
  return result;
};

/**
 * JSON Forms schema lookup with literal members and boolean schemas preserved.
 * Keep its reference-first and composition-fallback order. Its current resolver
 * skips empty/hash members and only decodes the first escaped tilde.
 */
export const resolveScopeSchema = (
  schema: JsonSchema | boolean | undefined,
  scope: string,
  rootSchema: JsonSchema,
): JsonSchema | boolean | undefined => {
  const active = new Map<object, Set<string>>();
  const resolve = (node: unknown, tokens: string[]): unknown => {
    if (node === undefined) return undefined;
    if (typeof node !== 'object' || node === null) return tokens.length ? undefined : node;
    const path = JSON.stringify(tokens);
    const visited = active.get(node) ?? new Set<string>();
    if (visited.has(path)) return undefined;
    active.set(node, visited);
    visited.add(path);
    try {
      const record = node as Record<string, unknown>;
      if (
        Object.hasOwn(record, '$ref') &&
        typeof record.$ref === 'string' &&
        record.$ref.startsWith('#')
      ) {
        const target = resolve(rootSchema, pointerSegments(record.$ref));
        if (target !== undefined) {
          const result = resolve(target, tokens);
          if (result !== undefined) return result;
        }
      }
      if (!tokens.length) return node;
      const [member, ...rest] = tokens;
      if (Object.hasOwn(record, member)) {
        const result = resolve(record[member], rest);
        if (result !== undefined) return result;
      }
      for (const keyword of ['oneOf', 'allOf', 'anyOf', 'then', 'else']) {
        if (!Object.hasOwn(record, keyword)) continue;
        const branches = Array.isArray(record[keyword]) ? record[keyword] : [record[keyword]];
        for (const branch of branches) {
          const result = resolve(branch, tokens);
          if (result !== undefined) return result;
        }
      }
      return undefined;
    } finally {
      visited.delete(path);
    }
  };
  return resolve(schema, pointerSegments(scope)) as JsonSchema | boolean | undefined;
};
