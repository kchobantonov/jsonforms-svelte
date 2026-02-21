<svelte:options
  customElement={{
    tag: 'jsonforms-svelte-flowbite',
    shadow: {
      mode: 'open',
    },
  }}
/>

<script lang="ts">
  import {
    JsonForms,
    type JsonFormsChangeEvent,
    type JsonFormsProps,
  } from '@chobantonov/jsonforms-svelte';
  import { createAjv, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
  import {
    createTranslator,
  } from './i18n.js';
  import {
    parseBoolean,
    parseDarkMode,
    parseJson,
    type JsonInput,
  } from './common.js';
  import { defaultMiddleware, type JsonFormsI18nState } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import baseStyles from './webcomponent.css?inline';
  import { Card, ThemeProvider, type ThemeConfig } from 'flowbite-svelte';

  interface JsonFormsWebComponentProps {
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
    additionalErrors?: JsonInput;
    customStyle?: string;
  }

  const ajv = createAjv();

  let {
    data = undefined,
    schema = undefined,
    uischema = undefined,
    uischemas = undefined,
    config = {},
    readonly = false,
    validationMode = 'ValidateAndShow',
    locale = 'en',
    dark = 'auto',
    translations = undefined,
    additionalErrors = [],
    customStyle = '',
  }: JsonFormsWebComponentProps = $props();

  let rootElement: HTMLDivElement | null = null;
  let formContainer: HTMLDivElement | null = null;
  let prefersDark = $state(false);
  let firstChangeDispatched = $state(false);
  let mediaQuery: MediaQueryList | null = null;
  const baseStyleId = 'jsonforms-svelte-flowbite-base-style';
  const customStyleId = 'jsonforms-svelte-flowbite-custom-style';

  const parsedData = $derived.by(() => {
    if (typeof data !== 'string') {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  });

  const parsedSchema = $derived(parseJson(schema, undefined));
  const parsedUiSchema = $derived(parseJson(uischema, undefined));
  const parsedUiSchemas = $derived(parseJson(uischemas, []));
  const parsedConfig = $derived(parseJson(config, undefined));
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
      translate: createTranslator(locale, parsedTranslations),
    };
  });

  const dispatchChangeEvent = (event: JsonFormsChangeEvent) => {
    const rootNode = rootElement?.getRootNode();
    const host = rootNode instanceof ShadowRoot ? rootNode.host : null;
    if (!(host instanceof HTMLElement)) return;

    host.dispatchEvent(
      new CustomEvent<JsonFormsChangeEvent>('change', {
        detail: event,
        bubbles: true,
        composed: true,
      }),
    );
  };

  const handleChange = (event: JsonFormsChangeEvent) => {
    // The first JsonForms change can happen during initial render/upgrade.
    // Defer it once so host listeners have a chance to attach.
    if (!firstChangeDispatched) {
      firstChangeDispatched = true;
      setTimeout(() => dispatchChangeEvent(event), 0);
      return;
    }

    dispatchChangeEvent(event);
  };

  const effectiveDark = $derived.by(() => {
    const mode = parseDarkMode(dark);
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return prefersDark;
  });

  $effect(() => {
    if (typeof window === 'undefined') return;

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDark = mediaQuery.matches;

    const onChange = (event: MediaQueryListEvent) => {
      prefersDark = event.matches;
    };
    mediaQuery.addEventListener('change', onChange);

    return () => mediaQuery?.removeEventListener('change', onChange);
  });

  $effect(() => {
    const rootNode = rootElement?.getRootNode();
    if (!(rootNode instanceof ShadowRoot)) return;

    let baseStyleTag = rootNode.getElementById(baseStyleId) as HTMLStyleElement | null;
    if (!baseStyleTag) {
      baseStyleTag = document.createElement('style');
      baseStyleTag.id = baseStyleId;
      rootNode.prepend(baseStyleTag);
    }
    if (baseStyleTag.textContent !== baseStyles) {
      baseStyleTag.textContent = baseStyles;
    }

    let customStyleTag = rootNode.getElementById(customStyleId) as HTMLStyleElement | null;
    const nextCustomStyle = customStyle?.trim() ?? '';

    if (!nextCustomStyle) {
      customStyleTag?.remove();
      return;
    }

    if (!customStyleTag) {
      customStyleTag = document.createElement('style');
      customStyleTag.id = customStyleId;
      rootNode.append(customStyleTag);
    }

    if (customStyleTag.textContent !== nextCustomStyle) {
      customStyleTag.textContent = nextCustomStyle;
    }
  });

  $effect(() => {
    if (!formContainer) return;
    formContainer.classList.toggle('dark', effectiveDark);
  });

  // 1. fix the clear icon position in RTL - end-2 rtl:!right-auto
  // 2. make the clearable icon to appear only when input hover or input focus
  const theme: ThemeConfig = {
    input: {
      base: 'group',
      close:
        'end-2 rtl:!right-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity',
    },
    search: {
      base: 'group',
      close:
        'end-2 rtl:!right-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity',
    },
    select: {
      base: 'group',
      close:
        'end-8 rtl:!right-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity',
    },
    textarea: {
      div: 'group',
      close:
        'end-2 rtl:!right-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity',
    },
  };
</script>

<div bind:this={rootElement}>
  <div bind:this={formContainer}>
    <ThemeProvider {theme}>
      <Card class="min-w-full rounded-none border-0 bg-white p-0 shadow-none dark:bg-gray-900">
        <JsonForms
          data={parsedData}
          schema={parsedSchema}
          uischema={parsedUiSchema}
          uischemas={parsedUiSchemas}
          config={parsedConfig}
          readonly={parseBoolean(readonly, false)}
          {validationMode}
          {i18n}
          renderers={flowbiteRenderers}
          cells={[]}
          {ajv}
          additionalErrors={parsedAdditionalErrors}
          middleware={defaultMiddleware}
          onchange={handleChange}
        />
      </Card>
    </ThemeProvider>
  </div>
</div>
