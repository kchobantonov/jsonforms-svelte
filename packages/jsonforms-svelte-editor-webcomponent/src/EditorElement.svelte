<svelte:options
  customElement={{
    shadow: "open",
    props: {
      initialForm: { type: "Object" },
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
    documentId = "Untitled form",
    editorMode = "system",
  }: {
    initialForm?: InitialForm;
    documentId?: string;
    editorMode?: "light" | "dark" | "system";
  } = $props();
</script>

{#key documentId}<Editor
    ondraft={(dirty) =>
      $host().dispatchEvent(
        new CustomEvent("draft-change", {
          detail: { dirty },
          bubbles: true,
          composed: true,
        }),
      )}
    {initialForm}
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
