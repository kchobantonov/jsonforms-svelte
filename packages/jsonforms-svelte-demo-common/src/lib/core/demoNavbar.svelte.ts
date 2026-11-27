import { MediaQuery } from 'svelte/reactivity';
import type { createDemoBaseStore } from '../store/index.svelte';
import { createDemoTranslator } from '../i18n/demo';

export function useDemoNavbar(
  store: ReturnType<typeof createDemoBaseStore> & { mode: { value: string } },
) {
  const prefersDark = new MediaQuery('(prefers-color-scheme: dark)', false);
  const translate = $derived(createDemoTranslator(store.jsonforms.locale.value));
  const toggle = (setting: { value: boolean }) => () => {
    setting.value = !setting.value;
  };
  return {
    get drawer() {
      return {
        'aria-label': translate(store.drawer.value ? 'nav.hideExamples' : 'nav.showExamples'),
        'aria-expanded': store.drawer.value,
        onclick: toggle(store.drawer),
      };
    },
    get formOnly() {
      return {
        'aria-label': translate(store.formOnly.value ? 'nav.showFullUi' : 'nav.showFormOnly'),
        'aria-pressed': store.formOnly.value,
        onclick: toggle(store.formOnly),
      };
    },
    get renderer() {
      return {
        'aria-label': translate(
          store.useWebComponentView.value ? 'nav.webComponent' : 'nav.svelte',
        ),
        'aria-pressed': store.useWebComponentView.value,
        onclick: toggle(store.useWebComponentView),
      };
    },
    get settings() {
      return {
        'aria-label': translate(store.settings ? 'nav.closeSettings' : 'nav.openSettings'),
        'aria-expanded': store.settings,
        onclick: () => {
          store.settings = !store.settings;
        },
      };
    },
    get logo() {
      const dark =
        store.mode.value === 'dark' || (store.mode.value === 'system' && prefersDark.current);
      return {
        animate: store.useWebComponentView.value,
        onSurfaceColor: dark ? '#F9FAFB' : '#111827',
      };
    },
    get translate() {
      return translate;
    },
  };
}
