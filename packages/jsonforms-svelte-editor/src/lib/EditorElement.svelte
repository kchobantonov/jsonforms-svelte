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
  import EditorPane from "./EditorPane.svelte";
  import type { InitialForm } from "./types.js";
  import styles from "./editor.css?inline";
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

<svelte:element this={"style"}>{styles}</svelte:element>
{#key documentId}<EditorPane ondraft={(dirty) => $host().dispatchEvent(new CustomEvent("draft-change", { detail: { dirty }, bubbles: true, composed: true }))} {initialForm} {documentId} {editorMode} onchange={(document, revision) => $host().dispatchEvent(new CustomEvent("document-change", { detail: { documentId, document, revision }, bubbles: true, composed: true }))} />{/key}
