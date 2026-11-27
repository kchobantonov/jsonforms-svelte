<script module lang="ts">
  import type { HostFormProps } from '@chobantonov/jsonforms-svelte-extended';
  import type { JsonInput } from './common.js';
  export interface ShadcnHostProps extends HostFormProps {
    mode?: boolean | string;
    theme?: string;
    designSystem?: JsonInput;
    customStyle?: string;
  }
</script>

<script lang="ts">
  import {
    createHostEventHandlers,
    syncShadowStyles,
    hostThemeSelectors,
    hostThemeName,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { HostForm } from '@chobantonov/jsonforms-svelte-extended';
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
  import { setContext } from 'svelte';
  import { parseJson, parseMode } from './common.js';
  import type { Attachment } from 'svelte/attachments';
  import { untrack } from 'svelte';

  const renderers = [...shadcnRenderers, ...shadcnExtendedRenderers];
  const cells = [...shadcnCells, ...shadcnExtendedCells];

  let {
    hostElement,
    baseStyles,
    attach,
    mode = 'system',
    theme = 'slate',
    designSystem,
    customStyle = '',
    ...form
  }: ShadcnHostProps & {
    hostElement: HTMLElement;
    baseStyles: string;
    attach?: Attachment<HTMLDivElement>;
  } = $props();

  let rootElement: HTMLDivElement | null = null;
  let formContainer = $state<HTMLDivElement | null>(null);

  const shadowBaseStyleId = 'jsonforms-svelte-shadcn-base-style';
  const shadowCustomStyleId = 'jsonforms-svelte-shadcn-custom-style';
  setContext(PortalTargetContextSymbol, () => formContainer);

  const baseStylesWithHostThemes = $derived(hostThemeSelectors(baseStyles));

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

  const events = createHostEventHandlers(untrack(() => hostElement));

  const effectiveMode = $derived(parseMode(mode));
  const effectiveTheme = $derived(hostThemeName(theme, 'slate'));

  $effect(() => {
    if (!(hostElement instanceof HTMLElement)) return;
    hostElement.setAttribute('data-theme', effectiveTheme);
    hostElement.setAttribute('data-mode', effectiveMode);
    hostElement.setAttribute('data-style', parsedDesignSystem.style);
    hostElement.setAttribute('data-icon-library', parsedDesignSystem.iconLibrary);
    hostElement.setAttribute('data-menu-color', parsedDesignSystem.menuColor);
    hostElement.setAttribute('data-menu-accent', parsedDesignSystem.menuAccent);
  });

  $effect(() =>
    syncShadowStyles(
      rootElement?.getRootNode(),
      shadowBaseStyleId,
      baseStylesWithHostThemes,
      shadowCustomStyleId,
      `${designSystemStyle}\n${customStyle?.trim() ?? ''}`.trim(),
    ),
  );
</script>

<div
  bind:this={rootElement}
  {@attach attach}
  class="bg-background text-foreground min-w-full overflow-visible"
  data-theme={effectiveTheme}
  data-mode={effectiveMode}
  data-style={parsedDesignSystem.style}
  data-icon-library={parsedDesignSystem.iconLibrary}
  data-menu-color={parsedDesignSystem.menuColor}
  data-menu-accent={parsedDesignSystem.menuAccent}
>
  <div bind:this={formContainer}>
    <HostForm {...form} {cells} {renderers} {events} />
  </div>
</div>
