<script lang="ts">
  import {
    Editor,
    type InitialForm,
  } from "@chobantonov/jsonforms-svelte-editor";
  let {
    initialForm,
    documentId,
    editorMode,
    onchange,
    ondraft,
  }: {
    initialForm: InitialForm;
    documentId: string;
    editorMode: "light" | "dark" | "system";
    onchange: (document: InitialForm, revision: number) => void;
    ondraft: (dirty: boolean) => void;
  } = $props();
  export function setMode(value: typeof editorMode) {
    editorMode = value;
  }
</script>

<Editor {initialForm} {documentId} {editorMode} {onchange} {ondraft} />
