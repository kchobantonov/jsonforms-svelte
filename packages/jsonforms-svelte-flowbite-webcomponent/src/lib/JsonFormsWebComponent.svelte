<svelte:options
  customElement={{
    tag: 'jsonforms-svelte-flowbite',
    shadow: 'open',
  }}
/>

<script lang="ts">
  import { MediaQuery } from 'svelte/reactivity';
  import { createFlowbiteHostTheme } from '@chobantonov/jsonforms-svelte-flowbite';
  import {
    createHostEventHandlers,
    syncShadowStyles,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { HostForm, type HostFormProps } from '@chobantonov/jsonforms-svelte-extended';
  import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
  import {
    flowbiteExtendedCells,
    flowbiteExtendedRenderers,
  } from '@chobantonov/jsonforms-svelte-flowbite-extended';
  import { Card, ThemeProvider } from 'flowbite-svelte';
  import { parseMode } from './common.js';
  import baseStyles from './webcomponent.css?inline';

  interface JsonFormsWebComponentProps extends HostFormProps {
    mode?: boolean | string;
    customStyle?: string;
  }

  const renderers = [...flowbiteRenderers, ...flowbiteExtendedRenderers];
  const cells = [...flowbiteCells, ...flowbiteExtendedCells];

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
    mode = 'system',
    translations = undefined,
    additionalErrors = [],
    externalSchemas = [],
    ajv: suppliedAjv = undefined,
    customStyle = '',
  }: JsonFormsWebComponentProps = $props();

  let rootElement: HTMLDivElement | null = null;
  let formContainer: HTMLDivElement | null = null;
  const hostElement = $host();
  const prefersDark = new MediaQuery('(prefers-color-scheme: dark)', false);
  const baseStyleId = 'jsonforms-svelte-flowbite-base-style';
  const customStyleId = 'jsonforms-svelte-flowbite-custom-style';

  const events = createHostEventHandlers(hostElement, () => {
    const root = rootElement?.getRootNode();
    return root instanceof ShadowRoot ? root.host : null;
  });

  const effectiveDark = $derived.by(() => {
    const parsedMode = parseMode(mode);
    if (parsedMode === 'dark') return true;
    if (parsedMode === 'light') return false;
    return prefersDark.current;
  });

  $effect(() => {
    if (hostElement instanceof HTMLElement) {
      hostElement.setAttribute('data-mode', parseMode(mode));
    }
  });

  $effect(() =>
    syncShadowStyles(
      rootElement?.getRootNode(),
      baseStyleId,
      baseStyles,
      customStyleId,
      customStyle?.trim() ?? '',
    ),
  );

  $effect(() => {
    if (!formContainer) return;
    formContainer.classList.toggle('dark', effectiveDark);
  });

  const theme = createFlowbiteHostTheme();
  const form = $derived({
    data,
    schema,
    uischema,
    uischemas,
    config,
    external,
    readonly,
    validationMode,
    locale,
    translations,
    additionalErrors,
    externalSchemas,
    ajv: suppliedAjv,
  } satisfies HostFormProps);
</script>

<div bind:this={rootElement}>
  <div bind:this={formContainer}>
    <ThemeProvider {theme}>
      <Card class="min-w-full rounded-none border-0 bg-gray-50 p-0 shadow-none dark:bg-gray-800">
        <HostForm {...form} {cells} {renderers} {events} />
      </Card>
    </ThemeProvider>
  </div>
</div>
