import { workspaceTests } from '../../tests/helpers/vite-test-projects.ts';
import { defineConfig } from 'vite-plus';
import tailwindcss from '@tailwindcss/vite';
import { webComponentBuild, webComponentSvelte } from '../../webcomponent-vite.ts';

export default defineConfig({
  base: './',
  // Library builds preserve this dependency check unless explicitly replaced.
  // The standalone browser bundle has no Node process global.
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },

  plugins: [tailwindcss(), webComponentSvelte()],
  build: webComponentBuild(
    import.meta.dirname,
    'JsonFormsSvelteSkeletonWebComponent',
    'jsonforms-svelte-skeleton.js',
  ),
  test: workspaceTests('webcomponent'),
});
