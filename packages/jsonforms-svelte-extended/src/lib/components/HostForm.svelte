<script lang="ts">
  import {
    emitUIDiagnostic,
    parseHostData,
    parseHostSchemas,
    parseJson,
    parseBoolean,
    createCatalogTranslator as createTranslator,
    type createHostEventHandlers,
    type JsonFormsProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { createAjv } from '../core/validate';
  import JsonForms from './JsonForms.svelte';
  import { defaultMiddleware, type JsonFormsI18nState } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import type { HostFormProps } from './hostFormProps';
  let {
    data = undefined,
    schema = undefined,
    uischema = undefined,
    uischemas = undefined,
    config = {},
    external = undefined,
    readonly = false,
    validationMode = 'ValidateAndShow',
    locale = 'en',
    translations = undefined,
    additionalErrors = [],
    externalSchemas = [],
    ajv: suppliedAjv = undefined,
    events,
    renderers,
    cells,
  }: HostFormProps & {
    events: ReturnType<typeof createHostEventHandlers>;
    renderers: JsonFormsProps['renderers'];
    cells: JsonFormsProps['cells'];
  } = $props();

  const parsedData = $derived(parseHostData(data));
  const parsedSchema = $derived(parseJson(schema, undefined));
  const schemaResources = $derived(parseHostSchemas(externalSchemas));
  const parsedUiSchema = $derived(parseJson(uischema, undefined));
  const parsedUiSchemas = $derived(parseJson(uischemas, []));
  const parsedConfig = $derived(parseJson(config, undefined));
  const parsedExternal = $derived(parseJson(external, undefined) as JsonFormsProps['external']);
  const parsedTranslations = $derived(parseJson(translations, undefined));

  const parsedAdditionalErrors = $derived.by(() => {
    const direct = parseJson(additionalErrors, undefined as ErrorObject[] | undefined);
    if (direct !== undefined) {
      return direct;
    }

    return [];
  });

  const i18n = $derived.by((): JsonFormsI18nState => {
    return {
      locale,
      translate: createTranslator(locale, parsedTranslations, events.handleDiagnostic),
    };
  });

  const ajv = $derived.by(() => {
    if (suppliedAjv) return suppliedAjv;
    void parsedSchema;
    return createAjv(
      i18n,
      () => parsedConfig,
      schemaResources,
      'draft-07',
      (code, payload) => emitUIDiagnostic(events.handleDiagnostic, code, payload),
    );
  });
</script>

<JsonForms
  {cells}
  data={parsedData}
  schema={parsedSchema}
  uischema={parsedUiSchema}
  uischemas={parsedUiSchemas}
  config={parsedConfig}
  external={parsedExternal}
  readonly={parseBoolean(readonly, false)}
  {validationMode}
  {i18n}
  {renderers}
  {ajv}
  additionalErrors={parsedAdditionalErrors}
  middleware={defaultMiddleware}
  onchange={events.handleChange}
  onvaliditychange={events.handleValidityChange}
  ondiagnostic={events.handleDiagnostic}
  onhandleaction={events.handleAction}
/>
