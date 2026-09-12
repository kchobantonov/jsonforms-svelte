<script lang="ts">
  import * as Resizable from "@jsonforms-svelte-shadcn-ui/resizable/index.js";
  import SchemaTree from "./components/SchemaTree.svelte";
  import { untrack } from "svelte";
  import EditorToolbar from "./components/EditorToolbar.svelte";
  import ComponentPalette from "./components/Palette.svelte";
  import CanvasNode from "./components/Canvas/CanvasNode.svelte";
  import PropertyPanel from "./components/Inspector/PropertyPanel.svelte";
  import SourcePanel from "./components/SourcePanel.svelte";
  import PreviewPanel from "./components/LivePreview.svelte";
  import { createSession } from "./document/history-store.svelte.js";
  import type { Document } from "./document/commands/index.js";
  import type { InitialForm } from "./document/types.js";
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
    onchange: (document: Document, revision: number) => void;
    ondraft: (dirty: boolean) => void;
  } = $props();
  const session = createSession(
    untrack(() => initialForm),
    (document, revision) => onchange(document, revision),
  );
  let source = $state(false),
    preview = $state(false),
    sourceMounted = $state(false),
    previewMounted = $state(false);
</script>

<section class="editor" data-mode={editorMode} aria-label="Form editor">
  <EditorToolbar
    {session}
    title={documentId}
    {source}
    {preview}
    ontoggleSource={() => {
      source = !source;
      sourceMounted = true;
    }}
    ontogglePreview={() => {
      preview = !preview;
      previewMounted = true;
    }}
  />
  {#if session.message}<p role="alert" class="notice">{session.message}</p>{/if}
  {#if session.locked}<p class="notice">
      Source has unapplied changes. Apply or revert to resume visual editing.
    </p>{/if}
  <div class="workspace resizable-workspace">
    <Resizable.PaneGroup direction="horizontal">
      <Resizable.Pane defaultSize={20} minSize={12}>
        <Resizable.PaneGroup direction="vertical">
          <Resizable.Pane defaultSize={45} minSize={15}
            ><div class="pane-scroll">
              <ComponentPalette {session} />
            </div></Resizable.Pane
          >
          <Resizable.Handle
            withHandle
            aria-label="Resize palette and schema tree"
          />
          <Resizable.Pane defaultSize={55} minSize={15}
            ><div class="pane-scroll">
              <SchemaTree {session} />
            </div></Resizable.Pane
          >
        </Resizable.PaneGroup>
      </Resizable.Pane>
      <Resizable.Handle withHandle aria-label="Resize schema tree and canvas" />
      <Resizable.Pane defaultSize={58} minSize={25}>
        <main class="pane-scroll">
          <div class="canvas-heading">
            <h2>Form designer</h2>
            <span class="badge">Select · Add · Drag to a layout</span>
          </div>
          <CanvasNode
            node={session.document.uischema}
            {session}
            mode={editorMode}
          />
          {#if sourceMounted}<SourcePanel
              {session}
              mode={editorMode}
              visible={source}
              {ondraft}
            />{/if}
          {#if previewMounted}<PreviewPanel
              document={session.document}
              mode={editorMode}
              visible={preview}
            />{/if}
        </main>
      </Resizable.Pane>
      <Resizable.Handle withHandle aria-label="Resize canvas and inspector" />
      <Resizable.Pane defaultSize={22} minSize={15}
        ><div class="pane-scroll">
          <PropertyPanel {session} />
        </div></Resizable.Pane
      >
    </Resizable.PaneGroup>
  </div>
</section>
