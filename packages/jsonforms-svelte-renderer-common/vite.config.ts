import tailwindcss from '@tailwindcss/vite';
import { defineConfig, lazyPlugins } from 'vite-plus';
import { workspaceTests } from '../../tests/helpers/vite-test-projects.ts';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: lazyPlugins(() => [tailwindcss(), sveltekit()]),
  test: workspaceTests(),
});
