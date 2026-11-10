<svelte:options
  customElement={{
    tag: 'jsonforms-svelte-shadcn',
    shadow: 'open',
  }}
/>

<script lang="ts">
  import {
    emitUIDiagnostic,
    type JsonFormsChangeEvent,
    type JsonFormsValidityEvent,
    type UIDiagnostic,
    type JsonFormsProps,
  } from '@chobantonov/jsonforms-svelte';
  import { createAjv, JsonForms, type ActionEvent } from '@chobantonov/jsonforms-svelte-extended';
  import {
    buildShadcnDesignSystemCss,
    normalizeShadcnDesignSystem,
    PortalTargetContextSymbol,
    shadcnCells,
    shadcnRenderers,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import {
    shadcnExtendedCells,
    shadcnExtendedRenderers,
  } from '@chobantonov/jsonforms-svelte-shadcn-extended';
  import { defaultMiddleware, type JsonFormsI18nState, type JsonSchema } from '@jsonforms/core';
  import type Ajv from 'ajv';
  import type { ErrorObject } from 'ajv';
  import { setContext } from 'svelte';
  import {
    dispatchHostEvent,
    parseBoolean,
    parseJson,
    parseMode,
    type JsonInput,
  } from './common.js';
  import { createTranslator } from './i18n.js';
  import baseStyles from './webcomponent.css?inline';

  interface JsonFormsWebComponentProps {
    data?: JsonInput;
    schema?: JsonInput;
    uischema?: JsonInput;
    uischemas?: JsonInput;
    config?: JsonInput;
    external?: JsonInput;
    readonly?: boolean | string;
    validationMode?: JsonFormsProps['validationMode'];
    locale?: string;
    mode?: boolean | string;
    theme?: string;
    designSystem?: JsonInput;
    translations?: JsonInput;
    additionalErrors?: JsonInput;
    externalSchemas?: JsonInput;
    ajv?: Ajv;
    customStyle?: string;
  }

  const renderers = [...shadcnRenderers, ...shadcnExtendedRenderers];
  const cells = [...shadcnCells, ...shadcnExtendedCells];

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
    theme = 'slate',
    designSystem = undefined,
    translations = undefined,
    additionalErrors = [],
    externalSchemas = [],
    ajv: suppliedAjv = undefined,
    customStyle = '',
  }: JsonFormsWebComponentProps = $props();

  let rootElement: HTMLDivElement | null = null;
  let formContainer = $state<HTMLDivElement | null>(null);
  let firstChangeDispatched = $state(false);

  const shadowBaseStyleId = 'jsonforms-svelte-shadcn-base-style';
  const shadowCustomStyleId = 'jsonforms-svelte-shadcn-custom-style';
  const hostElement = $host();
  setContext(PortalTargetContextSymbol, () => formContainer);

  // Theme vars are generated under `[data-theme=...]` selectors. Portaled overlays
  // can render outside the themed wrapper, so also scope those selectors to `:host(...)`.
  const baseStylesWithHostThemes = baseStyles.replace(
    /(^|,)\s*(\[data-theme=[^\]]+\])/gm,
    '$1 :host($2), $2',
  );

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
  const parsedExternalSchemas = $derived(parseJson<unknown>(externalSchemas, []));
  const schemaResources = $derived(
    Array.isArray(parsedExternalSchemas)
      ? parsedExternalSchemas.filter(
          (value): value is JsonSchema | boolean =>
            typeof value === 'boolean' ||
            (typeof value === 'object' && value !== null && !Array.isArray(value)),
        )
      : [],
  );
  const parsedUiSchema = $derived(parseJson(uischema, undefined));
  const parsedUiSchemas = $derived(parseJson(uischemas, []));
  const parsedConfig = $derived(parseJson(config, undefined));
  const parsedExternal = $derived(parseJson(external, undefined) as JsonFormsProps['external']);
  const parsedTranslations = $derived(parseJson(translations, undefined));
  const parsedDesignSystem = $derived(
    normalizeShadcnDesignSystem(parseJson(designSystem, undefined)),
  );
  const designSystemStyle = $derived(
    [
      buildShadcnDesignSystemCss(parsedDesignSystem, ':host', ":host([data-mode='dark'])"),
      // The themed form wrapper declares its own semantic tokens in the base
      // stylesheet. Override those tokens too, so controls and portalled
      // overlays use the same selected design system as the native demo.
      buildShadcnDesignSystemCss(
        parsedDesignSystem,
        '[data-theme]',
        "[data-theme][data-mode='dark']",
      ),
    ].join('\n'),
  );

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
      translate: createTranslator(locale, parsedTranslations, handleDiagnostic),
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
      (code, payload) => emitUIDiagnostic(handleDiagnostic, code, payload),
    );
  });

  const dispatchChangeEvent = (event: JsonFormsChangeEvent) => {
    dispatchHostEvent(hostElement instanceof HTMLElement ? hostElement : null, 'change', event);
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

  const handleValidityChange = (event: JsonFormsValidityEvent) => {
    dispatchHostEvent(
      hostElement instanceof HTMLElement ? hostElement : null,
      'validity-change',
      event,
    );
  };
  const handleDiagnostic = (diagnostic: UIDiagnostic) => {
    dispatchHostEvent(
      hostElement instanceof HTMLElement ? hostElement : null,
      'diagnostic',
      diagnostic,
    );
  };

  const handleAction = async (event: ActionEvent) => {
    dispatchHostEvent(
      hostElement instanceof HTMLElement ? hostElement : null,
      'handle-action',
      event,
    );
    await (event as ActionEvent & { hostActionCompletion?: Promise<void> }).hostActionCompletion;
  };

  const effectiveMode = $derived.by(() => {
    return parseMode(mode);
  });
  const effectiveTheme = $derived.by(() => {
    const normalized = typeof theme === 'string' ? theme.trim() : '';
    return normalized || 'slate';
  });

  $effect(() => {
    if (!(hostElement instanceof HTMLElement)) return;
    hostElement.setAttribute('data-theme', effectiveTheme);
    hostElement.setAttribute('data-mode', effectiveMode);
    hostElement.setAttribute('data-style', parsedDesignSystem.style);
    hostElement.setAttribute('data-icon-library', parsedDesignSystem.iconLibrary);
    hostElement.setAttribute('data-menu-color', parsedDesignSystem.menuColor);
    hostElement.setAttribute('data-menu-accent', parsedDesignSystem.menuAccent);
  });

  $effect(() => {
    const rootNode = rootElement?.getRootNode();
    if (!(rootNode instanceof ShadowRoot)) return;

    let shadowBaseStyleTag = rootNode.getElementById(shadowBaseStyleId) as HTMLStyleElement | null;
    if (!shadowBaseStyleTag) {
      shadowBaseStyleTag = document.createElement('style');
      shadowBaseStyleTag.id = shadowBaseStyleId;
      rootNode.prepend(shadowBaseStyleTag);
    }
    if (shadowBaseStyleTag.textContent !== baseStylesWithHostThemes) {
      shadowBaseStyleTag.textContent = baseStylesWithHostThemes;
    }

    let shadowCustomStyleTag = rootNode.getElementById(
      shadowCustomStyleId,
    ) as HTMLStyleElement | null;
    const additionalCustomStyle = customStyle?.trim() ?? '';
    const nextCustomStyle = `${designSystemStyle}\n${additionalCustomStyle}`.trim();

    if (!nextCustomStyle) {
      shadowCustomStyleTag?.remove();
      return;
    }

    if (!shadowCustomStyleTag) {
      shadowCustomStyleTag = document.createElement('style');
      shadowCustomStyleTag.id = shadowCustomStyleId;
      rootNode.append(shadowCustomStyleTag);
    }

    if (shadowCustomStyleTag.textContent !== nextCustomStyle) {
      shadowCustomStyleTag.textContent = nextCustomStyle;
    }
  });
</script>

<div
  bind:this={rootElement}
  class="bg-background text-foreground min-w-full overflow-visible"
  data-theme={effectiveTheme}
  data-mode={effectiveMode}
  data-style={parsedDesignSystem.style}
  data-icon-library={parsedDesignSystem.iconLibrary}
  data-menu-color={parsedDesignSystem.menuColor}
  data-menu-accent={parsedDesignSystem.menuAccent}
>
  <div bind:this={formContainer}>
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
      onchange={handleChange}
      onvaliditychange={handleValidityChange}
      ondiagnostic={handleDiagnostic}
      onhandleaction={handleAction}
    />
  </div>
</div>
