import { scriptsConfig } from './scripts/eslint-config.js';
import globals from 'globals';

// Package scripts invoke their own Svelte-aware configs from the package directory.
export default [
  { ignores: ['packages/**', 'apps/**'] },
  ...scriptsConfig,
  {
    files: ['tests/**/*.ts'],
    // Playwright evaluate callbacks run in the browser, while the harness runs in Node.
    languageOptions: { globals: globals.browser },
  },
];
