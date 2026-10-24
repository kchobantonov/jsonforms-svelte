import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import type { PluginOption } from 'vite';
import { webComponentManualChunks } from '../../webcomponent-chunks.ts';

const plugins: PluginOption[] = [
  tailwindcss(),
  svelte({
    // Scoped component styles must follow their nodes into the shadow root.
    emitCss: false,
    dynamicCompileOptions: ({ filename, compileOptions }) => {
      const normalized = filename.replace(/\\/g, '/');
      if (normalized.endsWith('/src/lib/JsonFormsWebComponent.svelte')) {
        return { ...compileOptions, customElement: true };
      }
      return compileOptions;
    },
  }),
];

export default defineConfig({
  base: './',

  plugins,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'oxc',
    sourcemap: true,
    cssCodeSplit: true,
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/lib/webcomponent-entry.ts'),
      name: 'JsonFormsSvelteFlowbiteWebComponent',
      formats: ['es'],
      fileName: () => 'jsonforms-svelte-flowbite.js',
    },
    rolldownOptions: {
      // These entries register a custom element for side effects; they export no API.
      preserveEntrySignatures: false,
      output: {
        strictExecutionOrder: true,
        entryFileNames: 'jsonforms-svelte-flowbite.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        codeSplitting: {
          includeDependenciesRecursively: false,
          groups: [
            {
              debugName: 'webcomponent-libraries',
              name: (id) => webComponentManualChunks(id) ?? null,
            },
          ],
        },
      },
    },
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
          include: ['tests/**/*.browser.spec.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['tests/**/*.spec.ts'],
          exclude: ['tests/**/*.browser.spec.ts'],
        },
      },
    ],
  },
});
