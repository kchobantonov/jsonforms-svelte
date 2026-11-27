import { MediaQuery } from 'svelte/reactivity';
import { manageNarrowDrawerFocus } from '../drawerFocus';
import { createDemoTranslator } from '../i18n/demo';
import { filterPublicDemoExamples, type DemoExample } from '../examples';
import type { createDemoBaseStore } from '../store/index.svelte';

export function useDemoSidebar(
  store: ReturnType<typeof createDemoBaseStore>,
  examples: readonly DemoExample[],
) {
  const translate = $derived(createDemoTranslator(store.jsonforms.locale.value));
  const filter = $state({ query: '', source: 'spec' });
  const sourceOptions = $derived(
    ['spec', 'jsonforms', 'all'].map((value) => ({
      value,
      label: translate(`sidebar.source.${value}`),
    })),
  );
  const filteredExamples = $derived(
    filterPublicDemoExamples(examples, filter.source, filter.query),
  );
  const listItems = $derived(filteredExamples.map(({ name, label }) => ({ value: name, label })));
  const desktop = new MediaQuery('(min-width: 1280px)', false);
  let drawerElement = $state<HTMLElement | null>(null);
  const mobileOpen = $derived(!desktop.current && store.drawer.value);
  $effect(() => {
    if (mobileOpen && drawerElement)
      return manageNarrowDrawerFocus(
        drawerElement,
        document.querySelector<HTMLElement>('[data-demo-examples-trigger]'),
      );
  });
  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 1280px)').matches)
      store.drawer.value = false;
  };
  function handleNavigation(initial: string | undefined) {
    let current = initial;
    return (name: string | undefined) => {
      if (current === name) return;
      current = name;
      document.getElementById('svelte')?.scrollTo({ top: 0 });
      closeOnMobile();
    };
  }
  return {
    filter,
    linkHash(routeHash: string) {
      // Preferences also update the hash through history.replaceState.
      void store.formOnly.value;
      void store.activeTab.value;
      void store.useWebComponentView.value;
      void store.drawer.value;
      void store.jsonforms.readonly.value;
      return typeof window === 'undefined' ? routeHash : window.location.hash;
    },
    get drawerElement() {
      return drawerElement;
    },
    set drawerElement(element: HTMLElement | null) {
      drawerElement = element;
    },
    get drawerOpen() {
      return store.drawer.value;
    },
    get mobileOpen() {
      return mobileOpen;
    },
    get drawerClosedTransform() {
      return store.rtl ? 'translate-x-full' : '-translate-x-full';
    },
    handleDrawerKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented && mobileOpen) closeOnMobile();
    },
    closeOnMobile,
    handleNavigation,
    get translate() {
      return translate;
    },
    get sourceOptions() {
      return sourceOptions;
    },
    get filteredExamples() {
      return filteredExamples;
    },
    get listItems() {
      return listItems;
    },
  };
}
