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
  import { getContext, onDestroy, setContext, untrack } from 'svelte';
  import {
    emitUIDiagnostic,
    UIDiagnosticContextSymbol,
    type UIDiagnosticSink,
  } from '../authorDiagnostic.svelte';
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
  import { CollectionIdentityStore, CollectionIdentityContextSymbol } from '../collectionIdentity';
  import {
    InitialFocusDiagnostic,
    InitialFocusDiagnosticSymbol,
  } from '../initialFocusDiagnostic.svelte';

  usePendingControlChanges();
  import { inferJsonSchema, generateRootUISchema } from '../inference';
  import { localSchemaResources } from '../localSchemaResources';
  import { suppliedSchemaResources } from '../suppliedSchemaResources';
  import { dynamicSchemaReference } from '../dynamicSchemaReference';
  import { rendererMessage } from '../rendererMessages';

  type ReferenceIssue = 'unresolved' | 'dynamic';

  const missingReference = (error: unknown): string | undefined => {
    if (typeof error !== 'object' || error === null || !('missingRef' in error)) return undefined;
    return typeof error.missingRef === 'string' ? error.missingRef : undefined;
  };
  const canonicalConfig = (value: Record<string, unknown> | undefined) =>
    value && Object.hasOwn(value, 'readOnly')
      ? Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'readOnly'))
      : value;
  const referenceMessage = (
    reference: string,
    locale?: string,
    translate?: JsonFormsI18nState['translate'],
    issue: ReferenceIssue = 'unresolved',
  ) => {
    const key = issue === 'dynamic' ? 'reference.dynamicUnsupported' : 'reference.unresolved';
    const fallback = rendererMessage(locale, key);
    const message = translate?.(key, fallback, { reference }) ?? fallback;
    return message.replace(/\$?\{reference\}/g, reference);
  };
  const referenceError = (
    reference: string,
    locale?: string,
    translate?: JsonFormsI18nState['translate'],
    issue: ReferenceIssue = 'unresolved',
  ): ErrorObject => ({
    instancePath: '',
    schemaPath: issue === 'dynamic' ? '#/$dynamicRef' : '#/$ref',
    keyword: issue === 'dynamic' ? '$dynamicRef' : '$ref',
    params: { ref: reference },
    message: referenceMessage(reference, locale, translate, issue),
  });
  const referenceFallbackSchema: JsonSchema = {};

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
    ondiagnostic?: UIDiagnosticSink;
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
    ondiagnostic,
  }: JsonFormsProps = $props();

  const ownedErrors = new OwnedErrorStore();
  const collectionIdentity = new CollectionIdentityStore();
  const parentDiagnosticSink = getContext<UIDiagnosticSink | undefined>(UIDiagnosticContextSymbol);
  const diagnosticSink: UIDiagnosticSink = (diagnostic) => {
    (ondiagnostic ?? parentDiagnosticSink)?.(diagnostic);
  };
  const initialFocusDiagnostic = new InitialFocusDiagnostic((code, payload) =>
    emitUIDiagnostic(diagnosticSink, code, payload),
  );
  let ownedSnapshot = $state.raw(ownedErrors.snapshot);
  let schemaReferenceError = $state<string | undefined>(undefined);
  let schemaReferenceIssue = $state<ReferenceIssue>('unresolved');
  let reportedSchemaReference: string | undefined;
  $effect(() => {
    const reference = schemaReferenceError;
    const issue = schemaReferenceIssue;
    if (reference === undefined) {
      reportedSchemaReference = undefined;
      return;
    }
    const identity = JSON.stringify([issue, reference]);
    if (reportedSchemaReference === identity) return;
    reportedSchemaReference = identity;
    emitUIDiagnostic(
      diagnosticSink,
      issue === 'dynamic' ? 'reference.dynamicUnsupported' : 'reference.unresolved',
      {
        severity: 'warning',
        message:
          issue === 'dynamic'
            ? 'Dynamic schema references are not supported for rendering.'
            : 'The schema reference could not be resolved for rendering.',
        details: { reference },
      },
    );
  });
  const unsubscribeOwnedErrors = ownedErrors.subscribe((snapshot) => {
    ownedSnapshot = snapshot;
  });
  onDestroy(() => {
    unsubscribeOwnedErrors();
    ownedErrors.dispose();
  });
  const hostAdditionalErrors = $derived([...additionalErrors, ...ownedSnapshot.errors]);
  const mergedAdditionalErrors = $derived([
    ...hostAdditionalErrors,
    ...(schemaReferenceError !== undefined
      ? [referenceError(schemaReferenceError, i18n?.locale, i18n?.translate, schemaReferenceIssue)]
      : []),
  ]);

  const initialData = untrack(() => data);
  let initialLocalReference: string | undefined;
  const initialSchema = untrack(() =>
    localSchemaResources((schema ?? inferJsonSchema(initialData)) as JsonSchema, (reference) => {
      initialLocalReference ??= reference;
    }),
  );
  const initialDynamicReference = dynamicSchemaReference(initialSchema);
  const initialUiSchema = untrack(() => uischema ?? generateRootUISchema(initialSchema));
  const initialRenderers = untrack(() => renderers as JsonFormsRendererRegistryEntry[]);
  const initialCells = untrack(() => cells as JsonFormsCellRendererRegistryEntry[]);
  const initialUischemas = untrack(() => uischemas as JsonFormsUISchemaRegistryEntry[]);
  const initialReadonly = untrack(() => readonly);
  const initialConfig = untrack(() => canonicalConfig(config));
  const initialI18n = untrack(() => i18n);
  const initialValidationMode = untrack(() => validationMode);
  const defaultAjv = createRendererAjv();
  const initialAjv = untrack(() => ajv ?? defaultAjv);
  let initialExternalReference: string | undefined;
  const initialPresentationSchema = untrack(() =>
    suppliedSchemaResources(initialSchema, initialAjv, (reference) => {
      initialExternalReference ??= reference;
    }),
  );
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
  let presentationSchemaToUse = $state.raw<JsonSchema>(initialPresentationSchema);
  let unresolvedReferenceToUse = $state<string | undefined>(
    initialLocalReference ?? initialExternalReference,
  );
  let dynamicReferenceToUse = $state<string | undefined>(initialDynamicReference);
  let uischemaToUse = $state.raw<UISchemaElement | undefined>(initialUiSchema);
  const fallbackInitialCore = (
    reference: string,
    issue: ReferenceIssue = 'unresolved',
  ): JsonFormsCore => {
    schemaReferenceError = reference;
    schemaReferenceIssue = issue;
    return coreReducer(
      undefined,
      Actions.init(initialData, referenceFallbackSchema, initialUiSchema, {
        validationMode: initialValidationMode,
        ajv: initialAjv,
        additionalErrors: [
          ...initialAdditionalErrors,
          referenceError(reference, initialI18n?.locale, initialI18n?.translate, issue),
        ],
      }),
    );
  };
  let core = $state.raw<JsonFormsCore>(
    untrack(() => {
      if (initialDynamicReference !== undefined)
        return fallbackInitialCore(initialDynamicReference, 'dynamic');
      if (initialLocalReference || initialExternalReference)
        return fallbackInitialCore(initialLocalReference ?? initialExternalReference!);
      try {
        return middleware(
          { data: initialData, schema: initialSchema, uischema: initialUiSchema },
          Actions.init(initialData, initialSchema, initialUiSchema, {
            validationMode: initialValidationMode,
            ajv: initialAjv,
            additionalErrors: initialAdditionalErrors,
          }),
          coreReducer,
        );
      } catch (error) {
        const reference = missingReference(error);
        if (!reference) throw error;
        return fallbackInitialCore(reference);
      }
    }),
  );
  const presentationCore = $derived.by((): JsonFormsCore =>
    core.schema === schemaToUse && presentationSchemaToUse !== schemaToUse
      ? { ...core, schema: presentationSchemaToUse }
      : core,
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
    const next = middleware(core, action, coreReducer);
    if (action.type === 'jsonforms/UPDATE') collectionIdentity.update(core.data, next.data, action);
    else collectionIdentity.reconcile(core.data, next.data);
    core = next;
    dataToUse = core.data;
  };

  const jsonforms: JsonFormsSubStates = {
    get core() {
      return presentationCore;
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
  setContext(CollectionIdentityContextSymbol, collectionIdentity);
  setContext(InitialFocusDiagnosticSymbol, initialFocusDiagnostic);
  setContext(UIDiagnosticContextSymbol, diagnosticSink);
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
    void ajv;

    if (skipInitialSchemaSync()) {
      return;
    }

    let unresolved: string | undefined;
    const nextSchema = localSchemaResources(
      (schema ?? inferJsonSchema(dataToUse)) as JsonSchema,
      (reference) => {
        unresolved ??= reference;
      },
    );
    schemaToUse = nextSchema;
    dynamicReferenceToUse = dynamicSchemaReference(nextSchema);
    presentationSchemaToUse = suppliedSchemaResources(
      nextSchema,
      ajv ?? defaultAjv,
      (reference) => {
        unresolved ??= reference;
      },
    );
    unresolvedReferenceToUse = unresolved;
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

    formConfig = configReducer(undefined, Actions.setConfig(canonicalConfig(config)));
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
    const _unresolvedReference = unresolvedReferenceToUse;
    const _dynamicReference = dynamicReferenceToUse;
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
        additionalErrors: hostAdditionalErrors,
      });
      let next: JsonFormsCore;
      const fallbackNextCore = (reference: string, issue: ReferenceIssue = 'unresolved') => {
        schemaReferenceError = reference;
        schemaReferenceIssue = issue;
        return coreReducer(
          core,
          Actions.updateCore(_data, referenceFallbackSchema, _uischema, {
            validationMode: _validationMode,
            ajv: _ajv,
            additionalErrors: [
              ...hostAdditionalErrors,
              referenceError(reference, i18n?.locale, i18n?.translate, issue),
            ],
          }),
        );
      };
      if (_dynamicReference !== undefined) {
        next = fallbackNextCore(_dynamicReference, 'dynamic');
      } else if (_unresolvedReference) {
        next = fallbackNextCore(_unresolvedReference);
      } else {
        try {
          next = middleware(core, action, coreReducer);
          schemaReferenceError = undefined;
        } catch (error) {
          const reference = missingReference(error);
          if (!reference) throw error;
          next = fallbackNextCore(reference);
        }
      }
      collectionIdentity.reconcile(core.data, next.data);
      core = next;
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
    const current =
      schemaReferenceError === undefined &&
      core.validationMode !== 'NoValidation' &&
      core.validator !== undefined;
    const notify = onvaliditychange;
    untrack(() =>
      notify?.({
        errors,
        additionalErrors: additional,
        pending,
        current,
        valid: current && !pending && errors.length === 0 && additional.length === 0,
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
    typeof presentationCore.schema === 'boolean'
      ? presentationCore.schema
        ? {}
        : { type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'], not: {} }
      : presentationCore.schema,
  );
  const rendererShape = $derived(JSON.stringify(rendererSchema?.type));
</script>

{#if schemaReferenceError !== undefined}
  <p role="alert" data-schema-reference-error>
    {referenceMessage(
      schemaReferenceError,
      formI18n?.locale,
      formI18n?.translate,
      schemaReferenceIssue,
    )}
  </p>
{:else if rendererSchema && core.uischema}
  {#key rendererShape}
    <DispatchRenderer schema={rendererSchema} uischema={core.uischema} path="" />
  {/key}
{/if}
