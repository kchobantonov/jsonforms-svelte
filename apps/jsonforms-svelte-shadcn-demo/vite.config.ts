import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@chobantonov/jsonforms-svelte-shadcn-webcomponent/dist/**/*',
          // Strip node_modules/@chobantonov/package/dist, retaining chunks and workers.
          rename: { stripBase: 4 },
          dest: 'js',
        },
      ],
    }),
  ],
  test: {
    // Preserve separate SvelteKit browser and server plugin lifecycles.
    sharedViteServer: false,
    expect: { requireAssertions: true },
    projects: [
      {
        extends: true,
        test: {
          name: 'client',
          browser: {
            // Keep existing partial locator matches explicit under Vitest 5.
            locators: { exact: false },
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }],
          },
          include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
          exclude: ['src/lib/server/**'],
        },
      },

      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
        },
      },
    ],
  },
});
