<script lang="ts">
  import type { JsonValue } from "../../document/types.js";
  import { untrack } from "svelte";
  import * as Resizable from "@jsonforms-svelte-shadcn-ui/resizable/index.js";
  import Button from "@jsonforms-svelte-shadcn-ui/button/button.svelte";
  import CanvasNode from "../Canvas/CanvasNode.svelte";
  import LivePreview from "../LivePreview.svelte";
  import CollapsiblePane from "./CollapsiblePane.svelte";
  import FormLanguages from "./FormLanguages.svelte";
  import FormLanguageSelect from "./FormLanguageSelect.svelte";
  import PanelHeading from "./PanelHeading.svelte";
  import DataPanel from "./DataPanel.svelte";
  import { clone, object } from "../../document/commands/index.js";
  import type { EditorSession } from "../../document/history-store.svelte.js";
  let {
    session,
    mode,
    view,
    viewRevision,
  }: {
    session: EditorSession;
    mode: string;
    view: "design" | "validate" | "json";
    viewRevision: number;
  } = $props();
  const initialDataPaneSize = 35;
  let preview = $state(false),
    input = $state(false),
    output = $state(false);
  let inputMounted = $state(false),
    outputMounted = $state(false);
  $effect(() => {
    viewRevision;
    if (view !== "json") {
      preview = input = output = view === "validate";
      if (view === "validate") inputMounted = outputMounted = true;
    }
  });
  let inputData = $state<JsonValue>(
    clone(
      untrack(() =>
        session.document.data === undefined ? {} : session.document.data,
      ),
    ),
  );
  let outputData = $state<JsonValue>(clone(untrack(() => inputData)));
  $effect(() => { session.previewData = outputData; });
  $effect(() => {
    const data =
      session.document.data === undefined ? {} : session.document.data;
    inputData = clone(data);
    outputData = clone(data);
  });
</script>

<div class="design-workspace">
  <Resizable.PaneGroup direction="horizontal">
    <Resizable.Pane defaultSize={55} minSize={25}>
      <div class="workspace-column">
        <Resizable.PaneGroup
          direction="vertical"
          class="workspace-column-group"
        >
          <Resizable.Pane defaultSize={65} minSize={20}>
            <main class="pane-scroll designer-pane">
              <PanelHeading title="Form Definition"
                ><FormLanguages {session} /></PanelHeading
              >
              <div class="design-sheet">
                <CanvasNode node={session.layout} {session} {mode} />
              </div>
            </main>
          </Resizable.Pane>
          {#if preview && input}<Resizable.Handle
              withHandle
              aria-label="Resize designer and form input"
            />{/if}
          <CollapsiblePane
            visible={preview && input}
            size={initialDataPaneSize}
          >
            {#if inputMounted}<DataPanel
                title="Form Input"
                oncollapse={() => (input = false)}
                value={inputData}
                schema={object(session.document.schema)}
                {mode}
                onchange={(value) => {
                  inputData = clone(value);
                  outputData = clone(value);
                }}
              />{/if}
          </CollapsiblePane>
        </Resizable.PaneGroup>
        {#if preview && !input && view === "validate"}<PanelHeading
            title="Form Input"
            onexpand={() => (input = true)}
          />{/if}
      </div>
    </Resizable.Pane>
    {#if preview}<Resizable.Handle
        withHandle
        aria-label="Resize designer and preview"
      />{/if}
    <CollapsiblePane visible={preview} size={45}>
      <div class="workspace-column">
        <Resizable.PaneGroup
          direction="vertical"
          class="workspace-column-group"
        >
          <Resizable.Pane defaultSize={65} minSize={20}>
            <div class="workspace-panel">
              <PanelHeading
                title="Form Preview"
                collapseDirection="right"
                oncollapse={() => (preview = false)}
                ><FormLanguageSelect
                  translations={session.document.translations}
                /></PanelHeading
              >
              <div class="pane-scroll preview-content">
                <LivePreview
                  document={session.document}
                  {mode}
                  visible={preview}
                  bind:data={outputData}
                />
              </div>
            </div>
          </Resizable.Pane>
          {#if output}<Resizable.Handle
              withHandle
              aria-label="Resize preview and form output"
            />{/if}
          <CollapsiblePane visible={output} size={initialDataPaneSize}>
            {#if outputMounted}<DataPanel
                title="Form Output"
                oncollapse={() => (output = false)}
                value={outputData}
                schema={object(session.document.schema)}
                {mode}
                readonly
              />{/if}
          </CollapsiblePane>
        </Resizable.PaneGroup>
        {#if !output && view === "validate"}<PanelHeading
            title="Form Output"
            onexpand={() => (output = true)}
          />{/if}
      </div>
    </CollapsiblePane>
  </Resizable.PaneGroup>
  {#if !preview && view === "validate"}<Button
      variant="ghost"
      class="preview-rail"
      aria-label="Show form preview"
      onclick={() => (preview = true)}>Form Preview</Button
    >{/if}
</div>
