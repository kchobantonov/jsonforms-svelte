import { shadcnTestIconDependencies } from '../../tests/helpers/vite-icon-dependencies.ts';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  ...(process.env.VITEST === 'true'
    ? { optimizeDeps: { include: shadcnTestIconDependencies } }
    : {}),
  resolve: {
    alias: {
      '@jsonforms-svelte-shadcn-ui': path.resolve(
        import.meta.dirname,
        '../jsonforms-svelte-shadcn-webcomponent/src/lib/components/ui',
      ),
    },
  },
  // Renderer entry tests import the workspace package's packaged Svelte output.
  // Keep it in Vite's transform pipeline so its Bits UI components are compiled.
  ssr: {
    noExternal: [
      '@chobantonov/jsonforms-svelte-shadcn',
      '@hugeicons/svelte',
      '@lucide/svelte',
      '@tabler/icons-svelte',
      'bits-ui',
      'paneforge',
      'phosphor-svelte',
      'remixicon-svelte',
    ],
  },
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
