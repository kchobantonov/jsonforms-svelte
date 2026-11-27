import { createAjv, type JsonFormsProps } from '@chobantonov/jsonforms-svelte-extended';
import cloneDeep from 'lodash/cloneDeep';
import { onDestroy } from 'svelte';
import { mergeDemoConfig, type DemoConfig } from '../demoConfig';
import type { DemoExample } from '../examples/definitions';
import type { createDemoTranslator } from '../i18n/demo';
import {
  configureExampleDataValidation,
  createExampleValidationRegistration,
  disposeMonacoModelsForExample,
  exampleModel,
} from './exampleModels';
import monaco from './monaco';
import { restoreTrustedUISchemaTesters } from './uischemaRegistryEditor';

type EditorKind = Parameters<typeof exampleModel>[1];
type Model = ReturnType<typeof exampleModel>;
type JsonObject = Record<string, unknown>;

interface ExampleEditorOptions {
  readonly example: DemoExample | undefined;
  readonly form: JsonFormsProps | undefined;
  readonly config: Partial<DemoConfig>;
  readonly translate: ReturnType<typeof createDemoTranslator>;
  buildI18n(translations: JsonObject | undefined): DemoExample['i18n'];
  notify(message: string): void;
}

const editorLabel = {
  data: 'data',
  schema: 'schema',
  uischema: 'uiSchema',
  uischemas: 'uiSchemas',
  i18n: 'i18n',
  config: 'config',
} as const;

export function useExampleEditors(examples: readonly DemoExample[], options: ExampleEditorOptions) {
  const models = $state<Record<EditorKind, Model | null>>({
    schema: null,
    uischema: null,
    uischemas: null,
    config: null,
    data: null,
    i18n: null,
  });
  let dataVersion = 0;
  let dataPinned = false;
  let previousName: string | undefined;
  $effect(() => {
    const name = options.example?.name;
    if (previousName !== name) disposeMonacoModelsForExample(previousName);
    previousName = name;
  });
  onDestroy(() => disposeMonacoModelsForExample(previousName));

  function load(example: DemoExample) {
    for (const kind of Object.keys(models) as EditorKind[]) {
      models[kind] = exampleModel(example, kind, kind === 'data' ? options.form?.data : undefined);
    }
    dataVersion = models.data!.getVersionId();
    dataPinned = false;
  }

  function reset(clearModels: boolean) {
    if (clearModels) for (const kind of Object.keys(models) as EditorKind[]) models[kind] = null;
    dataVersion = 0;
    dataPinned = false;
  }

  function syncData(data: unknown) {
    const example = options.example;
    if (!example || dataPinned || (models.data && models.data.getVersionId() !== dataVersion))
      return;
    models.data = exampleModel(example, 'data', data);
    dataVersion = models.data.getVersionId();
  }

  function reload(kind: EditorKind) {
    const example = options.example;
    if (!example) return;
    models[kind] = exampleModel(example, kind, kind === 'data' ? example.data : undefined);
    if (kind === 'data') {
      dataVersion = models[kind].getVersionId();
      dataPinned = true;
    }
    options.notify(options.translate(`editor.${editorLabel[kind]}.loaded`));
  }

  function apply(kind: EditorKind) {
    const model = models[kind];
    if (!model) return;
    const form = options.form;
    const example = options.example;
    try {
      if (form) {
        const text = model.getValue();
        const structured = kind === 'uischemas' || kind === 'i18n' || kind === 'config';
        const empty = structured ? text === '' : text.trim() === '';
        const value = empty ? undefined : JSON.parse(text);
        if (structured && !empty) {
          const valid =
            kind === 'uischemas'
              ? Array.isArray(value)
              : value !== null && typeof value === 'object' && !Array.isArray(value);
          if (!valid)
            throw new Error(
              options.translate(
                kind === 'uischemas' ? 'editor.arrayRequired' : 'editor.objectRequired',
                undefined,
                { label: options.translate(`editor.${editorLabel[kind]}.label`) },
              ),
            );
        }
        switch (kind) {
          case 'uischemas':
            form.uischemas = restoreTrustedUISchemaTesters(value, example?.uischemas);
            break;
          case 'i18n':
            form.i18n = options.buildI18n(value);
            break;
          case 'data':
            dataVersion = model.getVersionId();
            dataPinned = false;
            form.data = value;
            break;
          default:
            form[kind] = value;
        }
        if (kind === 'config' || kind === 'i18n') {
          form.ajv = createAjv(
            form.i18n,
            () => mergeDemoConfig(options.form?.config, options.config),
            example?.externalSchemas,
            example?.validatorDialect,
          );
        }
      }
      options.notify(options.translate(`editor.${editorLabel[kind]}.applied`));
    } catch (error) {
      options.notify(options.translate('editor.error', undefined, { error: String(error) }));
      return;
    }
    if (kind === 'schema' && example && form)
      configureExampleDataValidation(monaco, example.name, cloneDeep(form.schema));
  }
  return {
    tab(kind: EditorKind) {
      const name = editorLabel[kind];
      return {
        value: kind === 'i18n' ? 'internationalization' : name,
        label: options.translate(`editor.${name}.label`),
        reloadLabel: options.translate(`editor.${name}.reload`),
        applyLabel: options.translate(`editor.${name}.apply`),
      };
    },
    models,
    load,
    reset,
    syncData,
    reload,
    apply,
    registerValidations: createExampleValidationRegistration(examples),
  };
}
