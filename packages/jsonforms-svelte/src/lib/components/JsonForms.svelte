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
    data?: unknown;
    schema?: JsonSchema;
    uischema?: UISchemaElement;
    renderers: MaybeReadonly<JsonFormsRendererRegistryEntry[]>;
    cells?: MaybeReadonly<JsonFormsCellRendererRegistryEntry[]>;
    config?: Record<string, unknown>;
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

  const schemaToUse = $derived(schema ?? Generate.jsonSchema(data));
  const uischemaToUse = $derived(
    uischema ?? Generate.uiSchema(schemaToUse, undefined, undefined, schemaToUse),
  );
  const coreOptions = $derived({ validationMode, ajv, additionalErrors });
  let core = $state.raw<JsonFormsCore>(
    untrack(() =>
      middleware(
        { data, schema: schemaToUse, uischema: uischemaToUse },
        Actions.init(data, schemaToUse, uischemaToUse, coreOptions),
        coreReducer,
      ),
    ),
  );
  let previous = untrack(() => [data, schemaToUse, uischemaToUse, coreOptions]);
  $effect(() => {
    const inputs = [data, schemaToUse, uischemaToUse, coreOptions];
    if (inputs.every((value, index) => value === previous[index])) return;
    previous = inputs;
    const action = Actions.updateCore(data, schemaToUse, uischemaToUse, coreOptions);
    untrack(() => {
      core = middleware(core, action, coreReducer);
    });
  });
  const formConfig = $derived(configReducer(undefined, Actions.setConfig(config)));
  const formI18n = $derived(
    i18nReducer(undefined, Actions.updateI18n(i18n?.locale, i18n?.translate, i18n?.translateError)),
  );
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
      return renderers as JsonFormsRendererRegistryEntry[];
    },
    get cells() {
      return cells as JsonFormsCellRendererRegistryEntry[];
    },
    get uischemas() {
      return uischemas as JsonFormsUISchemaRegistryEntry[];
    },
    get readonly() {
      return readonly;
    },
  };

  setContext(JsonFormsContextSymbol, jsonforms);
  setContext(DispatchContextSymbol, dispatch);

  let prevData: unknown = undefined;
  let prevErrors: JsonFormsCore['errors'] = undefined;

  $effect(() => {
    const currentData = core.data;
    const currentErrors = core.errors;

    if (currentData !== prevData || currentErrors !== prevErrors) {
      prevData = currentData;
      prevErrors = currentErrors;
      untrack(() => onchange?.({ data: currentData, errors: currentErrors }));
    }
  });
</script>

{#if core.schema && core.uischema}
  <DispatchRenderer schema={core.schema} uischema={core.uischema} path="" />
{/if}
