<script lang="ts">
  import EditorShell from "./editor/EditorShell.svelte";
  import styles from "./editor/styles/editor.css?inline";
  import type { InitialForm } from "./editor/document/types.js";
  let {
    initialForm = {},
    documentId = "Untitled form",
    editorMode = "system",
    onchange = () => {},
    ondraft = () => {},
  }: {
    initialForm?: InitialForm;
    documentId?: string;
    editorMode?: "light" | "dark" | "system";
    onchange?: (document: InitialForm, revision: number) => void;
    ondraft?: (dirty: boolean) => void;
  } = $props();
</script>

<svelte:element this={"style"}>{styles}</svelte:element>
{#key documentId}<EditorShell
    {initialForm}
    {documentId}
    {editorMode}
    {onchange}
    {ondraft}
  />{/key}
