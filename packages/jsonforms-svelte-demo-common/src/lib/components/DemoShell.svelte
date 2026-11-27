<script lang="ts">
  import { onMount, untrack, type Component, type Snippet } from 'svelte';
  import { useDemoLayout } from '../core/demoLayout.svelte';
  const {
    appStore,
    home,
    syncModeAndTheme,
    navbar,
    Sidebar,
    Settings,
    children,
  }: {
    appStore: Parameters<typeof useDemoLayout>[0];
    home: boolean;
    syncModeAndTheme(): void;
    navbar: Snippet;
    Sidebar: Component<{ headerHeight: number }>;
    Settings: Component;
    children: Snippet;
  } = $props();
  let innerWidth = $state(0);
  let headerEl = $state<HTMLElement | null>(null);
  const layout = useDemoLayout(
    untrack(() => appStore),
    {
      desktop: () => innerWidth >= 1280,
      header: () => headerEl,
      fallback: 72,
      headerVariable: true,
      home: () => home,
    },
  );
  const { headerHeight, contentAreaClass, contentWrapperClass } = $derived(layout);

  onMount(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => syncModeAndTheme();
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  });
  $effect(() => syncModeAndTheme());
  $effect(() => {
    document.documentElement.dir = appStore.rtl ? 'rtl' : 'ltr';
  });
</script>

<header bind:this={headerEl} class="fixed top-0 z-50 w-full">
  {@render navbar()}
</header>

<div class="flex overflow-hidden">
  {#if !appStore.formOnly.value}<Sidebar {headerHeight} />{/if}

  <main class={contentAreaClass} style={`padding-top: ${headerHeight}px;`}>
    <div class={contentWrapperClass}>
      {@render children()}
    </div>
  </main>

  {#if !appStore.formOnly.value}<Settings />{/if}
</div>

<svelte:window bind:innerWidth />
