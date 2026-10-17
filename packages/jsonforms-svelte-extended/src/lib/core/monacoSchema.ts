import type { JsonSchema } from '@jsonforms/core';
import type { json } from 'monaco-editor';

type Defaults = Pick<json.LanguageServiceDefaults, 'diagnosticsOptions' | 'setDiagnosticsOptions'>;
type Registration = NonNullable<json.DiagnosticsOptions['schemas']>[number];

const schemaMaps = new Set([
  'properties',
  'patternProperties',
  'definitions',
  '$defs',
  'dependentSchemas',
  'dependencies',
]);
const schemaChildren = new Set([
  'items',
  'prefixItems',
  'additionalItems',
  'additionalProperties',
  'unevaluatedItems',
  'unevaluatedProperties',
  'contains',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
  'allOf',
  'anyOf',
  'oneOf',
  'contentSchema',
]);

const rebaseLocalReferences = (value: unknown, rootUri: string): unknown => {
  if (Array.isArray(value)) return value.map((entry) => rebaseLocalReferences(entry, rootUri));
  if (!value || typeof value !== 'object') return value;
  // A nested resource has its own reference base. Literal values in const,
  // enum, defaults and examples are data, so never traverse them as schemas.
  if ('$id' in value && typeof value.$id === 'string' && value.$id) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      if (key === '$ref' && typeof child === 'string' && child.startsWith('#'))
        return [key, rootUri + child];
      if (schemaMaps.has(key) && child && typeof child === 'object' && !Array.isArray(child)) {
        return [
          key,
          Object.fromEntries(
            Object.entries(child).map(([name, schema]) => [
              name,
              rebaseLocalReferences(schema, rootUri),
            ]),
          ),
        ];
      }
      return [key, schemaChildren.has(key) ? rebaseLocalReferences(child, rootUri) : child];
    }),
  );
};

/** Own only these two registrations; never replace another editor's schemas or host policy. */
export function createMonacoSchemaRegistration(defaults: Defaults, modelUri: string) {
  const rootUri = `${modelUri}.jsonforms-root-schema.json`;
  const sectionUri = `${modelUri}.jsonforms-section-schema.json`;
  const owned = (entry: Registration) => entry.uri === rootUri || entry.uri === sectionUri;
  let registered = false;
  return {
    update(schema: JsonSchema, rootSchema: JsonSchema) {
      // Monaco sends these to a Worker. Nested Svelte proxies cannot be cloned
      // by postMessage, so take a plain JSON Schema snapshot at this boundary.
      const plainSchema = JSON.parse(JSON.stringify(schema)) as JsonSchema;
      const plainRoot = JSON.parse(JSON.stringify(rootSchema)) as JsonSchema;
      const section = rebaseLocalReferences(plainSchema, rootUri) as Registration['schema'];
      defaults.setDiagnosticsOptions({
        ...defaults.diagnosticsOptions,
        schemas: [
          ...(defaults.diagnosticsOptions.schemas ?? []).filter((entry) => !owned(entry)),
          { uri: rootUri, schema: { ...plainRoot, $id: rootUri } },
          { uri: sectionUri, fileMatch: [modelUri], schema: section },
        ],
      });
      registered = true;
    },
    clear() {
      if (!registered) return;
      registered = false;
      defaults.setDiagnosticsOptions({
        ...defaults.diagnosticsOptions,
        schemas: (defaults.diagnosticsOptions.schemas ?? []).filter((entry) => !owned(entry)),
      });
    },
  };
}
