import type { JsonSchema } from '@jsonforms/core';

const mapKeywords = ['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'];
const singleKeywords = [
  'additionalProperties',
  'additionalItems',
  'contains',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
];
const arrayKeywords = ['allOf', 'anyOf', 'oneOf', 'prefixItems'];
const pointer = (path: string[]) =>
  path.length
    ? `#/${path.map((part) => part.replaceAll('~', '~0').replaceAll('/', '~1')).join('/')}`
    : '#';
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Rebase schema resources stored inside the supplied document to root pointers.
 * JSON Forms resolves pointers against one root while Ajv recognizes nested
 * Draft-07 $id scopes. Keep the two views equivalent for document-local refs.
 * Supplied external documents remain the host validator's responsibility.
 */
export function localSchemaResources(
  schema: JsonSchema,
  onUnresolvedLocalAnchor?: (reference: string) => void,
): JsonSchema {
  if (!object(schema) || typeof schema.$id !== 'string') return schema;
  let rootId: URL;
  try {
    rootId = new URL(schema.$id);
  } catch {
    return schema;
  }
  if (rootId.hash) return schema;

  const resources = new Map<string, string>([[rootId.href, '#']]);
  const anchors = new Map<string, string>();
  let hasNestedId = false;
  let hasAnchor = false;
  let unsupported = false;

  const children = (
    node: Record<string, unknown>,
    path: string[],
    visit: (child: unknown, childPath: string[]) => unknown,
  ): Record<string, unknown> => {
    const result = { ...node };
    for (const keyword of mapKeywords) {
      const value = node[keyword];
      if (!object(value)) continue;
      result[keyword] = Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, visit(child, [...path, keyword, key])]),
      );
    }
    for (const keyword of singleKeywords) {
      if (keyword in node) result[keyword] = visit(node[keyword], [...path, keyword]);
    }
    for (const keyword of arrayKeywords) {
      const value = node[keyword];
      if (Array.isArray(value))
        result[keyword] = value.map((child, index) =>
          visit(child, [...path, keyword, String(index)]),
        );
    }
    if ('items' in node) {
      result.items = Array.isArray(node.items)
        ? node.items.map((child, index) => visit(child, [...path, 'items', String(index)]))
        : visit(node.items, [...path, 'items']);
    }
    if (object(node.dependencies)) {
      result.dependencies = Object.fromEntries(
        Object.entries(node.dependencies).map(([key, child]) => [
          key,
          Array.isArray(child) ? child : visit(child, [...path, 'dependencies', key]),
        ]),
      );
    }
    return result;
  };

  const collect = (value: unknown, path: string[], base: URL): unknown => {
    if (!object(value)) return value;
    if ('$dynamicAnchor' in value || '$dynamicRef' in value) unsupported = true;
    let scope = base;
    if (path.length && typeof value.$id === 'string') {
      try {
        scope = new URL(value.$id, base);
        if (scope.hash || resources.has(scope.href)) unsupported = true;
        resources.set(scope.href, pointer(path));
        hasNestedId = true;
      } catch {
        unsupported = true;
      }
    }
    if (typeof value.$anchor === 'string') {
      const key = `${scope.href}#${value.$anchor}`;
      if (anchors.has(key)) unsupported = true;
      anchors.set(key, pointer(path));
      hasAnchor = true;
    }
    return children(value, path, (child, childPath) => collect(child, childPath, scope));
  };
  collect(schema, [], rootId);
  if (unsupported || (!hasNestedId && !hasAnchor && !onUnresolvedLocalAnchor)) return schema;

  let needsRebase = false;
  const inspect = (value: unknown, path: string[], base: URL): unknown => {
    if (!object(value)) return value;
    const scope = path.length && typeof value.$id === 'string' ? new URL(value.$id, base) : base;
    if (typeof value.$ref === 'string') {
      try {
        const target = new URL(value.$ref, scope);
        const full = target.href;
        const fragment = target.hash;
        target.hash = '';
        if (
          resources.has(target.href) &&
          fragment !== '' &&
          fragment !== '#' &&
          !fragment.startsWith('#/') &&
          !anchors.has(full)
        )
          onUnresolvedLocalAnchor?.(full);
        if (
          anchors.has(full) ||
          (resources.has(target.href) &&
            (scope.href !== rootId.href || target.href !== rootId.href))
        )
          needsRebase = true;
      } catch {
        // Invalid references retain the original schema for validator diagnostics.
      }
    }
    return children(value, path, (child, childPath) => inspect(child, childPath, scope));
  };
  inspect(schema, [], rootId);
  if (!needsRebase) return schema;

  const rebase = (value: unknown, path: string[], base: URL): unknown => {
    if (!object(value)) return value;
    const scope = path.length && typeof value.$id === 'string' ? new URL(value.$id, base) : base;
    const result = children(value, path, (child, childPath) => rebase(child, childPath, scope));
    if (path.length) delete result.$id;
    if (path.length) delete result.$anchor;
    if (typeof value.$ref === 'string') {
      try {
        const target = new URL(value.$ref, scope);
        const anchor = anchors.get(target.href);
        const fragment = target.hash;
        target.hash = '';
        const local = resources.get(target.href);
        if (anchor) result.$ref = anchor;
        else if (local && (fragment === '' || fragment === '#' || fragment.startsWith('#/')))
          result.$ref = `${local}${fragment.startsWith('#/') ? fragment.slice(1) : ''}`;
        else if (path.length) result.$ref = new URL(value.$ref, scope).href;
      } catch {
        // Leave malformed references to the validator's diagnostic path.
      }
    }
    return result;
  };
  return rebase(schema, [], rootId) as JsonSchema;
}
