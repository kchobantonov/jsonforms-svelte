<script lang="ts">
  import { formLanguages } from "./i18n/form-languages.js";
  import * as ScrollArea from "@jsonforms-svelte-shadcn-ui/scroll-area/index.js";
  import * as Resizable from "@jsonforms-svelte-shadcn-ui/resizable/index.js";
  import { editorPortalTarget } from "./portal-context.js";
  import { createTheme } from "./theme/theme-context.svelte.js";
  import SchemaTree from "./components/SchemaTree.svelte";
  import { untrack, setContext } from "svelte";
  import Toggle from "@jsonforms-svelte-shadcn-ui/toggle/toggle.svelte";
  import * as ToggleGroup from "@jsonforms-svelte-shadcn-ui/toggle-group/index.js";
  import { provideEditorI18n, type EditorMessages } from "./i18n/context.js";
  import SourcePanel from "./components/SourcePanel.svelte";
  import ComponentPalette from "./components/Palette.svelte";
  import DesignWorkspace from "./components/workspace/DesignWorkspace.svelte";
  import PropertyPanel from "./components/Inspector/PropertyPanel.svelte";
  import { createSession } from "./document/history-store.svelte.js";
  import type { Document } from "./document/commands/index.js";
  import type { InitialForm } from "./document/types.js";
  let {
    initialForm,
    editorLocale = "en",
    formLocale = "en",
    editorMessages = {},
    editorMode,
    onchange,
    ondraft,
    onhistory = () => {},
  }: {
    initialForm: InitialForm;
    editorLocale?: string;
    formLocale?: string;
    editorMessages?: EditorMessages;
    editorMode: "light" | "dark" | "system";
    onchange: (document: Document, revision: number) => void;
    ondraft: (dirty: boolean) => void;
    onhistory?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  } = $props();
  const session = createSession(
    untrack(() => initialForm),
    (document, revision) => onchange(document, revision),
  );
  let selectedFormLocale = $state(untrack(() => formLocale));
  $effect(() => {
    selectedFormLocale = formLocale;
  });
  const supportedLocales = $derived(
    formLanguages(session.document.translations),
  );
  const i18n = provideEditorI18n(
    () => editorLocale,
    () => editorMessages,
    () =>
      supportedLocales.includes(selectedFormLocale)
        ? selectedFormLocale
        : (supportedLocales[0] ?? formLocale),
    (locale) => {
      selectedFormLocale = locale;
    },
  );
  const theme = createTheme(() => editorMode);
  let root = $state<HTMLElement>();
  setContext(editorPortalTarget, () => root);
  let visualView = $state<"design" | "validate">("design");
  let json = $state(false);
  const view = $derived(json ? "json" : visualView);
  let sourceMounted = $state(false);
  let viewRevision = $state(0);
  export function undo() {
    session.undo();
  }
  export function redo() {
    session.undo(true);
  }
  $effect(() => { ondraft(session.locked); });
  $effect(() =>
    onhistory({ canUndo: session.canUndo, canRedo: session.canRedo }),
  );
</script>

<section
  bind:this={root}
  class="editor"
  class:dark={theme.dark}
  data-mode={editorMode}
  aria-label={i18n.t("Form editor")}
>
  {#if session.message}<p role="alert" class="notice">{session.message}</p>{/if}
  {#if session.locked}<p class="notice">
      {i18n.t(
        session.ruleDraftActive ? "Rule has unapplied changes. Apply or revert to resume visual editing." : "Source has unapplied changes. Apply or revert to resume visual editing.",
      )}
    </p>{/if}
  <div class="workspace resizable-workspace" hidden={view === "json"}>
    <Resizable.PaneGroup direction="horizontal">
      <Resizable.Pane defaultSize={20} minSize={12}>
        <Resizable.PaneGroup direction="vertical">
          <Resizable.Pane defaultSize={45} minSize={15}
            ><ScrollArea.Root
              class="pane-scroll"
              type="auto"
              orientation="both"
            >
              <ComponentPalette {session} />
            </ScrollArea.Root></Resizable.Pane
          >
          <Resizable.Handle
            withHandle
            aria-label="Resize palette and schema tree"
          />
          <Resizable.Pane defaultSize={55} minSize={15}
            ><ScrollArea.Root
              class="pane-scroll"
              type="auto"
              orientation="both"
            >
              <SchemaTree {session} />
            </ScrollArea.Root></Resizable.Pane
          >
        </Resizable.PaneGroup>
      </Resizable.Pane>
      <Resizable.Handle withHandle aria-label="Resize schema tree and canvas" />
      <Resizable.Pane defaultSize={58} minSize={25}>
        <div class="workspace-center">
          <DesignWorkspace {session} mode={editorMode} {view} {viewRevision} />
        </div>
      </Resizable.Pane>
      <Resizable.Handle withHandle aria-label="Resize canvas and inspector" />
      <Resizable.Pane defaultSize={22} minSize={15}
        ><ScrollArea.Root class="pane-scroll" type="auto" orientation="both">
          <PropertyPanel {session} mode={editorMode} />
        </ScrollArea.Root></Resizable.Pane
      >
    </Resizable.PaneGroup>
  </div>
  <div class="workspace-panel json-workspace" hidden={view !== "json"}>
    {#if sourceMounted}<SourcePanel
        {session}
        mode={editorMode}
        visible={view === "json"}
        {ondraft}
      />{/if}
  </div>
  <nav class="workspace-statusbar" aria-label={i18n.t("Editor views")}>
    <Toggle
      pressed={json}
      onPressedChange={(value) => {
        if (session.ruleDraftActive) return;
        sourceMounted = true;
        json = value;
      }}>{i18n.t("JSON Model")}</Toggle
    >
    <span class="view-spacer"></span>
    <ToggleGroup.Root
      type="single"
      bind:value={
        () => visualView,
        (value) => {
          if (value === "design" || value === "validate") visualView = value;
        }
      }
      aria-label={i18n.t("Editor views")}
    >
      <ToggleGroup.Item
        value="design"
        onclick={() => {
          json = false;
        }}>{i18n.t("Design")}</ToggleGroup.Item
      >
      <ToggleGroup.Item
        value="validate"
        onclick={() => {
          json = false;
          viewRevision++;
        }}>{i18n.t("Validate")}</ToggleGroup.Item
      >
    </ToggleGroup.Root>
  </nav>
</section>
