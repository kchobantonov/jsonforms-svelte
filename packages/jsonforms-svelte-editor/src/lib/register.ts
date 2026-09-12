await import(/* @vite-ignore */ new URL(/* @vite-ignore */ './renderer/jsonforms-svelte-shadcn.js', import.meta.url).href);
import Editor from "./EditorElement.svelte";
if (!customElements.get("jsonforms-svelte-editor")) {
  customElements.define("jsonforms-svelte-editor", Editor.element!);
}
export type { EditorElement, InitialForm } from "./types.js";
