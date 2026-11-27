<svelte:options
  customElement={{
    tag: 'jsonforms-svelte-skeleton',
    shadow: 'open',
  }}
/>

<script lang="ts">
  import {
    createHostEventHandlers,
    syncShadowStyles,
    hostThemeSelectors,
    hostThemeName,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { HostForm, type HostFormProps } from '@chobantonov/jsonforms-svelte-extended';
  import {
    PortalTargetContextSymbol,
    skeletonCells,
    skeletonRenderers,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import {
    skeletonExtendedCells,
    skeletonExtendedRenderers,
  } from '@chobantonov/jsonforms-svelte-skeleton-extended';
  import { setContext } from 'svelte';
  import { parseMode } from './common.js';
  import baseStyles from './webcomponent.css?inline';

  interface JsonFormsWebComponentProps extends HostFormProps {
    mode?: boolean | string;
    theme?: string;
    customStyle?: string;
  }

  const renderers = [...skeletonRenderers, ...skeletonExtendedRenderers];
  const cells = [...skeletonCells, ...skeletonExtendedCells];

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
    theme = 'cerberus',
    translations = undefined,
    additionalErrors = [],
    externalSchemas = [],
    ajv: suppliedAjv = undefined,
    customStyle = '',
  }: JsonFormsWebComponentProps = $props();

  let rootElement: HTMLDivElement | null = null;
  let formContainer = $state<HTMLDivElement | null>(null);

  const shadowBaseStyleId = 'jsonforms-svelte-skeleton-base-style';
  const shadowCustomStyleId = 'jsonforms-svelte-skeleton-custom-style';
  const hostElement = $host();
  setContext(PortalTargetContextSymbol, () => formContainer);

  const baseStylesWithHostThemes = hostThemeSelectors(baseStyles);

  const events = createHostEventHandlers(hostElement);

  const effectiveMode = $derived(parseMode(mode));
  const effectiveTheme = $derived(hostThemeName(theme, 'cerberus'));

  $effect(() => {
    if (!(hostElement instanceof HTMLElement)) return;
    hostElement.setAttribute('data-theme', effectiveTheme);
    hostElement.setAttribute('data-mode', effectiveMode);
  });

  $effect(() =>
    syncShadowStyles(
      rootElement?.getRootNode(),
      shadowBaseStyleId,
      baseStylesWithHostThemes,
      shadowCustomStyleId,
      customStyle?.trim() ?? '',
    ),
  );
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

<div
  bind:this={rootElement}
  class="preset-filled-surface-50-950 min-w-full overflow-visible"
  data-theme={effectiveTheme}
  data-mode={effectiveMode}
>
  <div bind:this={formContainer}>
    <HostForm {...form} {cells} {renderers} {events} />
  </div>
</div>
