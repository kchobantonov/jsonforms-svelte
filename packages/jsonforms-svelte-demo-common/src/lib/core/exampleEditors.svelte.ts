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
const isJsonObject = (value: unknown): value is JsonObject =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

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

  function dataWasEdited() {
    return !!models.data && models.data.getVersionId() !== dataVersion;
  }

  function syncData(data: unknown) {
    const example = options.example;
    if (!example || dataPinned) return;
    if (dataWasEdited()) return;
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

  function parseEditorValue(kind: EditorKind, text: string) {
    const structured = ['uischemas', 'i18n', 'config'].includes(kind);
    const empty = structured ? text === '' : text.trim() === '';
    if (empty) return undefined;
    const value = JSON.parse(text);
    if (structured) validateStructuredValue(kind, value);
    return value;
  }

  function validateStructuredValue(kind: EditorKind, value: unknown) {
    const array = kind === 'uischemas';
    const valid = array ? Array.isArray(value) : isJsonObject(value);
    if (valid) return;
    throw new Error(
      options.translate(array ? 'editor.arrayRequired' : 'editor.objectRequired', undefined, {
        label: options.translate(`editor.${editorLabel[kind]}.label`),
      }),
    );
  }

  function refreshValidator(form: JsonFormsProps) {
    form.ajv = createAjv(
      form.i18n,
      () => mergeDemoConfig(options.form?.config, options.config),
      options.example?.externalSchemas,
      options.example?.validatorDialect,
    );
  }

  const applyValue: Record<
    EditorKind,
    (form: JsonFormsProps, value: ReturnType<typeof JSON.parse>, model: Model) => void
  > = {
    uischemas(form, value) {
      form.uischemas = restoreTrustedUISchemaTesters(value, options.example?.uischemas);
    },
    i18n(form, value) {
      form.i18n = options.buildI18n(value);
    },
    data(form, value, model) {
      dataVersion = model.getVersionId();
      dataPinned = false;
      form.data = value;
    },
    schema(form, value) {
      form.schema = value;
    },
    uischema(form, value) {
      form.uischema = value;
    },
    config(form, value) {
      form.config = value;
    },
  };

  function updateSchemaValidation(kind: EditorKind, form: JsonFormsProps | undefined) {
    const example = options.example;
    if (kind !== 'schema' || !example || !form) return;
    configureExampleDataValidation(monaco, example.name, cloneDeep(form.schema));
  }

  function applyToForm(form: JsonFormsProps | undefined, kind: EditorKind, model: Model) {
    if (form) {
      const value = parseEditorValue(kind, model.getValue());
      applyValue[kind](form, value, model);
      if (kind === 'config' || kind === 'i18n') refreshValidator(form);
    }
  }

  function apply(kind: EditorKind) {
    const model = models[kind];
    if (!model) return;
    const form = options.form;
    try {
      applyToForm(form, kind, model);
      options.notify(options.translate(`editor.${editorLabel[kind]}.applied`));
    } catch (error) {
      options.notify(options.translate('editor.error', undefined, { error: String(error) }));
      return;
    }
    updateSchemaValidation(kind, form);
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
