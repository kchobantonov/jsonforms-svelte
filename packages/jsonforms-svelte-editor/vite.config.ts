import { cpSync } from "node:fs";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  base: "./",
  plugins: [
    { name: "copy-renderer", closeBundle() { cpSync(new URL("../jsonforms-svelte-shadcn-webcomponent/dist", import.meta.url), new URL("./dist/renderer", import.meta.url), {recursive:true}); } },
    tailwindcss(),
    svelte({
      dynamicCompileOptions: ({ filename }) => ({
        customElement: filename.endsWith("/EditorElement.svelte"),
      }),
    }),
  ],
  resolve: {
    alias: {
      "@jsonforms-svelte-shadcn-ui": fileURLToPath(
        new URL("./src/lib/components/ui", import.meta.url),
      ),
    },
  },
  build: {
    target: "es2022",
    lib: {
      entry: "src/lib/register.ts",
      formats: ["es"],
      fileName: () => "jsonforms-svelte-editor.js",
    },
    sourcemap: true,
  },
});
