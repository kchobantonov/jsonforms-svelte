import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import {
  rendererTestDependencies,
  testDependencies,
  workspaceTests,
} from '../../tests/helpers/vite-test-projects.ts';
import { defineConfig, lazyPlugins } from 'vite-plus';

export default defineConfig({
  plugins: lazyPlugins(() => [sveltekit(), tailwindcss()]),
  ...testDependencies(rendererTestDependencies),
  test: workspaceTests(),
});
