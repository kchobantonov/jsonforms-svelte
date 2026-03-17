<script lang="ts">
  import {
    Actions,
    Generate,
    configReducer,
    coreReducer,
    defaultMiddleware,
    i18nReducer,
    type CoreActions,
    type JsonFormsCellRendererRegistryEntry,
    type JsonFormsCore,
    type JsonFormsI18nState,
    type JsonFormsRendererRegistryEntry,
    type JsonFormsSubStates,
    type JsonFormsUISchemaRegistryEntry,
    type JsonSchema,
    type Middleware,
    type UISchemaElement,
    type ValidationMode,
  } from '@jsonforms/core';
  import type Ajv from 'ajv';
  import type { ErrorObject } from 'ajv';
  import { setContext, untrack } from 'svelte';
  import {
    DispatchContextSymbol,
    JsonFormsContextSymbol,
    type JsonFormsChangeEvent,
    type MaybeReadonly,
  } from '../types.js';
  import DispatchRenderer from './DispatchRenderer.svelte';

  export interface JsonFormsProps {
    data?: any;
    schema?: JsonSchema;
    uischema?: UISchemaElement;
    renderers: MaybeReadonly<JsonFormsRendererRegistryEntry[]>;
    cells?: MaybeReadonly<JsonFormsCellRendererRegistryEntry[]>;
    config?: any;
    readonly?: boolean;
    uischemas?: MaybeReadonly<JsonFormsUISchemaRegistryEntry[]>;
    validationMode?: ValidationMode;
    ajv?: Ajv;
    i18n?: JsonFormsI18nState;
    additionalErrors?: ErrorObject[];
    middleware?: Middleware;
    onchange?: (event: JsonFormsChangeEvent) => void;
  }

  let {
    data = undefined,
    schema = undefined,
    uischema = undefined,
    renderers,
    cells = [],
    config = undefined,
    readonly = false,
    uischemas = [],
    validationMode = 'ValidateAndShow',
    ajv = undefined,
    i18n = undefined,
    additionalErrors = [],
    middleware = defaultMiddleware,
    onchange,
  }: JsonFormsProps = $props();

  const isObject = (elem: any): elem is Object => {
    return elem && typeof elem === 'object';
  };

  const initialData = untrack(() => data);
  const initialSchema = untrack(() => {
    const generatorData = isObject(initialData) ? initialData : {};
    return schema ?? Generate.jsonSchema(generatorData);
  });
  const initialUiSchema = untrack(
    () => uischema ?? Generate.uiSchema(initialSchema, undefined, undefined, initialSchema),
  );
  const initialRenderers = untrack(() => renderers as JsonFormsRendererRegistryEntry[]);
  const initialCells = untrack(() => cells as JsonFormsCellRendererRegistryEntry[]);
  const initialUischemas = untrack(() => uischemas as JsonFormsUISchemaRegistryEntry[]);
  const initialReadonly = untrack(() => readonly);
  const initialConfig = untrack(() => config);
  const initialI18n = untrack(() => i18n);
  const initialValidationMode = untrack(() => validationMode);
  const initialAjv = untrack(() => ajv);
  const initialAdditionalErrors = untrack(() => additionalErrors);
  const skipInitialRun = () => {
    let initialRun = true;

    return () => {
      if (initialRun) {
        initialRun = false;
        return true;
      }

      return false;
    };
  };

  let dataToUse = $state<any>(initialData);
  let schemaToUse = $state<JsonSchema | undefined>(initialSchema);
  let uischemaToUse = $state<UISchemaElement | undefined>(initialUiSchema);
  let core = $state<JsonFormsCore>(
    untrack(() =>
      middleware(
        { data: initialData, schema: initialSchema, uischema: initialUiSchema },
        Actions.init(initialData, initialSchema, initialUiSchema, {
          validationMode: initialValidationMode,
          ajv: initialAjv,
          additionalErrors: initialAdditionalErrors,
        }),
        coreReducer,
      ),
    ),
  );
  let formConfig = $state<ReturnType<typeof configReducer> | undefined>(
    untrack(() => configReducer(undefined, Actions.setConfig(initialConfig))),
  );
  let formI18n = $state<JsonFormsI18nState | undefined>(
    untrack(() =>
      i18nReducer(
        undefined,
        Actions.updateI18n(initialI18n?.locale, initialI18n?.translate, initialI18n?.translateError),
      ),
    ),
  );
  let formRenderers = $state<JsonFormsRendererRegistryEntry[] | undefined>(initialRenderers);
  let formCells = $state<JsonFormsCellRendererRegistryEntry[] | undefined>(initialCells);
  let formUischemas = $state<JsonFormsUISchemaRegistryEntry[] | undefined>(initialUischemas);
  let formReadonly = $state<boolean | undefined>(initialReadonly);
  const skipInitialDataSync = skipInitialRun();
  const skipInitialSchemaSync = skipInitialRun();
  const skipInitialUiSchemaSync = skipInitialRun();
  const skipInitialRenderersSync = skipInitialRun();
  const skipInitialCellsSync = skipInitialRun();
  const skipInitialUischemasSync = skipInitialRun();
  const skipInitialReadonlySync = skipInitialRun();
  const skipInitialConfigSync = skipInitialRun();
  const skipInitialI18nSync = skipInitialRun();
  const skipInitialCoreSync = skipInitialRun();

  const dispatch = (action: CoreActions) => {
    core = middleware(core, action, coreReducer);
  };

  const jsonforms: JsonFormsSubStates = {
    get core() {
      return core;
    },
    get config() {
      return formConfig;
    },
    get i18n() {
      return formI18n;
    },
    get renderers() {
      return formRenderers;
    },
    get cells() {
      return formCells;
    },
    get uischemas() {
      return formUischemas;
    },
    get readonly() {
      return formReadonly;
    },
  };

  setContext(JsonFormsContextSymbol, jsonforms);
  setContext(DispatchContextSymbol, dispatch);

  $effect(() => {
    data;

    if (skipInitialDataSync()) {
      return;
    }

    dataToUse = data;
  });

  $effect(() => {
    schema;
    dataToUse;

    if (skipInitialSchemaSync()) {
      return;
    }

    const generatorData = isObject(dataToUse) ? dataToUse : {};
    const nextSchema = schema ?? Generate.jsonSchema(generatorData);
    schemaToUse = nextSchema;
  });

  $effect(() => {
    uischema;
    schemaToUse;

    if (skipInitialUiSchemaSync()) {
      return;
    }

    uischemaToUse = uischema ?? Generate.uiSchema(schemaToUse!, undefined, undefined, schemaToUse!);
  });

  $effect(() => {
    renderers;

    if (skipInitialRenderersSync()) {
      return;
    }

    formRenderers = renderers as JsonFormsRendererRegistryEntry[];
  });

  $effect(() => {
    cells;

    if (skipInitialCellsSync()) {
      return;
    }

    formCells = cells as JsonFormsCellRendererRegistryEntry[];
  });

  $effect(() => {
    uischemas;

    if (skipInitialUischemasSync()) {
      return;
    }

    formUischemas = uischemas as JsonFormsUISchemaRegistryEntry[];
  });

  $effect(() => {
    readonly;

    if (skipInitialReadonlySync()) {
      return;
    }

    formReadonly = readonly;
  });

  $effect(() => {
    config;

    if (skipInitialConfigSync()) {
      return;
    }

    formConfig = configReducer(undefined, Actions.setConfig(config));
  });

  $effect(() => {
    const _i18n = i18n;

    if (skipInitialI18nSync()) {
      return;
    }

    untrack(() => {
      formI18n = i18nReducer(
        formI18n,
        Actions.updateI18n(_i18n?.locale, _i18n?.translate, _i18n?.translateError),
      );
    });
  });

  $effect(() => {
    const _data = dataToUse;
    const _schema = schemaToUse;
    const _uischema = uischemaToUse;
    const _validationMode = validationMode;
    const _ajv = ajv;
    const _additionalErrors = additionalErrors;

    if (_schema === undefined || _uischema === undefined) return;

    if (skipInitialCoreSync()) {
      return;
    }

    untrack(() => {
      const action = Actions.updateCore(_data, _schema, _uischema, {
        validationMode: _validationMode,
        ajv: _ajv,
        additionalErrors: _additionalErrors,
      });

      core = middleware(core, action, coreReducer);
    });
  });

  let prevData: any = undefined;
  let prevErrors: any = undefined;

  $effect(() => {
    const currentData = core.data;
    const currentErrors = core.errors;

    if (currentData !== prevData || currentErrors !== prevErrors) {
      prevData = currentData;
      prevErrors = currentErrors;
      onchange?.({ data: currentData, errors: currentErrors });
    }
  });
</script>

{#if core.schema && core.uischema}
  <DispatchRenderer schema={core.schema} uischema={core.uischema} path="" />
{/if}
