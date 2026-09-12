<svelte:options
  customElement={{
    shadow: "open",
    props: {
      initialForm: { type: "Object" },
      editorLocale: { type: "String", attribute: "editor-locale" },
      formLocale: { type: "String", attribute: "form-locale" },
      editorMessages: { type: "Object" },
      documentId: { type: "String", attribute: "document-id" },
      editorMode: { type: "String", attribute: "editor-mode" },
    },
  }}
/>

<script lang="ts">
  import { Editor } from "@chobantonov/jsonforms-svelte-editor";
  import type { InitialForm } from "@chobantonov/jsonforms-svelte-editor";

  let {
    initialForm = {},
    editorLocale = "en",
    formLocale = "en",
    editorMessages = {},
    documentId = "Untitled form",
    editorMode = "system",
  }: {
    initialForm?: InitialForm;
    editorLocale?: string;
    formLocale?: string;
    editorMessages?: import("@chobantonov/jsonforms-svelte-editor").EditorMessages;
    documentId?: string;
    editorMode?: "light" | "dark" | "system";
  } = $props();
  let editor = $state<Editor>();
  export function undo() {
    editor?.undo();
  }
  export function redo() {
    editor?.redo();
  }
</script>

{#key documentId}<Editor
    bind:this={editor}
    onhistory={(state) =>
      $host().dispatchEvent(
        new CustomEvent("history-change", {
          detail: state,
          bubbles: true,
          composed: true,
        }),
      )}
    ondraft={(dirty) =>
      $host().dispatchEvent(
        new CustomEvent("draft-change", {
          detail: { dirty },
          bubbles: true,
          composed: true,
        }),
      )}
    {initialForm}
    {editorLocale}
    {formLocale}
    {editorMessages}
    {documentId}
    {editorMode}
    onchange={(document, revision) =>
      $host().dispatchEvent(
        new CustomEvent("document-change", {
          detail: { documentId, document, revision },
          bubbles: true,
          composed: true,
        }),
      )}
  />{/key}
