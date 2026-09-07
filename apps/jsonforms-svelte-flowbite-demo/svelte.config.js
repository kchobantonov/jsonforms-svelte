import adapter from '@sveltejs/adapter-static';
import relocatableStatic from '../../scripts/relocatable-static.mjs';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: relocatableStatic(
      adapter({
        pages: 'build',
        assets: 'build',
        strict: true,
      }),
    ),
    router: {
      type: 'hash',
    },
    paths: {
      base: '',
      relative: true,
    },
  },
};

export default config;
