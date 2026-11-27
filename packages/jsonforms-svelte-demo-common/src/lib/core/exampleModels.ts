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

export function exampleModel(example: DemoExample, kind: ModelKind, data?: unknown) {
  const value =
    kind === 'data' ? data : kind === 'i18n' ? example.i18n?.translations : example[kind];
  const source =
    kind === 'uischemas'
      ? serializeUISchemaRegistry(example.uischemas)
      : value === undefined || ((kind === 'schema' || kind === 'uischema') && !value)
        ? ''
        : JSON.stringify(value, null, 2);
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
