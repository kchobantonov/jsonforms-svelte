import adapter from '@sveltejs/adapter-auto';

// svelte-check needs the first-party implementation, while svelte-package must preserve the
// consumer-facing import prefix in published output.
const isPackaging = process.env.SHADCN_PRESERVE_UI_IMPORTS === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter(),
    alias: isPackaging
      ? {}
      : {
          '@jsonforms-svelte-shadcn-ui':
            '../../apps/jsonforms-svelte-shadcn-demo/src/lib/components/ui',
        },
  },
};

export default config;
