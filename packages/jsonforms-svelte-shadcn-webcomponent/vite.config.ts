import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import type { PluginOption } from 'vite';
import { webComponentManualChunks } from '../../webcomponent-chunks.js';

const plugins: PluginOption[] = [
  // Work around duplicated Vite type identities in monorepo/pnpm environments.
  tailwindcss() as unknown as PluginOption,
  svelte({
    dynamicCompileOptions: ({ filename, compileOptions }) => {
      const normalized = filename.replace(/\\/g, '/');
      if (normalized.endsWith('/src/lib/JsonFormsWebComponent.svelte')) {
        return { ...compileOptions, customElement: true };
      }
      return compileOptions;
    },
  }) as unknown as PluginOption,
];

export default defineConfig({
  base: './',

  plugins,
  resolve: {
    alias: {
      $lib: path.resolve(import.meta.dirname, 'src/lib'),
      '@jsonforms-svelte-shadcn-ui': path.resolve(import.meta.dirname, 'src/lib/components/ui'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: true,
    cssCodeSplit: true,
    commonjsOptions: {
      strictRequires: true,
      transformMixedEsModules: true,
    },
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/lib/webcomponent-entry.ts'),
      name: 'JsonFormsSvelteShadcnWebComponent',
      formats: ['es'],
      fileName: () => 'jsonforms-svelte-shadcn.js',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'jsonforms-svelte-shadcn.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: webComponentManualChunks,
        onlyExplicitManualChunks: true,
      },
    },
  },
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'client',
          fileParallelism: false,
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }],
          },
          include: ['tests/**/*.browser.spec.ts'],
        },
      },
      {
        extends: './vite.config.ts',
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
