import { shadcnTestIconDependencies } from '../../tests/helpers/vite-icon-dependencies.ts';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import {
  rendererTestDependencies,
  testDependencies,
  workspaceTests,
} from '../../tests/helpers/vite-test-projects.ts';
import { defineConfig, lazyPlugins } from 'vite-plus';
import path from 'node:path';

export default defineConfig({
  plugins: lazyPlugins(() => [tailwindcss(), sveltekit()]),
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
  ...testDependencies([...shadcnTestIconDependencies, ...rendererTestDependencies]),
  test: workspaceTests(),
});
