<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import Settings from '$shadcnDemo/Settings.svelte';
  import Sidebar from '$shadcnDemo/Sidebar.svelte';
  import { themes } from '$shadcnDemo/themes';
  import { useAppStore } from '$lib/store/index.svelte';
  import {
    buildShadcnDesignSystemCss,
    normalizeShadcnDesignSystem,
    setIconLibrary,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { DemoShell } from '@chobantonov/jsonforms-svelte-demo-common';
  import type { Snippet } from 'svelte';

  const { children, navbar }: { children: Snippet; navbar: Snippet } = $props();

  const appStore = useAppStore();
  const designSystem = $derived(normalizeShadcnDesignSystem(appStore.designSystem.value));
  const designSystemCss = $derived(buildShadcnDesignSystemCss(designSystem));
  const syncModeAndTheme = () => {
    if (!browser) return;

    if (!themes.some((theme) => theme.name === appStore.theme.value)) {
      appStore.theme.value = 'slate';
    }

    document.documentElement.setAttribute('data-mode', appStore.mode.value);
    document.documentElement.setAttribute('data-theme', appStore.theme.value);
    document.documentElement.setAttribute('data-style', designSystem.style);
    document.documentElement.setAttribute('data-icon-library', designSystem.iconLibrary);
    setIconLibrary(designSystem.iconLibrary);
    document.documentElement.setAttribute('data-menu-color', designSystem.menuColor);
    document.documentElement.setAttribute('data-menu-accent', designSystem.menuAccent);
  };

  $effect(() => {
    if (!browser) return;
    const id = 'shadcn-design-system';
    let style = document.getElementById(id) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = designSystemCss;
  });
</script>

<DemoShell
  {appStore}
  home={page.route.id === '/'}
  {Sidebar}
  {Settings}
  {children}
  {syncModeAndTheme}
  {navbar}
/>
