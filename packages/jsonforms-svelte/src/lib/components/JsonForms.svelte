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

  // All internal state starts undefined — effects handle initialization
  let dataToUse = $state<any>(undefined);
  let schemaToUse = $state<JsonSchema | undefined>(undefined);
  let uischemaToUse = $state<UISchemaElement | undefined>(undefined);
  let coreData = $state<any>(undefined);
  let coreSchema = $state<JsonSchema | undefined>(undefined);
  let coreUischema = $state<UISchemaElement | undefined>(undefined);
  let coreErrors = $state<ErrorObject[] | undefined>(undefined);
  let coreAdditionalErrors = $state<ErrorObject[] | undefined>(undefined);
  let coreAjv = $state<Ajv | undefined>(undefined);
  let coreValidationMode = $state<ValidationMode | undefined>(undefined);
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

  const getCurrentCore = (): JsonFormsCore | undefined => {
    if (coreSchema === undefined) return undefined;

    return {
      data: coreData,
      schema: coreSchema,
      uischema: coreUischema,
      errors: coreErrors,
      additionalErrors: coreAdditionalErrors,
      ajv: coreAjv,
      validationMode: coreValidationMode,
    } as JsonFormsCore;
  };

  const applyCore = (next: JsonFormsCore) => {
    if (next.data !== coreData) {
      coreData = next.data;
    }
    if (next.schema !== coreSchema) {
      coreSchema = next.schema;
    }
    if (next.uischema !== coreUischema) {
      coreUischema = next.uischema;
    }
    if (next.errors !== coreErrors) {
      coreErrors = next.errors;
    }
    if (next.additionalErrors !== coreAdditionalErrors) {
      coreAdditionalErrors = next.additionalErrors;
    }
    if (next.ajv !== coreAjv) {
      coreAjv = next.ajv;
    }
    if (next.validationMode !== coreValidationMode) {
      coreValidationMode = next.validationMode;
    }
  };

  const dispatch = (action: CoreActions) => {
    const next = middleware(getCurrentCore() as JsonFormsCore, action, coreReducer);
    applyCore(next);
  };

  const coreProxy: JsonFormsCore = {
    get data() {
      return coreData;
    },
    get schema() {
      return coreSchema!;
    },
    get uischema() {
      return coreUischema!;
    },
    get errors() {
      return coreErrors;
    },
    get additionalErrors() {
      return coreAdditionalErrors;
    },
    get ajv() {
      return coreAjv;
    },
    get validationMode() {
      return coreValidationMode;
    },
  };

  setContext(JsonFormsContextSymbol, {
    get core() {
      return coreProxy;
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
  } as JsonFormsSubStates);
  setContext(DispatchContextSymbol, dispatch);

  // ---- Prop sync effects ----

  $effect(() => {
    dataToUse = data;
  });

  $effect(() => {
    if (schema) {
      schemaToUse = schema;
      return;
    }

    const generatorData = isObject(dataToUse) ? dataToUse : {};
    schemaToUse = Generate.jsonSchema(generatorData);
  });

  $effect(() => {
    if (uischema) {
      uischemaToUse = uischema;
      return;
    }

    if (schemaToUse === undefined) return;
    uischemaToUse = Generate.uiSchema(schemaToUse, undefined, undefined, schemaToUse);
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
      const current = getCurrentCore();
      const action =
        current === undefined
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

      const next = middleware(
        current ?? { data: _data, schema: _schema, uischema: _uischema },
        action,
        coreReducer,
      );
      applyCore(next);
    });
  });

  $effect(() => {
    if (coreSchema !== undefined) {
      onchange?.({ data: coreData, errors: coreErrors });
    }
  });
</script>

{#if coreSchema && coreUischema}
  <DispatchRenderer schema={coreSchema} uischema={coreUischema} path="" />
{/if}
