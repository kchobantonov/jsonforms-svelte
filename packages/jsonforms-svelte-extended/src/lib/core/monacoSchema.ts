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

const pointerChild = (pointer: string, key: string) =>
  `${pointer}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`;

const resolvedUri = (reference: string, base: string) => {
  try {
    return new URL(reference, base).href;
  } catch {
    return undefined;
  }
};

const collectNestedResources = (
  value: unknown,
  documentUri: string,
  baseUri: string,
  resources: Map<string, string>,
  anchors: Map<string, string>,
  pointer = '',
): void => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectNestedResources(
        entry,
        documentUri,
        baseUri,
        resources,
        anchors,
        pointerChild(pointer, String(index)),
      ),
    );
    return;
  }
  if (!value || typeof value !== 'object') return;
  const scope =
    pointer && '$id' in value && typeof value.$id === 'string'
      ? (resolvedUri(value.$id, baseUri) ?? baseUri)
      : baseUri;
  if (pointer && scope !== baseUri) resources.set(scope, `${documentUri}#${pointer}`);
  if ('$anchor' in value && typeof value.$anchor === 'string') {
    const anchorUri = resolvedUri(`#${value.$anchor}`, scope);
    if (anchorUri) anchors.set(anchorUri, pointer ? `${documentUri}#${pointer}` : documentUri);
  }
  for (const [key, child] of Object.entries(value)) {
    if (schemaMaps.has(key) && child && typeof child === 'object' && !Array.isArray(child)) {
      for (const [name, schema] of Object.entries(child))
        collectNestedResources(
          schema,
          documentUri,
          scope,
          resources,
          anchors,
          pointerChild(pointerChild(pointer, key), name),
        );
    } else if (schemaChildren.has(key)) {
      collectNestedResources(
        child,
        documentUri,
        scope,
        resources,
        anchors,
        pointerChild(pointer, key),
      );
    }
  }
};

const rebaseLocalReferences = (
  value: unknown,
  documentUri: string,
  rootUri: string,
  resources: Map<string, string>,
  anchors: Map<string, string>,
  scopeUri: string,
  pointer = '',
  inheritedBase = rootUri,
): unknown => {
  if (Array.isArray(value))
    return value.map((entry, index) =>
      rebaseLocalReferences(
        entry,
        documentUri,
        rootUri,
        resources,
        anchors,
        scopeUri,
        pointerChild(pointer, String(index)),
        inheritedBase,
      ),
    );
  if (!value || typeof value !== 'object') return value;
  // Monaco's JSON worker does not register nested $id resources separately.
  // Point their local references at the actual nested schema location.
  const base =
    pointer && '$id' in value && typeof value.$id === 'string' && value.$id
      ? `${documentUri}#${pointer}`
      : inheritedBase;
  const scope =
    pointer && '$id' in value && typeof value.$id === 'string'
      ? (resolvedUri(value.$id, scopeUri) ?? scopeUri)
      : scopeUri;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      if (key === '$ref' && typeof child === 'string') {
        const absolute = resolvedUri(child, scope);
        if (absolute) {
          const anchor = anchors.get(absolute);
          if (anchor) return [key, anchor];
          const target = new URL(absolute);
          const fragment = target.hash;
          target.hash = '';
          const resource = resources.get(target.href);
          if (resource && (!fragment || fragment === '#' || fragment.startsWith('#/')))
            return [
              key,
              resource +
                (fragment.startsWith('#/')
                  ? resource.includes('#')
                    ? fragment.slice(1)
                    : fragment
                  : ''),
            ];
        }
        if (child.startsWith('#')) {
          if (child === '#' || child.startsWith('#/'))
            return [key, base === rootUri ? base + child : base + child.slice(1)];
          return [key, base === rootUri ? rootUri + child : child];
        }
        if (absolute) return [key, absolute];
      }
      if (schemaMaps.has(key) && child && typeof child === 'object' && !Array.isArray(child)) {
        return [
          key,
          Object.fromEntries(
            Object.entries(child).map(([name, schema]) => [
              name,
              rebaseLocalReferences(
                schema,
                documentUri,
                rootUri,
                resources,
                anchors,
                scope,
                pointerChild(pointerChild(pointer, key), name),
                base,
              ),
            ]),
          ),
        ];
      }
      // Literal values in const, enum, defaults and examples are data.
      return [
        key,
        schemaChildren.has(key)
          ? rebaseLocalReferences(
              child,
              documentUri,
              rootUri,
              resources,
              anchors,
              scope,
              pointerChild(pointer, key),
              base,
            )
          : child,
      ];
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
      const rootBase =
        '$id' in plainRoot && typeof plainRoot.$id === 'string'
          ? (resolvedUri(plainRoot.$id, rootUri) ?? rootUri)
          : rootUri;
      const rootResources = new Map<string, string>([[rootBase, rootUri]]);
      const rootAnchors = new Map<string, string>();
      collectNestedResources(plainRoot, rootUri, rootBase, rootResources, rootAnchors);
      const sectionResources = new Map(rootResources);
      const sectionAnchors = new Map(rootAnchors);
      collectNestedResources(plainSchema, sectionUri, rootBase, sectionResources, sectionAnchors);
      const section = rebaseLocalReferences(
        plainSchema,
        sectionUri,
        rootUri,
        sectionResources,
        sectionAnchors,
        rootBase,
      ) as Registration['schema'];
      const root = rebaseLocalReferences(
        plainRoot,
        rootUri,
        rootUri,
        rootResources,
        rootAnchors,
        rootBase,
      ) as Registration['schema'];
      defaults.setDiagnosticsOptions({
        ...defaults.diagnosticsOptions,
        schemas: [
          ...(defaults.diagnosticsOptions.schemas ?? []).filter((entry) => !owned(entry)),
          { uri: rootUri, schema: { ...root, $id: rootUri } },
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
