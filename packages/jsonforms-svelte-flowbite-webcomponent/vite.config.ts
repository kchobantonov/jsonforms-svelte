import { workspaceTests } from '../../tests/helpers/vite-test-projects.ts';
import { defineConfig } from 'vite-plus';
import tailwindcss from '@tailwindcss/vite';
import { webComponentBuild, webComponentSvelte } from '../../webcomponent-vite.ts';

export default defineConfig({
  base: './',

  plugins: [tailwindcss(), webComponentSvelte()],
  build: webComponentBuild(
    import.meta.dirname,
    'JsonFormsSvelteFlowbiteWebComponent',
    'jsonforms-svelte-flowbite.js',
  ),
  test: workspaceTests('webcomponent'),
});
