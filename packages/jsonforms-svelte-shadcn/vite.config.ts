import { shadcnTestIconDependencies } from '../../tests/helpers/vite-icon-dependencies.ts';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import path from 'node:path';

const testOptimizeDeps = [
  ...shadcnTestIconDependencies,
  'ajv',
  'lodash/isEmpty',
  'lodash/isObject',
  'lodash/isEqual',
  'lodash/memoize',
  'lodash/template',
  'lodash/startCase',
  'lodash/omit',
  'lodash/set',
  'tailwind-variants',
];

const isVitest = process.env.VITEST === 'true';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  resolve: {
    alias: {
      '@jsonforms-svelte-shadcn-ui': path.resolve(
        import.meta.dirname,
        '../jsonforms-svelte-shadcn-webcomponent/src/lib/components/ui',
      ),
    },
  },
  // Paneforge exports Svelte source files, so server-side tests must keep it in
  // Vite's transform pipeline instead of letting Node load the package directly.
  ssr: {
    noExternal: ['paneforge'],
  },
  ...(isVitest ? { optimizeDeps: { include: testOptimizeDeps } } : {}),
  test: {
    // Preserve separate SvelteKit browser and server plugin lifecycles.
    sharedViteServer: false,
    expect: { requireAssertions: true },
    projects: [
      {
        extends: true,
        test: {
          name: 'client',
          fileParallelism: false,
          browser: {
            // Keep existing partial locator matches explicit under Vitest 5.
            locators: { exact: false },
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }],
          },
          include: ['src/**/*.svelte.{test,spec}.{js,ts}', 'tests/**/*.svelte.{test,spec}.{js,ts}'],
          exclude: ['src/lib/server/**'],
        },
      },

      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'tests/**/*.svelte.{test,spec}.{js,ts}'],
        },
      },
    ],
  },
});
