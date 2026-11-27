export const mapKeywords = [
  'properties',
  'patternProperties',
  '$defs',
  'definitions',
  'dependentSchemas',
];
export const singleKeywords = [
  'additionalProperties',
  'additionalItems',
  'contains',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
];
export const arrayKeywords = ['allOf', 'anyOf', 'oneOf', 'prefixItems'];
export const isSchemaObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function* schemaChildren(node: Record<string, unknown>): Generator<unknown> {
  for (const key of mapKeywords) {
    const children = node[key];
    if (isSchemaObject(children)) yield* Object.values(children);
  }
  for (const key of singleKeywords) if (Object.hasOwn(node, key)) yield node[key];
  for (const key of arrayKeywords) {
    const children = node[key];
    if (Array.isArray(children)) yield* children;
  }
  if (Array.isArray(node.items)) yield* node.items;
  else if (node.items !== undefined) yield node.items;
  if (isSchemaObject(node.dependencies)) {
    for (const child of Object.values(node.dependencies)) {
      if (!Array.isArray(child)) yield child;
    }
  }
}
