import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({base:'./',plugins:[tailwindcss(),svelte(),viteStaticCopy({targets:[{src:'../../packages/jsonforms-svelte-editor-webcomponent/dist/*',dest:'editor'}]})],resolve:{alias:{'@jsonforms-svelte-shadcn-ui':fileURLToPath(new URL('../../packages/jsonforms-svelte-editor-webcomponent/src/components/ui',import.meta.url))}},build:{target:'es2022'}});
