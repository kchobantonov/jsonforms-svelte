import tailwindcss from '@tailwindcss/vite';
import { defineConfig, lazyPlugins } from 'vite-plus';
import { testDependencies, workspaceTests } from '../../tests/helpers/vite-test-projects.ts';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: lazyPlugins(() => [tailwindcss(), sveltekit()]),
  ...testDependencies(['monaco-editor/esm/vs/language/css/workerManager.js']),
  test: workspaceTests(),
});
