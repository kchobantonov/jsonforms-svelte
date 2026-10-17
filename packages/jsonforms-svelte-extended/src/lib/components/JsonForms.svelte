<script lang="ts">
  import {
    JsonForms as BaseJsonForms,
    inferJsonSchema,
    generateRootUISchema,
    type JsonFormsProps as BaseJsonFormsProps,
    type JsonFormsChangeEvent,
    type JsonFormsValidityEvent,
  } from '@chobantonov/jsonforms-svelte';
  import { type JsonSchema, type UISchemaElement } from '@jsonforms/core';
  import { setContext, untrack } from 'svelte';
  import { FormContextSymbol, type ActionEvent, type FormContext } from '../core/types.js';
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
  let schemaToUse = $derived.by<JsonSchema | boolean | undefined>(() => {
    return schema ?? inferJsonSchema(dataToUse);
  });
  let uischemaToUse = $derived.by<UISchemaElement | undefined>(() => {
    const source = uischema ?? generateRootUISchema(schemaToUse!);

    return resolveUISchemaValidations(
      source,
      isObject(config) ? (config as Record<string, unknown>) : undefined,
    );
  });
  let errorsToUse = $state<JsonFormsChangeEvent['errors']>(undefined);
  let combinedAdditionalErrors = $state(untrack(() => additionalErrors));
  const defaultAjv = createAjv(
    () => i18n,
    () => config,
  );
  const ajvToUse = $derived(ajv ?? defaultAjv);
  const presentationI18n = $derived({
    ...i18n,
    translateError: i18n?.translateError ?? createPresentationErrorTranslator(i18n?.locale),
  });
  const uischemasToUse = $derived.by(() =>
    parseAndTransformUISchemaRegistryEntries(
      uischemas as Parameters<typeof parseAndTransformUISchemaRegistryEntries>[0],
      isObject(config) ? (config as Record<string, unknown>) : undefined,
    ),
  );

  let previousHostData = initialData;
  $effect(() => {
    // Read before the initial-run guard so later host replacements stay reactive.
    void data;

    if (skipInitialDataSync()) {
      return;
    }

    if (!Object.is(data, previousHostData)) {
      previousHostData = data;
      dataToUse = data;
    }
  });

  const getExternalContext = (): Record<string, unknown> => {
    return typeof context === 'object' && context !== null ? context : {};
  };

  const builtInContext: FormContext = {
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

      await onhandleaction?.(source);

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
/>
