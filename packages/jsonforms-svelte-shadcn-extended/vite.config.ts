import { shadcnTestIconDependencies } from '../../tests/helpers/vite-icon-dependencies.ts';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, lazyPlugins } from 'vite-plus';
import {
  extendedMonacoWorker,
  testDependencies,
  workspaceTests,
} from '../../tests/helpers/vite-test-projects.ts';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'node:path';

export default defineConfig({
  plugins: lazyPlugins(() => [tailwindcss(), sveltekit()]),
  ...testDependencies([...shadcnTestIconDependencies, extendedMonacoWorker]),
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
  test: workspaceTests(),
});
