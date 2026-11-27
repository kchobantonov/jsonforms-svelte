<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import Navbar from '$lib/components/Navbar.svelte';
  import Settings from '$lib/components/Settings.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { useAppStore } from '$lib/store/index.svelte';
  import { DemoShell } from '@chobantonov/jsonforms-svelte-demo-common';
  import '../app.css';

  const { children } = $props();

  const appStore = useAppStore();
  const syncModeAndTheme = () => {
    if (!browser) return;

    document.documentElement.setAttribute('data-mode', appStore.mode.value);
    document.documentElement.setAttribute('data-theme', appStore.theme.value);
  };
</script>

<div class="bg-noise min-h-screen">
  <DemoShell
    {appStore}
    home={page.route.id === '/'}
    {Sidebar}
    {Settings}
    {children}
    {syncModeAndTheme}>{#snippet navbar()}<Navbar />{/snippet}</DemoShell
  >
</div>
