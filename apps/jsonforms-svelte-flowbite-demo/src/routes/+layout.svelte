<script lang="ts">
  import { browser } from '$app/environment';
  import Navbar from '$lib/components/Navbar.svelte';
  import Settings from '$lib/components/Settings.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { appThemeColors, useAppStore } from '$lib/store/index.svelte';
  import { ThemeProvider, type ThemeConfig } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import '../app.css';

  const { children } = $props();

  const appStore = useAppStore();
  let innerWidth = $state(0);
  let headerEl = $state<HTMLElement | null>(null);
  let headerHeight = $state(70);
  let drawerExplicitlySet = $state(false);
  const isDesktop = $derived(innerWidth >= 1280);
  const contentAreaClass = $derived(
    `relative h-full w-full overflow-y-auto transition-all duration-200 ${appStore.drawer.value ? 'xl:ms-64' : 'xl:ms-0'}`,
  );

  const syncDrawerExplicitFlag = () => {
    if (!browser) return;
    const hashAndQuery = window.location.hash.slice(1);
    const [_, query] = hashAndQuery.split('?');
    drawerExplicitlySet = new URLSearchParams(query).has('drawer');
  };

  onMount(() => {
    syncDrawerExplicitFlag();
    window.addEventListener('hashchange', syncDrawerExplicitFlag);
    const updateHeaderHeight = () => {
      const measured = headerEl?.offsetHeight ?? 70;
      headerHeight = measured > 0 ? measured : 70;
    };

    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    if (headerEl) {
      observer.observe(headerEl);
    }

    return () => {
      window.removeEventListener('hashchange', syncDrawerExplicitFlag);
      observer.disconnect();
    };
  });

  $effect(() => {
    appStore.drawer.value;
    syncDrawerExplicitFlag();
  });

  // Responsive default behavior:
  // - Desktop: open by default
  // - Mobile: closed by default
  // Only applies when URL does not explicitly specify ?drawer=...
  $effect(() => {
    isDesktop;
    if (browser && !drawerExplicitlySet) {
      appStore.drawer.setSilently(isDesktop);
    }
  });

  $effect(() => {
    if (appStore.dark.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  $effect(() => {
    const nextThemeColor = appThemeColors.includes(appStore.themeColor.value)
      ? appStore.themeColor.value
      : 'sunset';
    document.documentElement.setAttribute('data-theme-color', nextThemeColor);
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
    // button: { base: 'bg-blue-500 dark:bg-gray-700' },
    // card: { base: 'bg-white dark:bg-gray-800' },
  };
</script>

<ThemeProvider {theme}>
  <div dir={appStore.rtl ? 'rtl' : 'ltr'}>
    <header
      bind:this={headerEl}
      class="fixed top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
    >
      <Navbar />
    </header>
    <div class="overflow-hidden flex">
      <Sidebar {headerHeight} />
      <div class={contentAreaClass} style={`padding-top: ${headerHeight}px;`}>
        {@render children()}
      </div>
      <Settings />
    </div>
  </div>
</ThemeProvider>

<svelte:window bind:innerWidth />
