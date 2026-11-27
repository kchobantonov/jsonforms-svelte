import type { DemoExample } from '../examples/definitions';
import {
  configureDataValidation,
  configureJsonSchemaValidation,
  configureUISchemaValidation,
  configureUISchemasValidation,
  getMonacoModelForUri,
} from './jsonSchemaValidation';
import monaco, { type MonacoApi } from './monaco';
import { serializeUISchemaRegistry } from './uischemaRegistryEditor';

const modelKinds = ['schema', 'uischema', 'uischemas', 'i18n', 'config', 'data'] as const;
type ModelKind = (typeof modelKinds)[number];
const modelUri = (name: string, kind: ModelKind) => `${name}.${kind}.json`;

function modelValue(example: DemoExample, kind: ModelKind, data: unknown) {
  if (kind === 'data') return data;
  if (kind === 'i18n') return example.i18n?.translations;
  return example[kind];
}
function emptySchemaValue(kind: ModelKind, value: unknown) {
  return ['schema', 'uischema'].includes(kind) && !value;
}
function modelSource(example: DemoExample, kind: ModelKind, value: unknown) {
  if (kind === 'uischemas') return serializeUISchemaRegistry(example.uischemas);
  if (value === undefined) return '';
  if (emptySchemaValue(kind, value)) return '';
  return JSON.stringify(value, null, 2);
}

export function exampleModel(example: DemoExample, kind: ModelKind, data?: unknown) {
  const value = modelValue(example, kind, data);
  const source = modelSource(example, kind, value);
  return getMonacoModelForUri(monaco.Uri.parse(modelUri(example.name, kind)), source);
}

export function disposeMonacoModelsForExample(name: string | undefined) {
  if (!name) return;
  for (const kind of modelKinds)
    monaco.editor.getModel(monaco.Uri.parse(modelUri(name, kind)))?.dispose();
}

export function configureExampleDataValidation(
  editor: MonacoApi,
  name: string,
  schema: DemoExample['schema'] | boolean,
) {
  configureDataValidation(
    editor,
    `inmemory://${modelUri(name, 'schema')}`,
    modelUri(name, 'data'),
    schema,
  );
}

export function createExampleValidationRegistration(examples: readonly DemoExample[]) {
  let registered = false;
  return (editor: MonacoApi) => {
    if (registered) return;
    configureJsonSchemaValidation(editor, ['*.schema.json']);
    configureUISchemaValidation(editor, ['*.uischema.json']);
    configureUISchemasValidation(editor, ['*.uischemas.json']);
    for (const example of examples) {
      if (example.schema)
        configureExampleDataValidation(editor, example.name, {
          ...example.schema,
          title: example.label,
        });
    }
    registered = true;
  };
}
