<script lang="ts">
  import { createFlowbiteHostTheme } from '@chobantonov/jsonforms-svelte-flowbite';
  import Navbar from '$lib/components/Navbar.svelte';
  import Settings from '$lib/components/Settings.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { appThemeColors, useAppStore } from '$lib/store/index.svelte';
  import { useDemoLayout } from '@chobantonov/jsonforms-svelte-demo-common';
  import { ThemeProvider } from 'flowbite-svelte';
  import '../app.css';

  const { children } = $props();

  const appStore = useAppStore();
  let innerWidth = $state(0);
  let headerEl = $state<HTMLElement | null>(null);
  const layout = useDemoLayout(appStore, {
    desktop: () => innerWidth >= 1280,
    header: () => headerEl,
    fallback: 70,
  });
  const { headerHeight, contentAreaClass } = $derived(layout);

  $effect(() => {
    const mode = appStore.mode.value;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyMode = () => {
      const isDark = mode === 'dark' || (mode === 'system' && mediaQuery.matches);
      document.documentElement.classList.toggle('dark', isDark);
    };

    applyMode();

    if (mode !== 'system') return;

    const onChange = () => applyMode();
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  });

  $effect(() => {
    const nextThemeColor = appThemeColors.includes(appStore.themeColor.value)
      ? appStore.themeColor.value
      : 'sunset';
    document.documentElement.setAttribute('data-theme-color', nextThemeColor);
  });

  const theme = createFlowbiteHostTheme();
</script>

<ThemeProvider {theme}>
  <div dir={appStore.rtl ? 'rtl' : 'ltr'}>
    <header
      bind:this={headerEl}
      class="fixed top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
    >
      <Navbar />
    </header>
    <div class="flex overflow-hidden">
      {#if !appStore.formOnly.value}<Sidebar {headerHeight} />{/if}
      <div class={contentAreaClass} style={`padding-top: ${headerHeight}px;`}>
        {@render children()}
      </div>
      {#if !appStore.formOnly.value}<Settings />{/if}
    </div>
  </div>
</ThemeProvider>

<svelte:window bind:innerWidth />
