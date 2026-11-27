import path from 'node:path';
import { readFileSync } from 'node:fs';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import type { ViteUserConfig } from 'vite-plus';
import { webComponentManualChunks } from './webcomponent-chunks.ts';

export function webComponentSvelte() {
  return svelte({
    // Scoped component styles must follow their nodes into the shadow root.
    emitCss: false,
    dynamicCompileOptions: ({ filename, compileOptions }) => {
      const normalized = filename.replace(/\\/g, '/');
      if (normalized.endsWith('/src/lib/JsonFormsWebComponent.svelte')) {
        return { ...compileOptions, customElement: true };
      }
      return compileOptions;
    },
  });
}

export function webComponentBuild(
  directory: string,
  name: string,
  fileName: string,
): ViteUserConfig['build'] {
  return {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'oxc',
    sourcemap: true,
    cssCodeSplit: true,
    lib: {
      entry: path.resolve(directory, 'src/lib/webcomponent-entry.ts'),
      name,
      formats: ['es'],
      fileName: () => fileName,
    },
    rolldownOptions: {
      plugins: [
        {
          name: 'webcomponent-declarations',
          generateBundle() {
            const shared = path.resolve(import.meta.dirname, 'webcomponent-host.d.ts');
            const entry = path.resolve(directory, 'types/index.d.ts');
            for (const file of [shared, entry]) this.addWatchFile(file);
            this.emitFile({
              type: 'asset',
              fileName: 'types/webcomponent-host.d.ts',
              source: readFileSync(shared, 'utf8'),
            });
            this.emitFile({
              type: 'asset',
              fileName: 'types/index.d.ts',
              source: readFileSync(entry, 'utf8').replaceAll(
                '../../../webcomponent-host.js',
                './webcomponent-host.js',
              ),
            });
          },
        },
      ],
      // Preserve the exported capability identity used by this bundled adapter.
      preserveEntrySignatures: 'allow-extension',
      output: {
        strictExecutionOrder: true,
        entryFileNames: fileName,
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
  };
}
