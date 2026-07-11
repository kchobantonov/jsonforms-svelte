<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import Navbar from '$lib/components/Navbar.svelte';
  import Settings from '$lib/components/Settings.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { themes } from '$lib/modules/themes';
  import { useAppStore } from '$lib/store/index.svelte';
  import {
    buildShadcnDesignSystemCss,
    normalizeShadcnDesignSystem,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { onMount } from 'svelte';
  import '../app.css';

  const { children } = $props();

  const appStore = useAppStore();
  const designSystem = $derived(normalizeShadcnDesignSystem(appStore.designSystem.value));
  const designSystemCss = $derived(buildShadcnDesignSystemCss(designSystem));
  let innerWidth = $state(0);
  let headerEl = $state<HTMLElement | null>(null);
  let headerHeight = $state(72);
  let drawerExplicitlySet = $state(false);
  let drawerInitialized = $state(false);
  const isDesktop = $derived(innerWidth >= 1280);
  const isHomePage = $derived(page.route.id === '/');
  const contentAreaClass = $derived(
    `relative h-full w-full overflow-y-auto transition-all duration-200 ${appStore.drawer.value ? 'xl:ms-64' : 'xl:ms-0'}`,
  );
  const contentWrapperClass = $derived(
    isHomePage
      ? 'min-h-[calc(100vh-var(--header-height))]'
      : 'min-h-[calc(100vh-var(--header-height))] px-4 py-6 sm:px-6 lg:px-8',
  );

  const syncDrawerExplicitFlag = () => {
    if (!browser) return;
    const hashAndQuery = window.location.hash.slice(1);
    const query = hashAndQuery.split('?')[1];
    drawerExplicitlySet = new URLSearchParams(query).has('drawer');
  };

  const syncModeAndTheme = () => {
    if (!browser) return;

    if (!themes.some((theme) => theme.name === appStore.theme.value)) {
      appStore.theme.value = 'slate';
    }

    document.documentElement.setAttribute('data-mode', appStore.mode.value);
    document.documentElement.setAttribute('data-theme', appStore.theme.value);
    document.documentElement.setAttribute('data-style', designSystem.style);
    document.documentElement.setAttribute('data-icon-library', designSystem.iconLibrary);
    document.documentElement.setAttribute('data-menu-color', designSystem.menuColor);
    document.documentElement.setAttribute('data-menu-accent', designSystem.menuAccent);
  };

  onMount(() => {
    syncDrawerExplicitFlag();
    syncModeAndTheme();

    window.addEventListener('hashchange', syncDrawerExplicitFlag);
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
    if (browser && !drawerExplicitlySet && !drawerInitialized) {
      appStore.drawer.setSilently(isDesktop);
      drawerInitialized = true;
    }
  });

  $effect(() => {
    void appStore.mode.value;
    void appStore.theme.value;
    void appStore.designSystem.value;
    syncModeAndTheme();
  });

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

  $effect(() => {
    document.documentElement.dir = appStore.rtl ? 'rtl' : 'ltr';
  });
</script>

<div class="min-h-screen bg-noise">
  <header bind:this={headerEl} class="fixed top-0 z-50 w-full">
    <Navbar />
  </header>

  <div class="flex overflow-hidden">
    <Sidebar {headerHeight} />

    <main class={contentAreaClass} style={`padding-top: ${headerHeight}px;`}>
      <div class={contentWrapperClass}>
        {@render children()}
      </div>
    </main>

    <Settings />
  </div>
</div>

<svelte:window bind:innerWidth />
