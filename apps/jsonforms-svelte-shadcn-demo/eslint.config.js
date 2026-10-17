import { createSvelteConfig } from '../../scripts/eslint-config.js';
import svelteConfig from './svelte.config.js';

export default createSvelteConfig(
  { directory: import.meta.dirname, svelteConfig },
  {
    files: ['src/lib/components/ui/button/button.svelte'],
    rules: {
      // Reusable library buttons cannot resolve application-specific routes.
      'svelte/no-navigation-without-resolve': 'off',
    },
  },
);
