import tailwindcss from '@tailwindcss/vite';
import { defineConfig, lazyPlugins } from 'vite-plus';
import { workspaceTests } from '../../tests/helpers/vite-test-projects.ts';
import { sveltekit } from '@sveltejs/kit/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: lazyPlugins(() => [
    tailwindcss(),
    sveltekit(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@chobantonov/jsonforms-svelte-skeleton-webcomponent/dist/**/*',
          // Strip node_modules/@chobantonov/package/dist, retaining chunks and workers.
          rename: { stripBase: 4 },
          dest: 'js',
        },
      ],
    }),
  ]),
  test: workspaceTests('demo'),
});
