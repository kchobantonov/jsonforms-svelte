<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Settings from '$lib/components/Settings.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { useAppStore } from '$lib/store/index.svelte';
  import { ThemeProvider } from 'flowbite-svelte';
  import '../app.css';

  const { children } = $props();

  let drawerHidden = $state(false);
  const appStore = useAppStore();

  $effect(() => {
    if (appStore.dark.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  const theme = {
    // button: { base: 'bg-blue-500 dark:bg-gray-700' },
    // card: { base: 'bg-white dark:bg-gray-800' },
  };
</script>

<ThemeProvider {theme}>
  <div dir={appStore.rtl ? 'rtl' : 'ltr'}>
    <header
      class="fixed top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
    >
      <Navbar bind:drawerHidden />
    </header>
    <div class="overflow-hidden lg:flex">
      <Sidebar bind:drawerHidden />
      <div class="relative h-full w-full overflow-y-auto pt-[70px] lg:ml-64">
        {@render children()}
      </div>
      <Settings />
    </div>
  </div>
</ThemeProvider>
