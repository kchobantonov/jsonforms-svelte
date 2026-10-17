<script lang="ts">
  import {
    Actions,
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
  import { createRendererAjv } from '../validator';
  import isEqual from 'lodash/isEqual';
  import type { ErrorObject } from 'ajv';
  import { onDestroy, setContext, untrack } from 'svelte';
  import {
    OwnedErrorStore,
    OwnedErrorsContextSymbol,
    type JsonFormsValidityEvent,
  } from '../ownedErrors';
  import {
    AuthoredConfigContextSymbol,
    type AuthoredConfigContext,
    DispatchContextSymbol,
    JsonFormsContextSymbol,
    type JsonFormsChangeEvent,
    type MaybeReadonly,
  } from '../types.js';
  import DispatchRenderer from './DispatchRenderer.svelte';
  import { usePendingControlChanges } from '../detailDialog.svelte';

  usePendingControlChanges();
  import { inferJsonSchema, generateRootUISchema } from '../inference';

  export interface JsonFormsProps {
    data?: unknown;
    schema?: JsonSchema | boolean;
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
    onvaliditychange?: (event: JsonFormsValidityEvent) => void;
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
    onvaliditychange,
  }: JsonFormsProps = $props();

  const ownedErrors = new OwnedErrorStore();
  let ownedSnapshot = $state.raw(ownedErrors.snapshot);
  const unsubscribeOwnedErrors = ownedErrors.subscribe((snapshot) => {
    ownedSnapshot = snapshot;
  });
  onDestroy(() => {
    unsubscribeOwnedErrors();
    ownedErrors.dispose();
  });
  const mergedAdditionalErrors = $derived([...additionalErrors, ...ownedSnapshot.errors]);

  const initialData = untrack(() => data);
  const initialSchema = untrack(() => (schema ?? inferJsonSchema(initialData)) as JsonSchema);
  const initialUiSchema = untrack(() => uischema ?? generateRootUISchema(initialSchema));
  const initialRenderers = untrack(() => renderers as JsonFormsRendererRegistryEntry[]);
  const initialCells = untrack(() => cells as JsonFormsCellRendererRegistryEntry[]);
  const initialUischemas = untrack(() => uischemas as JsonFormsUISchemaRegistryEntry[]);
  const initialReadonly = untrack(() => readonly);
  const initialConfig = untrack(() => config);
  const initialI18n = untrack(() => i18n);
  const initialValidationMode = untrack(() => validationMode);
  const defaultAjv = createRendererAjv();
  const initialAjv = untrack(() => ajv ?? defaultAjv);
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

  let dataToUse = $state.raw<unknown>(initialData);
  let schemaToUse = $state.raw<JsonSchema | undefined>(initialSchema);
  let uischemaToUse = $state.raw<UISchemaElement | undefined>(initialUiSchema);
  let core = $state.raw<JsonFormsCore>(
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
        Actions.updateI18n(
          initialI18n?.locale,
          initialI18n?.translate,
          initialI18n?.translateError,
        ),
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
    dataToUse = core.data;
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

  setContext<AuthoredConfigContext>(AuthoredConfigContextSymbol, {
    get value() {
      return config;
    },
  });
  setContext(OwnedErrorsContextSymbol, ownedErrors);
  setContext(JsonFormsContextSymbol, jsonforms);
  setContext(DispatchContextSymbol, dispatch);

  let previousHostData = initialData;
  $effect(() => {
    void data;

    if (skipInitialDataSync()) {
      return;
    }

    if (!Object.is(data, previousHostData)) {
      previousHostData = data;
      // Serialized hosts may echo an identical document with new object identities.
      // Retain the current rows so selection and pending child editors stay attached.
      dataToUse = untrack(() => (isEqual(data, core.data) ? core.data : data));
    }
  });

  $effect(() => {
    void schema;
    void dataToUse;

    if (skipInitialSchemaSync()) {
      return;
    }

    const nextSchema = (schema ?? inferJsonSchema(dataToUse)) as JsonSchema;
    schemaToUse = nextSchema;
  });

  $effect(() => {
    void uischema;
    void schemaToUse;

    if (skipInitialUiSchemaSync()) {
      return;
    }

    uischemaToUse = uischema ?? generateRootUISchema(schemaToUse!);
  });

  $effect(() => {
    void renderers;

    if (skipInitialRenderersSync()) {
      return;
    }

    formRenderers = renderers as JsonFormsRendererRegistryEntry[];
  });

  $effect(() => {
    void cells;

    if (skipInitialCellsSync()) {
      return;
    }

    formCells = cells as JsonFormsCellRendererRegistryEntry[];
  });

  $effect(() => {
    void uischemas;

    if (skipInitialUischemasSync()) {
      return;
    }

    formUischemas = uischemas as JsonFormsUISchemaRegistryEntry[];
  });

  $effect(() => {
    void readonly;

    if (skipInitialReadonlySync()) {
      return;
    }

    formReadonly = readonly;
  });

  $effect(() => {
    void config;

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
    const _ajv = ajv ?? defaultAjv;

    if (_schema === undefined || _uischema === undefined) return;

    if (skipInitialCoreSync()) {
      return;
    }

    untrack(() => {
      const action = Actions.updateCore(_data, _schema, _uischema, {
        validationMode: _validationMode,
        ajv: _ajv,
        additionalErrors: mergedAdditionalErrors,
      });

      core = middleware(core, action, coreReducer);
    });
  });

  // Read current core state inside the publication transaction. Replaying dataToUse
  // here would undo an edit dispatched before the host has echoed its new data.
  $effect(() => {
    const errors = mergedAdditionalErrors;
    untrack(() => {
      if (
        core.schema === undefined ||
        !core.uischema ||
        isEqual(core.additionalErrors ?? [], errors)
      )
        return;
      core = middleware(
        core,
        Actions.updateCore(core.data, core.schema, core.uischema, {
          validationMode: core.validationMode,
          ajv: core.ajv,
          additionalErrors: errors,
        }),
        coreReducer,
      );
    });
  });

  $effect(() => {
    const errors = core.errors ?? [];
    const additional = core.additionalErrors ?? [];
    const pending = ownedSnapshot.pending;
    const notify = onvaliditychange;
    untrack(() =>
      notify?.({
        errors,
        additionalErrors: additional,
        pending,
        valid: !pending && errors.length === 0 && additional.length === 0,
      }),
    );
  });

  let prevData: unknown = undefined;
  let prevErrors: JsonFormsChangeEvent['errors'] = undefined;

  $effect(() => {
    const currentData = core.data;
    const currentErrors = core.errors;

    if (!Object.is(currentData, prevData) || !Object.is(currentErrors, prevErrors)) {
      prevData = currentData;
      prevErrors = currentErrors;
      onchange?.({ data: currentData, errors: currentErrors });
    }
  });
  // A different root schema type needs a new renderer tree. Dispose old array
  // bindings before they observe the replacement scalar schema. Ordinary edits
  // within the same root type retain their editors and focus.
  // Keep the original boolean schema in core/Ajv so error keywords and paths stay exact.
  // Upstream renderer mappers require an object schema at the presentation boundary.
  const rendererSchema = $derived<JsonSchema | undefined>(
    typeof core.schema === 'boolean'
      ? core.schema
        ? {}
        : { type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'], not: {} }
      : core.schema,
  );
  const rendererShape = $derived(JSON.stringify(rendererSchema?.type));
</script>

{#if rendererSchema && core.uischema}
  {#key rendererShape}
    <DispatchRenderer schema={rendererSchema} uischema={core.uischema} path="" />
  {/key}
{/if}
