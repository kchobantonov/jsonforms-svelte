import { SvelteURL } from 'svelte/reactivity';
import { onMount } from 'svelte';
import { readDemoQuery } from '../store/hashQuery';
import type { createDemoBaseStore } from '../store/index.svelte';

export function useDemoLayout(
  store: ReturnType<typeof createDemoBaseStore>,
  dimensions: {
    desktop(): boolean;
    header(): HTMLElement | null;
    fallback: number;
    headerVariable?: boolean;
    home?(): boolean;
  },
) {
  let headerHeight = $state(dimensions.fallback);
  let explicit = false;
  let initialized = false;
  function syncExplicit() {
    explicit = readDemoQuery(new SvelteURL(window.location.href), 'drawer') !== null;
  }
  onMount(() => {
    syncExplicit();
    window.addEventListener('hashchange', syncExplicit);
    window.addEventListener('popstate', syncExplicit);
    return () => {
      window.removeEventListener('hashchange', syncExplicit);
      window.removeEventListener('popstate', syncExplicit);
    };
  });
  $effect(() => {
    void store.drawer.value;
    syncExplicit();
  });
  $effect(() => {
    const desktop = dimensions.desktop();
    if (!initialized) {
      if (!explicit) store.drawer.setSilently(desktop);
      initialized = true;
    }
  });
  $effect(() => {
    const node = dimensions.header();
    if (!node) return;
    const measure = () => {
      const height = node.offsetHeight;
      headerHeight = height > 0 ? height : dimensions.fallback;
      if (dimensions.headerVariable)
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  });
  $effect(() => {
    if (store.formOnly.value) store.settings = false;
  });
  return {
    get headerHeight() {
      return headerHeight;
    },
    get contentAreaClass() {
      return `relative h-full min-w-0 w-full overflow-y-auto transition-all duration-200 ${store.drawer.value && !store.formOnly.value ? 'xl:ms-64' : 'xl:ms-0'}`;
    },
    get contentWrapperClass() {
      return dimensions.home?.()
        ? 'min-h-[calc(100vh-var(--header-height))]'
        : 'min-h-[calc(100vh-var(--header-height))] px-4 py-6 sm:px-6 lg:px-8';
    },
  };
}
