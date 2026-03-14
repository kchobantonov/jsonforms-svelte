import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const testOptimizeDeps = [
  'ajv',
  'lodash/isEmpty',
  'lodash/isObject',
  'lodash/isEqual',
  'lodash/startCase',
  'lodash/omit',
  'lodash/set',
  'tailwind-variants',
];

const isVitest = process.env.VITEST === 'true';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  ...(isVitest ? { optimizeDeps: { include: testOptimizeDeps } } : {}),
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'client',
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }],
          },
          include: ['src/**/*.svelte.{test,spec}.{js,ts}', 'tests/**/*.svelte.{test,spec}.{js,ts}'],
          exclude: ['src/lib/server/**'],
        },
      },

      {
        extends: './vite.config.ts',
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
