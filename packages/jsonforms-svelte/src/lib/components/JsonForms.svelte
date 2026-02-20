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

  // All internal state starts undefined — effects handle initialization
  let dataToUse = $state<any>(undefined);
  let schemaToUse = $state<JsonSchema | undefined>(undefined);
  let uischemaToUse = $state<UISchemaElement | undefined>(undefined);
  let core = $state<JsonFormsCore | undefined>(undefined);
  let formConfig = $state<ReturnType<typeof configReducer> | undefined>(undefined);
  let formI18n = $state<JsonFormsI18nState | undefined>(undefined);
  let formRenderers = $state<MaybeReadonly<JsonFormsRendererRegistryEntry[]> | undefined>(
    undefined,
  );
  let formCells = $state<MaybeReadonly<JsonFormsCellRendererRegistryEntry[]> | undefined>(
    undefined,
  );
  let formUischemas = $state<MaybeReadonly<JsonFormsUISchemaRegistryEntry[]> | undefined>(
    undefined,
  );
  let formReadonly = $state<boolean | undefined>(undefined);

  // Dispatch function
  const dispatch = (action: CoreActions) => {
    core = middleware(core as JsonFormsCore, action, coreReducer);
  };

  // Provide context using getters so consumers get fine-grained reactivity
  setContext(JsonFormsContextSymbol, {
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
  });
  setContext(DispatchContextSymbol, dispatch);

  // ---- Prop sync effects ----

  $effect(() => {
    dataToUse = data;
  });

  $effect(() => {
    schema;
    const generatorData = isObject(dataToUse) ? dataToUse : {};
    const nextSchema = schema ?? Generate.jsonSchema(generatorData);
    schemaToUse = nextSchema;
  });

  $effect(() => {
    uischemaToUse = uischema ?? Generate.uiSchema(schemaToUse!, undefined, undefined, schemaToUse!);
  });

  $effect(() => {
    formRenderers = renderers;
  });

  $effect(() => {
    formCells = cells;
  });

  $effect(() => {
    formUischemas = uischemas;
  });

  $effect(() => {
    formReadonly = readonly;
  });

  $effect(() => {
    formConfig = configReducer(undefined, Actions.setConfig(config));
  });

  $effect(() => {
    // only track i18n prop, not formI18n itself
    const _i18n = i18n;
    untrack(() => {
      formI18n = i18nReducer(
        formI18n,
        Actions.updateI18n(_i18n?.locale, _i18n?.translate, _i18n?.translateError),
      );
    });
  });

  // ---- Core init + update effect ----
  $effect(() => {
    const _data = dataToUse;
    const _schema = schemaToUse;
    const _uischema = uischemaToUse;
    const _validationMode = validationMode;
    const _ajv = ajv;
    const _additionalErrors = additionalErrors;

    if (_schema === undefined || _uischema === undefined) return;

    untrack(() => {
      const action =
        core === undefined
          ? Actions.init(_data, _schema, _uischema, {
              validationMode: _validationMode,
              ajv: _ajv,
              additionalErrors: _additionalErrors,
            })
          : Actions.updateCore(_data, _schema, _uischema, {
              validationMode: _validationMode,
              ajv: _ajv,
              additionalErrors: _additionalErrors,
            });

      core = middleware(
        core ?? { data: _data, schema: _schema, uischema: _uischema },
        action,
        coreReducer,
      );
    });
  });

  // ---- onchange effect with dirty check to avoid spurious emissions ----

  let prevData: any = undefined;
  let prevErrors: any = undefined;

  $effect(() => {
    const currentData = core?.data;
    const currentErrors = core?.errors;

    if (core !== undefined && (currentData !== prevData || currentErrors !== prevErrors)) {
      prevData = currentData;
      prevErrors = currentErrors;
      onchange?.({ data: currentData, errors: currentErrors });
    }
  });
</script>

{#if core?.schema && core?.uischema}
  <DispatchRenderer schema={core.schema} uischema={core.uischema} path="" />
{/if}
