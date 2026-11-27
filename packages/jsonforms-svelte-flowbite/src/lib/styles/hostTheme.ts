import type { ThemeConfig } from 'flowbite-svelte';

// Reveal clear buttons on hover or keyboard focus and keep their RTL alignment.
export function createFlowbiteHostTheme(): ThemeConfig {
  return {
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
    // make sure that in dark mode the current item has the primary color as well
    listGroupItem:
      "[&[aria-current='true']]:dark:bg-primary-700 [&[aria-current='true']]:dark:text-white",
  };
}
