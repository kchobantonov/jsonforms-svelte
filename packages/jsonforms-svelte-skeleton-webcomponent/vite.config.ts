import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import type { PluginOption } from 'vite';

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
      name: 'JsonFormsSvelteSkeletonWebComponent',
      formats: ['es'],
      fileName: () => 'jsonforms-svelte-skeleton.js',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'jsonforms-svelte-skeleton.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (
            id.includes('ajv') ||
            id.includes('json-schema-traverse') ||
            id.includes('fast-deep-equal') ||
            id.includes('uri-js') ||
            id.includes('fast-uri')
          ) {
            return 'vendor-ajv';
          }

          if (id.includes('/svelte/')) return 'vendor-svelte';
          if (id.includes('@chobantonov/jsonforms-svelte-skeleton-extended'))
            return 'vendor-jsonforms-skeleton';
          if (id.includes('@chobantonov/jsonforms-svelte-skeleton'))
            return 'vendor-jsonforms-skeleton';
          if (id.includes('@chobantonov/jsonforms-svelte')) return 'vendor-jsonforms-svelte';
          if (id.includes('@jsonforms/core')) return 'vendor-jsonforms-core';
          if (id.includes('@skeletonlabs/skeleton-svelte')) return 'vendor-skeleton-svelte';
          if (id.includes('@skeletonlabs/skeleton')) return 'vendor-skeleton';
          if (id.includes('lodash')) return 'vendor-lodash';

          return 'vendor-misc';
        },
      },
    },
  },
});
