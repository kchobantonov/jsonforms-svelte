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
