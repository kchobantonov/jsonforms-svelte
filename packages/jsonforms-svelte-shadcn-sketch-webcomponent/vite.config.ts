import { workspaceTests } from '../../tests/helpers/vite-test-projects.ts';
import { defineConfig } from 'vite-plus';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { webComponentBuild, webComponentSvelte } from '../../webcomponent-vite.ts';

export default defineConfig({
  base: './',

  plugins: [tailwindcss(), webComponentSvelte()],
  resolve: {
    alias: {
      $lib: path.resolve(import.meta.dirname, 'src/lib'),
      '@jsonforms-svelte-shadcn-ui': path.resolve(
        import.meta.dirname,
        '../../packages/jsonforms-svelte-shadcn-sketch-ui/src/lib/components/ui',
      ),
    },
  },
  build: webComponentBuild(
    import.meta.dirname,
    'JsonFormsSvelteShadcnWebComponent',
    'jsonforms-svelte-shadcn-sketch.js',
  ),
  test: workspaceTests('webcomponent'),
});
