import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      strict: true,
    }),
    router: {
      type: 'hash',
    },
    paths: {
      base: process.env.NODE_ENV === 'production' ? '/jsonforms-svelte' : '',
    },
  },
};

export default config;
