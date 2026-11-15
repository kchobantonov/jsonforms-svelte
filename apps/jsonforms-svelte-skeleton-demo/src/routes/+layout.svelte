<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import Navbar from '$lib/components/Navbar.svelte';
  import Settings from '$lib/components/Settings.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { useAppStore } from '$lib/store/index.svelte';
  import { readDemoQuery } from '@chobantonov/jsonforms-svelte-demo-common';
  import { onMount } from 'svelte';
  import '../app.css';

  const { children } = $props();

  const appStore = useAppStore();
  let innerWidth = $state(0);
  let headerEl = $state<HTMLElement | null>(null);
  let headerHeight = $state(72);
  let drawerExplicitlySet = $state(false);
  let drawerInitialized = $state(false);
  const isDesktop = $derived(innerWidth >= 1280);
  const isHomePage = $derived(page.route.id === '/');
  const contentAreaClass = $derived(
    `relative h-full min-w-0 w-full overflow-y-auto transition-all duration-200 ${appStore.drawer.value && !appStore.formOnly.value ? 'xl:ms-64' : 'xl:ms-0'}`,
  );
  const contentWrapperClass = $derived(
    isHomePage
      ? 'min-h-[calc(100vh-var(--header-height))]'
      : 'min-h-[calc(100vh-var(--header-height))] px-4 py-6 sm:px-6 lg:px-8',
  );

  const syncDrawerExplicitFlag = () => {
    if (!browser) return;
    drawerExplicitlySet = readDemoQuery(new URL(window.location.href), 'drawer') !== null;
  };

  const syncModeAndTheme = () => {
    if (!browser) return;

    document.documentElement.setAttribute('data-mode', appStore.mode.value);
    document.documentElement.setAttribute('data-theme', appStore.theme.value);
  };

  onMount(() => {
    syncDrawerExplicitFlag();
    syncModeAndTheme();

    window.addEventListener('hashchange', syncDrawerExplicitFlag);
    window.addEventListener('popstate', syncDrawerExplicitFlag);
    const updateHeaderHeight = () => {
      const measured = headerEl?.offsetHeight ?? 72;
      headerHeight = measured > 0 ? measured : 72;
      document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    };

    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    if (headerEl) {
      observer.observe(headerEl);
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemMode = () => syncModeAndTheme();
    media.addEventListener('change', handleSystemMode);

    return () => {
      window.removeEventListener('hashchange', syncDrawerExplicitFlag);
      window.removeEventListener('popstate', syncDrawerExplicitFlag);
      media.removeEventListener('change', handleSystemMode);
      observer.disconnect();
    };
  });

  $effect(() => {
    void appStore.drawer.value;
    syncDrawerExplicitFlag();
  });

  $effect(() => {
    void isDesktop;
    if (browser && !drawerInitialized) {
      if (!drawerExplicitlySet) appStore.drawer.setSilently(isDesktop);
      drawerInitialized = true;
      drawerInitialized = true;
    }
  });

  $effect(() => {
    void appStore.mode.value;
    void appStore.theme.value;
    syncModeAndTheme();
  });

  $effect(() => {
    document.documentElement.dir = appStore.rtl ? 'rtl' : 'ltr';
  });

  $effect(() => {
    if (appStore.formOnly.value) appStore.settings = false;
  });
</script>

<div class="bg-noise min-h-screen">
  <header bind:this={headerEl} class="fixed top-0 z-50 w-full">
    <Navbar />
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
</div>

<svelte:window bind:innerWidth />
