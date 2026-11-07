import type { JsonSchema } from '@jsonforms/core';
import type Ajv from 'ajv';
import { localSchemaResources } from './localSchemaResources';

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const maps = ['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'];
const singles = [
  'additionalProperties',
  'additionalItems',
  'contains',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
];
const arrays = ['allOf', 'anyOf', 'oneOf', 'prefixItems'];
const anonymousPresentationId = 'https://jsonforms.invalid/__presentation_root__.json';

function pointerExists(document: unknown, fragment: string): boolean {
  if (!fragment || fragment === '#') return true;
  let pointer: string;
  try {
    pointer = decodeURIComponent(fragment.slice(1));
  } catch {
    return false;
  }
  if (!pointer.startsWith('/')) return true; // Named anchors are checked by localSchemaResources.
  let value = document;
  for (const token of pointer.slice(1).split('/')) {
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    if ((typeof value !== 'object' || value === null) && !Array.isArray(value)) return false;
    if (!Object.hasOwn(value, key)) return false;
    value = (value as Record<string, unknown>)[key];
  }
  return true;
}

function walkSchema(
  value: unknown,
  base: URL,
  visit: (node: Record<string, unknown>, scope: URL) => void,
  seen = new WeakSet<object>(),
): void {
  if (!object(value) || seen.has(value)) return;
  seen.add(value);
  let scope = base;
  if (typeof value.$id === 'string') {
    try {
      scope = new URL(value.$id, base);
    } catch {
      return;
    }
  }
  visit(value, scope);
  for (const key of maps) {
    if (object(value[key]))
      for (const child of Object.values(value[key])) walkSchema(child, scope, visit, seen);
  }
  for (const key of singles) walkSchema(value[key], scope, visit, seen);
  for (const key of arrays) {
    if (Array.isArray(value[key]))
      for (const child of value[key]) walkSchema(child, scope, visit, seen);
  }
  if (Array.isArray(value.items)) {
    for (const child of value.items) walkSchema(child, scope, visit, seen);
  } else walkSchema(value.items, scope, visit, seen);
  if (object(value.dependencies))
    for (const child of Object.values(value.dependencies))
      if (!Array.isArray(child)) walkSchema(child, scope, visit, seen);
}

/** Presentation-only copy of documents already registered with the host Ajv.
 * The original schema remains in the validation core, retaining Ajv's error
 * paths, custom options and supplied resource registrations. No URL is fetched. */
export function suppliedSchemaResources(
  schema: JsonSchema,
  ajv: Ajv,
  onUnresolvedExternalReference?: (reference: string) => void,
): JsonSchema {
  if (!object(schema)) return schema;
  if (schema.$id !== undefined && typeof schema.$id !== 'string') return schema;
  const rootIdValue = typeof schema.$id === 'string' ? schema.$id : anonymousPresentationId;
  const rootSchema = schema.$id ? schema : { ...schema, $id: rootIdValue };
  let rootId: URL;
  try {
    rootId = new URL(rootIdValue);
  } catch {
    return schema;
  }
  if (rootId.hash) return schema;

  const known = new Set<string>();
  const documents = new Map<string, JsonSchema>();
  const pending: Array<{ schema: JsonSchema; base: URL }> = [{ schema: rootSchema, base: rootId }];
  while (pending.length) {
    const current = pending.shift()!;
    walkSchema(current.schema, current.base, (_node, scope) => {
      if (!scope.hash) known.add(scope.href);
    });
    walkSchema(current.schema, current.base, (node, scope) => {
      if (typeof node.$ref !== 'string') return;
      if (
        !schema.$id &&
        scope.href === anonymousPresentationId &&
        node.$ref !== '' &&
        !node.$ref.startsWith('#')
      ) {
        try {
          new URL(node.$ref);
        } catch {
          onUnresolvedExternalReference?.(node.$ref);
          return;
        }
      }
      let target: URL;
      try {
        target = new URL(node.$ref, scope);
      } catch {
        return;
      }
      const resolvedReference = target.href;
      const fragment = target.hash;
      target.hash = '';
      const existing = documents.get(target.href);
      if (existing) {
        if (!pointerExists(existing, fragment)) onUnresolvedExternalReference?.(resolvedReference);
        return;
      }
      if (known.has(target.href)) return;
      let supplied: unknown;
      try {
        supplied = ajv.getSchema(target.href)?.schema;
      } catch (error) {
        const missing =
          typeof error === 'object' && error !== null && 'missingRef' in error
            ? error.missingRef
            : undefined;
        if (typeof missing === 'string') onUnresolvedExternalReference?.(missing);
        else throw error;
        return;
      }
      if (supplied === undefined) {
        onUnresolvedExternalReference?.(resolvedReference);
        return;
      }
      const document =
        typeof supplied === 'boolean'
          ? ({ $id: target.href, ...(supplied ? {} : { not: {} }) } as JsonSchema)
          : object(supplied)
            ? ({ ...supplied, $id: target.href } as JsonSchema)
            : undefined;
      if (!document) return;
      if (!pointerExists(document, fragment)) onUnresolvedExternalReference?.(resolvedReference);
      documents.set(target.href, document);
      pending.push({ schema: document, base: target });
    });
  }
  const embedded = new Set<string>();
  for (const [documentUri, document] of documents)
    walkSchema(document, new URL(documentUri), (_node, scope) => {
      if (scope.href !== documentUri && documents.has(scope.href)) embedded.add(scope.href);
    });
  for (const documentUri of embedded) documents.delete(documentUri);
  if (!documents.size) return schema;

  const definitions = object(rootSchema.definitions) ? rootSchema.definitions : {};
  const suppliedDefinitions: Record<string, JsonSchema> = {};
  for (const [index, document] of [...documents.values()].entries()) {
    let name = `__jsonforms_external_${index}`;
    for (let collision = 1; Object.hasOwn(definitions, name); collision++)
      name = `__jsonforms_external_${index}_${collision}`;
    suppliedDefinitions[name] = document;
  }
  const bundle = {
    ...rootSchema,
    definitions: {
      ...definitions,
      ...suppliedDefinitions,
    },
  } as JsonSchema;
  const resolved = localSchemaResources(bundle, onUnresolvedExternalReference);
  if (resolved === bundle) return schema;
  const presentation = { ...resolved } as Record<string, unknown>;
  delete presentation.$id;
  return presentation as JsonSchema;
}
