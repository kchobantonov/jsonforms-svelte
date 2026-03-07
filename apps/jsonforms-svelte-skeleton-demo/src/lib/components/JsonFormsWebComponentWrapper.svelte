<script lang="ts">
  import { asset } from '$app/paths';
  import type { JsonFormsChangeEvent, JsonFormsProps } from '@chobantonov/jsonforms-svelte';
  import type { ErrorObject } from 'ajv';
  import { onMount } from 'svelte';

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
    mode?: boolean | string;
    theme?: string;
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
    mode?: boolean | string;
    theme?: string;
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
    mode = 'system',
    theme = 'modern',
    translations = undefined,
    additionalErrors = undefined,
    customStyle = '',
    onchange,
  }: Props = $props();

  let componentLoaded = $state(false);
  let element = $state<JsonFormsWebComponentElement | null>(null);
  const bundlePath = asset('/js/jsonforms-svelte-skeleton.js');

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
  <jsonforms-svelte-skeleton
    bind:this={element}
    schema={stringifyJson(schema)}
    uischema={stringifyJson(uischema)}
    uischemas={stringifyJson(uischemas)}
    data={stringifyJson(data)}
    config={stringifyJson(config)}
    {readonly}
    {validationMode}
    {locale}
    {mode}
    {theme}
    translations={stringifyJson(translations)}
    additionalErrors={stringifyJson(additionalErrors)}
    {customStyle}
  ></jsonforms-svelte-skeleton>
{/if}
