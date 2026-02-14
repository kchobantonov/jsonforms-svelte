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
  import { onMount, setContext, untrack } from 'svelte';
  import { DispatchContextSymbol, JsonFormsContextSymbol, type JsonFormsChangeEvent, type MaybeReadonly } from '../types.js';
  import DispatchRenderer from './DispatchRenderer.svelte';

  // Props
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

  let initialized = false;
  onMount(() => {
    initialized = true;
  });

  let dataToUse = $state(untrack(() => data));

  // Use $derived for schemas with fallback logic
  let schemaToUse = $state<JsonSchema>(
    untrack(() => schema ?? Generate.jsonSchema(isObject(dataToUse) ? dataToUse : {})),
  );

  let uischemaToUse = $state<UISchemaElement>(
    untrack(() => uischema ?? Generate.uiSchema(schemaToUse, undefined, undefined, schemaToUse)),
  );

  function initCore(): JsonFormsCore {
    const initialCore = {
      data: dataToUse,
      schema: schemaToUse,
      uischema: uischemaToUse,
    };
    const core = middleware(
      initialCore,
      Actions.init(dataToUse, schemaToUse, uischemaToUse, {
        validationMode: validationMode,
        ajv: ajv,
        additionalErrors: additionalErrors,
      }),
      coreReducer,
    );
    return core;
  }

  // JsonForms state - initialize with empty/default values
  const jsonforms = $state(
    untrack(() => ({
      core: initCore(),
      config: configReducer(undefined, Actions.setConfig(config)),
      i18n: i18nReducer(
        i18n,
        Actions.updateI18n(i18n?.locale, i18n?.translate, i18n?.translateError),
      ),
      renderers,
      cells,
      uischemas,
      readonly,
    })),
  );

  // Dispatch function
  const dispatch = (action: CoreActions) => {
    jsonforms.core = middleware(jsonforms.core as JsonFormsCore, action, coreReducer);
  };

  // Provide context
  setContext(JsonFormsContextSymbol, jsonforms);
  setContext(DispatchContextSymbol, dispatch);

  const coreDataToUpdate = $derived([
    dataToUse,
    schemaToUse,
    uischemaToUse,
    validationMode,
    ajv,
    additionalErrors,
  ]);

  const eventToEmit = $derived<JsonFormsChangeEvent>({
    data: jsonforms.core.data,
    errors: jsonforms.core.errors,
  });

  $effect(() => {
    schema;

    if (initialized) {
      untrack(() => {
        const generatorData = isObject(dataToUse) ? dataToUse : {};
        schemaToUse = schema ?? Generate.jsonSchema(generatorData);

        if (!uischema) {
          uischemaToUse = Generate.uiSchema(schemaToUse, undefined, undefined, schemaToUse);
        }
      });
    }
  });

  $effect(() => {
    uischema;
    if (initialized) {
      untrack(() => {
        uischemaToUse =
          uischema ?? Generate.uiSchema(schemaToUse, undefined, undefined, schemaToUse);
      });
    }
  });

  $effect(() => {
    data;
    if (initialized) {
      dataToUse = data;
    }
  });

  $effect(() => {
    renderers;
    if (initialized) {
      jsonforms.renderers = renderers;
    }
  });

  $effect(() => {
    cells;
    if (initialized) {
      jsonforms.cells = cells;
    }
  });

  $effect(() => {
    uischemas;
    if (initialized) {
      jsonforms.uischemas = uischemas;
    }
  });

  $effect(() => {
    config;
    if (initialized) {
      untrack(() => {
        jsonforms.config = configReducer(undefined, Actions.setConfig(config));
      });
    }
  });

  $effect(() => {
    readonly;
    if (initialized) {
      jsonforms.readonly = readonly;
    }
  });

  $effect(() => {
    coreDataToUpdate; // ← dependency anchor

    if (initialized) {
      untrack(() => {
        jsonforms.core = middleware(
          jsonforms.core as JsonFormsCore,
          Actions.updateCore(dataToUse, schemaToUse, uischemaToUse, {
            validationMode: validationMode,
            ajv: ajv,
            additionalErrors: additionalErrors,
          }),
          coreReducer,
        );
      });
    }
  });

  $effect(() => {
    i18n;
    if (initialized) {
      untrack(() => {
        jsonforms.i18n = i18nReducer(
          jsonforms.i18n,
          Actions.updateI18n(i18n?.locale, i18n?.translate, i18n?.translateError),
        );
      });
    }
  });

  $effect(() => {
    eventToEmit; // ← dependency anchor
    if (initialized) {
      onchange?.(eventToEmit);
    }
  });
</script>

{#if jsonforms.core?.schema && jsonforms.core?.uischema}
  <DispatchRenderer schema={jsonforms.core.schema} uischema={jsonforms.core.uischema} path="" />
{/if}
