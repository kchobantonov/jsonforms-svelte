<script lang="ts">
  import {
    JsonForms as BaseJsonForms,
    generateRootUISchema,
    emitUIDiagnostic,
    type JsonFormsProps as BaseJsonFormsProps,
    type JsonFormsChangeEvent,
    type JsonFormsValidityEvent,
  } from '@chobantonov/jsonforms-svelte';
  import { Generate, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
  import { setContext, untrack } from 'svelte';
  import {
    FormContextSymbol,
    HostRevisionContextSymbol,
    type ActionEvent,
    type FormContext,
  } from '../core/types.js';
  import {
    parseAndTransformUISchemaRegistryEntries,
    resolveUISchemaValidations,
  } from '../core/uischemas.js';
  import { createPresentationErrorTranslator } from '../core/ajv-i18n/index.js';
  import { createAjv } from '../core/validate.js';

  export interface JsonFormsProps extends BaseJsonFormsProps {
    context?: Record<string, unknown>;
    onhandleaction?: (event: ActionEvent) => void | Promise<void>;
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
    middleware = undefined,
    onchange,
    onvaliditychange,
    ondiagnostic,
    context = {},
    onhandleaction,
  }: JsonFormsProps = $props();

  const isObject = (elem: unknown): elem is object => {
    return elem !== null && typeof elem === 'object';
  };

  const initialData = untrack(() => data);
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
  const skipInitialDataSync = skipInitialRun();

  let dataToUse = $state<unknown>(initialData);
  const reportDiagnostic = (code: string, payload: Parameters<typeof emitUIDiagnostic>[2]) =>
    emitUIDiagnostic(ondiagnostic, code, payload);
  let schemaToUse = $derived.by<JsonSchema | boolean | undefined>(() => {
    return schema ?? Generate.jsonSchema(dataToUse);
  });
  let uischemaToUse = $derived.by<UISchemaElement | undefined>(() => {
    const source = uischema ?? generateRootUISchema(schemaToUse!);

    return resolveUISchemaValidations(
      source,
      isObject(config) ? (config as Record<string, unknown>) : undefined,
      reportDiagnostic,
    );
  });
  let errorsToUse = $state<JsonFormsChangeEvent['errors']>(undefined);
  let combinedAdditionalErrors = $state(untrack(() => additionalErrors));
  let defaultAjvSchema = untrack(() => schema);
  let cachedDefaultAjv = createAjv(
    () => i18n,
    () => config,
    [],
    'draft-07',
    reportDiagnostic,
  );
  const defaultAjv = $derived.by(() => {
    // Keep compiled validators across data/config updates. A different
    // authored schema starts a new validator and diagnostic interval.
    if (!Object.is(schema, defaultAjvSchema)) {
      defaultAjvSchema = schema;
      cachedDefaultAjv = createAjv(
        () => i18n,
        () => config,
        [],
        'draft-07',
        reportDiagnostic,
      );
    }
    return cachedDefaultAjv;
  });
  const ajvToUse = $derived(ajv ?? defaultAjv);
  const presentationI18n = $derived({
    ...i18n,
    translateError: i18n?.translateError ?? createPresentationErrorTranslator(i18n?.locale),
  });
  let cachedRegistrySource = untrack(() => uischemas);
  let cachedRegistryConfig = untrack(() => config);
  let cachedRegistryEntries = parseAndTransformUISchemaRegistryEntries(
    cachedRegistrySource as Parameters<typeof parseAndTransformUISchemaRegistryEntries>[0],
    isObject(cachedRegistryConfig) ? (cachedRegistryConfig as Record<string, unknown>) : undefined,
    reportDiagnostic,
  );
  const uischemasToUse = $derived.by(() => {
    // Tester failure intervals belong to an authored registry/configuration,
    // not to unrelated data updates of the form.
    if (!Object.is(uischemas, cachedRegistrySource) || !Object.is(config, cachedRegistryConfig)) {
      cachedRegistrySource = uischemas;
      cachedRegistryConfig = config;
      cachedRegistryEntries = parseAndTransformUISchemaRegistryEntries(
        uischemas as Parameters<typeof parseAndTransformUISchemaRegistryEntries>[0],
        isObject(config) ? (config as Record<string, unknown>) : undefined,
        reportDiagnostic,
      );
    }
    return cachedRegistryEntries;
  });

  let previousHostData = initialData;
  let previousHostSchema = untrack(() => schema);
  let previousHostUi = untrack(() => uischema);
  let previousHostConfig = untrack(() => config);
  let hostRevision = $state(0);
  setContext(HostRevisionContextSymbol, {
    get current() {
      return hostRevision;
    },
  });
  $effect(() => {
    // Read before the initial-run guard so later host replacements stay reactive.
    void data;
    void schema;
    void uischema;
    void config;

    if (skipInitialDataSync()) {
      return;
    }

    const dataChanged = !Object.is(data, previousHostData);
    const schemaChanged = !Object.is(schema, previousHostSchema);
    const uiChanged = !Object.is(uischema, previousHostUi);
    const configChanged = !Object.is(config, previousHostConfig);
    if (dataChanged || schemaChanged || uiChanged || configChanged) hostRevision += 1;
    previousHostSchema = schema;
    previousHostUi = uischema;
    previousHostConfig = config;
    if (dataChanged) {
      previousHostData = data;
      dataToUse = data;
    }
  });

  const getExternalContext = (): Record<string, unknown> => {
    return typeof context === 'object' && context !== null ? context : {};
  };
  const warnedUnhandledActions = new Set<string>();
  $effect(() => {
    if (onhandleaction) warnedUnhandledActions.clear();
  });

  const builtInContext: FormContext = {
    get core() {
      return { data: dataToUse };
    },
    get config() {
      return config;
    },
    get readonly() {
      return readonly;
    },
    get locale() {
      return i18n?.locale;
    },
    get translate() {
      return i18n?.translate;
    },
    get data() {
      return dataToUse;
    },
    set data(value: unknown) {
      dataToUse = value;
    },
    get schema() {
      return schemaToUse;
    },
    get uischema() {
      return uischemaToUse;
    },
    get errors() {
      return errorsToUse;
    },
    get additionalErrors() {
      return combinedAdditionalErrors;
    },
    async fireActionEvent(
      action: string,
      params: Record<string, unknown> | undefined,
      el: Element,
      element?: UISchemaElement,
    ) {
      const source: ActionEvent = {
        action,
        context: formContext,
        params: params ? { ...params } : {},
        $el: el,
        element,
      };

      if (onhandleaction) {
        warnedUnhandledActions.delete(action);
        await onhandleaction(source);
      } else if (!warnedUnhandledActions.has(action)) {
        warnedUnhandledActions.add(action);
        reportDiagnostic('action.unhandled', {
          severity: 'warning',
          message: 'No host action handler is registered for this action.',
          details: { action, element: element?.type },
        });
      }

      if (typeof source.callback === 'function') {
        await source.callback(source);
      }
    },
  };

  const formContext: FormContext = new Proxy(builtInContext, {
    get(target, property, receiver) {
      if (property in target) {
        return Reflect.get(target, property, receiver);
      }

      return Reflect.get(getExternalContext(), property, receiver);
    },
    has(target, property) {
      return property in target || property in getExternalContext();
    },
    ownKeys(target) {
      return [...new Set([...Reflect.ownKeys(getExternalContext()), ...Reflect.ownKeys(target)])];
    },
    getOwnPropertyDescriptor(target, property) {
      if (property in target) {
        return Reflect.getOwnPropertyDescriptor(target, property);
      }

      const descriptor = Reflect.getOwnPropertyDescriptor(getExternalContext(), property);
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });

  setContext(FormContextSymbol, formContext);

  const handleValidityChange = (event: JsonFormsValidityEvent) => {
    combinedAdditionalErrors = [...event.additionalErrors];
    onvaliditychange?.(event);
  };

  const handleChange = (event: JsonFormsChangeEvent) => {
    dataToUse = event.data;
    errorsToUse = event.errors;
    onchange?.(event);
  };
</script>

<BaseJsonForms
  data={dataToUse}
  schema={schemaToUse}
  uischema={uischemaToUse}
  {renderers}
  {cells}
  {config}
  {readonly}
  uischemas={uischemasToUse}
  {validationMode}
  ajv={ajvToUse}
  i18n={presentationI18n}
  {additionalErrors}
  {middleware}
  onchange={handleChange}
  onvaliditychange={handleValidityChange}
  {ondiagnostic}
/>
