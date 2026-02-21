<script lang="ts">
  import { onMount } from 'svelte';
  import type { JsonFormsChangeEvent, JsonFormsProps } from '@chobantonov/jsonforms-svelte';
  import type { ErrorObject } from 'ajv';

  type JsonInput = unknown;

  type JsonFormsWebComponentElement = HTMLElement & {
    schema?: string;
    uischema?: string;
    uischemas?: string;
    data?: string;
    config?: string;
    readonly?: boolean | string;
    validationMode?: JsonFormsProps['validationMode'];
    locale?: string;
    dark?: boolean | string;
    translations?: string;
    additionalErrors?: string;
    customStyle?: string;
  };

  interface Props {
    data?: JsonInput;
    schema?: JsonInput;
    uischema?: JsonInput;
    uischemas?: JsonInput;
    config?: JsonInput;
    readonly?: boolean | string;
    validationMode?: JsonFormsProps['validationMode'];
    locale?: string;
    dark?: boolean | string;
    translations?: JsonInput;
    additionalErrors?: ErrorObject[];
    customStyle?: string;
    onchange?: (event: JsonFormsChangeEvent) => void;
  }

  let {
    data = undefined,
    schema = undefined,
    uischema = undefined,
    uischemas = undefined,
    config = undefined,
    readonly = false,
    validationMode = 'ValidateAndShow',
    locale = 'en',
    dark = 'auto',
    translations = undefined,
    additionalErrors = undefined,
    customStyle = '',
    onchange,
  }: Props = $props();

  let componentLoaded = $state(false);
  let element = $state<JsonFormsWebComponentElement | null>(null);
  const bundlePath = '/js/jsonforms-svelte-flowbite.js';

  const stringifyJson = (value: unknown): string | undefined => {
    if (value === undefined) return undefined;
    return JSON.stringify(value);
  };

  onMount(async () => {
    await import(/* @vite-ignore */ bundlePath);
    componentLoaded = true;
  });

  $effect(() => {
    if (!element) return;
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent).detail as JsonFormsChangeEvent;
      onchange?.(detail);
    };

    element.addEventListener('change', handleChange as EventListener);
    return () => element?.removeEventListener('change', handleChange as EventListener);
  });
</script>

{#if componentLoaded}
  <jsonforms-svelte-flowbite
    bind:this={element}
    schema={stringifyJson(schema)}
    uischema={stringifyJson(uischema)}
    uischemas={stringifyJson(uischemas)}
    data={stringifyJson(data)}
    config={stringifyJson(config)}
    readonly={readonly}
    {validationMode}
    {locale}
    {dark}
    translations={stringifyJson(translations)}
    additionalErrors={stringifyJson(additionalErrors)}
    customStyle={customStyle}
  ></jsonforms-svelte-flowbite>
{/if}
