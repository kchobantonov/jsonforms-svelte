import { createSvelteConfig } from '../../scripts/eslint-config.js';
import svelteConfig from './svelte.config.js';

export default createSvelteConfig(
  { directory: import.meta.dirname, svelteConfig },
  {
    rules: {
      // Existing JSON Schema and component passthrough boundaries remain open-ended.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
    },
  },
);
