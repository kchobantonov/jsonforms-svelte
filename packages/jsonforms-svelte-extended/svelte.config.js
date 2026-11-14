import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    // Check test fixtures against source before this package has a dist directory.
    alias: { '@chobantonov/jsonforms-svelte-extended': './src/lib/index.ts' },
  },
};

export default config;
