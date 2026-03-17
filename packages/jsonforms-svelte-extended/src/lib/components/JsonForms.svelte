<script lang="ts">
  import {
    JsonForms as BaseJsonForms,
    type JsonFormsProps as BaseJsonFormsProps,
    type JsonFormsChangeEvent,
  } from "@chobantonov/jsonforms-svelte";
  import {
    Generate,
    type JsonSchema,
    type UISchemaElement,
  } from "@jsonforms/core";
  import { setContext, untrack } from "svelte";
  import {
    FormContextSymbol,
    type ActionEvent,
    type FormContext,
  } from "../core/types.js";
  import {
    parseAndTransformUISchemaRegistryEntries,
    resolveUISchemaValidations,
  } from "../core/uischemas.js";
  import { createAjv } from "../core/validate.js";

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
    validationMode = "ValidateAndShow",
    ajv = undefined,
    i18n = undefined,
    additionalErrors = [],
    middleware = undefined,
    onchange,
    context = {},
    onhandleaction,
  }: JsonFormsProps = $props();

  const isObject = (elem: any): elem is object => {
    return elem !== null && typeof elem === "object";
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

  let dataToUse = $state<any>(initialData);
  let schemaToUse = $derived.by<JsonSchema | undefined>(() => {
    const generatorData = isObject(dataToUse) ? dataToUse : {};
    return schema ?? Generate.jsonSchema(generatorData);
  });
  let uischemaToUse = $derived.by<UISchemaElement | undefined>(() => {
    const source = !schemaToUse
      ? uischema
      : (uischema ??
        Generate.uiSchema(schemaToUse, undefined, undefined, schemaToUse));

    return resolveUISchemaValidations(
      source,
      isObject(config) ? (config as Record<string, unknown>) : undefined,
    );
  });
  let errorsToUse = $state<JsonFormsChangeEvent["errors"]>(undefined);
  const defaultAjv = createAjv(() => i18n);
  const ajvToUse = $derived(ajv ?? defaultAjv);
  const uischemasToUse = $derived.by(() =>
    parseAndTransformUISchemaRegistryEntries(
      uischemas as Parameters<
        typeof parseAndTransformUISchemaRegistryEntries
      >[0],
      isObject(config) ? (config as Record<string, unknown>) : undefined,
    ),
  );

  $effect(() => {
    data;

    if (skipInitialDataSync()) {
      return;
    }

    dataToUse = data;
  });

  const getExternalContext = (): Record<string, unknown> => {
    return typeof context === "object" && context !== null ? context : {};
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
      return additionalErrors;
    },
    async fireActionEvent(
      action: string,
      params: Record<string, unknown> | undefined,
      el: Element,
    ) {
      const source: ActionEvent = {
        action,
        context: formContext,
        params: params ? { ...params } : {},
        $el: el,
      };

      await onhandleaction?.(source);

      if (typeof source.callback === "function") {
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
      return [
        ...new Set([
          ...Reflect.ownKeys(getExternalContext()),
          ...Reflect.ownKeys(target),
        ]),
      ];
    },
    getOwnPropertyDescriptor(target, property) {
      if (property in target) {
        return Reflect.getOwnPropertyDescriptor(target, property);
      }

      const descriptor = Reflect.getOwnPropertyDescriptor(
        getExternalContext(),
        property,
      );
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });

  setContext(FormContextSymbol, formContext);

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
  {i18n}
  {additionalErrors}
  {middleware}
  onchange={handleChange}
/>
