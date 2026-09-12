<script lang="ts">
  import {
    Editor,
    type InitialForm,
  } from "@chobantonov/jsonforms-svelte-editor";
  let {
    initialForm,
    editorLocale = "en",
    formLocale = "en",
    documentId,
    editorMode,
    onchange,
    ondraft,
    onhistory,
  }: {
    initialForm?: InitialForm;
    editorLocale?: string;
    formLocale?: string;
    documentId: string;
    editorMode: "light" | "dark" | "system";
    onchange: (document: InitialForm, revision: number) => void;
    ondraft: (dirty: boolean) => void;
    onhistory: (state: { canUndo: boolean; canRedo: boolean }) => void;
  } = $props();
  export function setLocales(ui: string) {
    editorLocale = ui;
  }
  export function setMode(value: typeof editorMode) {
    editorMode = value;
  }
  let editor = $state<Editor>();
  export function undo() {
    editor?.undo();
  }
  export function redo() {
    editor?.redo();
  }
</script>

<Editor
  bind:this={editor}
  {onhistory}
  {...initialForm === undefined ? {} : { initialForm }}
  {documentId}
  {editorLocale}
  {formLocale}
  {editorMode}
  {onchange}
  {ondraft}
/>
