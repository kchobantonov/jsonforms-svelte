import { expect, it } from 'vite-plus/test';
import type { json } from 'monaco-editor';
import { createMonacoSchemaRegistration } from '../src/lib/core/monacoSchema';

it('isolates editor schemas, rebases section references and preserves host diagnostics policy', () => {
  const host = { uri: 'https://host/schema', fileMatch: ['host.json'], schema: { type: 'string' } };
  const defaults = {
    diagnosticsOptions: { validate: false, schemas: [host] } as json.DiagnosticsOptions,
    setDiagnosticsOptions(options: json.DiagnosticsOptions) {
      this.diagnosticsOptions = options;
    },
  };
  const first = createMonacoSchemaRegistration(defaults, 'inmemory://first.json');
  const second = createMonacoSchemaRegistration(defaults, 'inmemory://second.json');
  const schema = {
    type: 'object',
    properties: { value: { $ref: '#/definitions/value' } },
    const: { $ref: '#/literal' },
    default: { $ref: '#/default' },
  };
  first.update(schema, { definitions: { value: { type: 'integer' } } });
  second.update({ type: 'string' }, { type: 'string' });
  expect(defaults.diagnosticsOptions.validate).toBe(false);
  expect(defaults.diagnosticsOptions.schemas).toHaveLength(5);
  const section = defaults.diagnosticsOptions.schemas!.find((entry) =>
    entry.fileMatch?.includes('inmemory://first.json'),
  )!;
  expect(section.schema.properties.value.$ref).toBe(
    'inmemory://first.json.jsonforms-root-schema.json#/definitions/value',
  );
  expect(schema.properties.value.$ref).toBe('#/definitions/value');
  expect(section.schema.const.$ref).toBe('#/literal');
  expect(section.schema.default.$ref).toBe('#/default');
  first.update({ type: 'number' }, { type: 'number' });
  expect(defaults.diagnosticsOptions.schemas).toHaveLength(5);
  first.clear();
  expect(defaults.diagnosticsOptions.schemas).toHaveLength(3);
  expect(defaults.diagnosticsOptions.schemas).toContain(host);
  expect(
    defaults.diagnosticsOptions.schemas!.some((entry) =>
      entry.fileMatch?.includes('inmemory://second.json'),
    ),
  ).toBe(true);
  second.clear();
  expect(defaults.diagnosticsOptions.schemas).toEqual([host]);
});

it('rebases nested resource references through escaped schema pointers without changing literal data', () => {
  const defaults = {
    diagnosticsOptions: { schemas: [] } as json.DiagnosticsOptions,
    setDiagnosticsOptions(options: json.DiagnosticsOptions) {
      this.diagnosticsOptions = options;
    },
  };
  const registration = createMonacoSchemaRegistration(defaults, 'inmemory://nested.json');
  const nested = {
    $id: 'nested.json',
    type: 'object',
    properties: { value: { $ref: '#/$defs/value' } },
    $defs: { value: { type: 'integer' } },
    const: { $ref: '#/literal' },
  };
  const schema = {
    $id: 'https://host.example/root.json',
    type: 'object',
    properties: {
      'a/b~c': nested,
      copied: { $ref: 'nested.json#/$defs/value' },
      external: { $ref: 'external.json' },
    },
  };
  registration.update(schema, schema);
  const section = defaults.diagnosticsOptions.schemas!.find((entry) =>
    entry.fileMatch?.includes('inmemory://nested.json'),
  )!;
  const root = defaults.diagnosticsOptions.schemas!.find(
    (entry) => entry.uri === 'inmemory://nested.json.jsonforms-root-schema.json',
  )!;
  expect(section.schema.properties['a/b~c'].properties.value.$ref).toBe(
    'inmemory://nested.json.jsonforms-section-schema.json#/properties/a~1b~0c/$defs/value',
  );
  expect(root.schema.properties['a/b~c'].properties.value.$ref).toBe(
    'inmemory://nested.json.jsonforms-root-schema.json#/properties/a~1b~0c/$defs/value',
  );
  expect(section.schema.properties.copied.$ref).toBe(
    'inmemory://nested.json.jsonforms-section-schema.json#/properties/a~1b~0c/$defs/value',
  );
  expect(root.schema.properties.copied.$ref).toBe(
    'inmemory://nested.json.jsonforms-root-schema.json#/properties/a~1b~0c/$defs/value',
  );
  expect(section.schema.properties.external.$ref).toBe('https://host.example/external.json');
  expect(section.schema.properties['a/b~c'].const.$ref).toBe('#/literal');
  expect(nested.properties.value.$ref).toBe('#/$defs/value');
  registration.clear();
  expect(defaults.diagnosticsOptions.schemas).toEqual([]);
});

it('resolves root and nested anchors to owned pointers while leaving unknown anchors and data alone', () => {
  const defaults = {
    diagnosticsOptions: { schemas: [] } as json.DiagnosticsOptions,
    setDiagnosticsOptions(options: json.DiagnosticsOptions) {
      this.diagnosticsOptions = options;
    },
  };
  const registration = createMonacoSchemaRegistration(defaults, 'inmemory://anchors.json');
  const schema = {
    $id: 'https://host.example/root.json',
    $defs: {
      'root/value': { $anchor: 'rootValue', type: 'integer' },
      nested: {
        $id: 'nested.json',
        $defs: { value: { $anchor: 'nestedValue', type: 'integer' } },
      },
    },
    properties: {
      root: { $ref: '#rootValue' },
      nested: { $ref: 'nested.json#nestedValue' },
      unknown: { $ref: '#missing' },
    },
    const: { $ref: '#rootValue' },
  };
  registration.update(schema, schema);
  const section = defaults.diagnosticsOptions.schemas!.find((entry) =>
    entry.fileMatch?.includes('inmemory://anchors.json'),
  )!;
  expect(section.schema.properties.root.$ref).toBe(
    'inmemory://anchors.json.jsonforms-section-schema.json#/$defs/root~1value',
  );
  expect(section.schema.properties.nested.$ref).toBe(
    'inmemory://anchors.json.jsonforms-section-schema.json#/$defs/nested/$defs/value',
  );
  expect(section.schema.properties.unknown.$ref).toBe(
    'inmemory://anchors.json.jsonforms-root-schema.json#missing',
  );
  expect(section.schema.const.$ref).toBe('#rootValue');
  expect(schema.properties.root.$ref).toBe('#rootValue');
  registration.clear();
});
