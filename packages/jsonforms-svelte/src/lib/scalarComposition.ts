import { Resolve, type JsonSchema } from '@jsonforms/core';

const keywords = ['allOf', 'anyOf', 'oneOf'] as const;
const scalarTypes = new Set(['string', 'number', 'integer', 'boolean', 'null']);
const assertions = new Set([
  'type',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minLength',
  'maxLength',
  'pattern',
  '$comment',
]);

/**
 * A conservative presentation projection, never a replacement validation schema.
 * Branch assertions remain in core. Only enclosing constraints reach native inputs.
 * Choices, branch formats/annotations, custom keywords and structural schemas
 * retain their specialized or combinator renderers.
 */
export function scalarCompositionSchema(
  schema: JsonSchema,
  root: JsonSchema,
): JsonSchema | undefined {
  const composed = keywords.filter((key) => schema[key]?.length);
  if (!composed.length) return undefined;
  function resolve(part: JsonSchema, seen = new Set<JsonSchema>()): JsonSchema | undefined {
    if (!part || typeof part !== 'object' || seen.has(part)) return undefined;
    if (!part.$ref) return part;
    if (Object.keys(part).some((key) => key !== '$ref')) return undefined;
    const target = Resolve.schema(root, part.$ref, root);
    return target ? resolve(target, new Set(seen).add(part)) : undefined;
  }
  let type = typeof schema.type === 'string' ? schema.type : undefined;
  if (!type) {
    // Infer only from immediate branches. Every alternative must establish the
    // same type; an allOf needs at least one type-defining conjunct.
    const inferred: string[] = [];
    for (const keyword of composed) {
      const parts = schema[keyword]!.map((part) => resolve(part));
      if (parts.some((part) => !part)) return undefined;
      const types = parts.map((part) => part!.type);
      if (keyword !== 'allOf' && types.some((t) => typeof t !== 'string')) return undefined;
      for (const t of types) {
        if (t === undefined) continue;
        if (typeof t !== 'string') return undefined;
        inferred.push(t);
      }
    }
    if (!inferred.length || inferred.some((t) => t !== inferred[0])) return undefined;
    type = inferred[0];
  }
  if (!scalarTypes.has(type)) return undefined;
  function validationOnly(part: JsonSchema, seen = new Set<JsonSchema>()): boolean {
    const resolved = resolve(part);
    if (!resolved || seen.has(resolved)) return false;
    const next = new Set(seen).add(resolved);
    return Object.entries(resolved).every(([key, value]) => {
      if (key === 'type') return value === type;
      if (keywords.includes(key as (typeof keywords)[number])) {
        return (
          Array.isArray(value) &&
          value.length > 0 &&
          value.every((child) => validationOnly(child, next))
        );
      }
      return assertions.has(key);
    });
  }
  if (composed.some((key) => !schema[key]!.every((part) => validationOnly(part)))) return undefined;
  const projected = { ...schema, type };
  for (const keyword of keywords) delete projected[keyword];
  return projected as JsonSchema;
}
