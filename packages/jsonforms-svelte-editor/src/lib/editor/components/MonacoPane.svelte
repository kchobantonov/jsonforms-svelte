<script lang="ts">
  import { onMount } from "svelte";
  import * as monaco from "monaco-editor";
  import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
  import css from "monaco-editor/min/vs/editor/editor.main.css?inline";
  let {
    value,
    sync = true,
    language = "json",
    schema,
    mode,
    onchange,
  }: {
    value: string;
    sync?: boolean;
    language?: string;
    schema: Record<string, unknown>;
    mode: string;
    onchange: (value: string) => void;
  } = $props();
  let container: HTMLDivElement,
    editor: monaco.editor.IStandaloneCodeEditor | undefined;
  let model: monaco.editor.ITextModel | undefined;
  let syncing = false;
  const uri = monaco.Uri.parse(
    `inmemory://form-editor/${crypto.randomUUID()}/source.json`,
  );
  onMount(() => {
    const workers: Worker[] = [];
    const previous = self.MonacoEnvironment;
    // One shared browser worker factory; each language-service client owns its models.
    if (!previous)
      self.MonacoEnvironment = {
        getWorker: (_, label) => {
          const worker =
            label === "json" ? new JsonWorker() : new EditorWorker();
          workers.push(worker);
          return worker;
        },
      };
    model = monaco.editor.createModel(value, language, uri);
    editor = monaco.editor.create(container, {
      model,
      automaticLayout: true,
      minimap: { enabled: false },
      // Monaco 0.55 can reject a pending word-highlight task on unmount.
      // Completion/validation remain enabled; avoid that optional background task.
      occurrencesHighlight: "off",
      scrollBeyondLastLine: false,
      fontSize: 13,
      fixedOverflowWidgets: false,
    });
    const subscription = model.onDidChangeContent(() => {
      if (!syncing) onchange(model!.getValue());
    });
    const media = matchMedia("(prefers-color-scheme: dark)");
    const theme = () =>
      editor?.updateOptions({
        theme:
          mode === "dark" || (mode === "system" && media.matches)
            ? "vs-dark"
            : "vs",
      });
    theme();
    media.addEventListener("change", theme);
    return () => {
      subscription.dispose();
      editor?.dispose();
      model?.dispose();
      media.removeEventListener("change", theme);
      const defaults = monaco.json.jsonDefaults;
      defaults.setDiagnosticsOptions({
        ...defaults.diagnosticsOptions,
        schemas: defaults.diagnosticsOptions.schemas?.filter(
          (s) => s.uri !== uri.toString() + "../../components/editor/.schema",
        ),
      });
      // Monaco shares workers across live models; do not terminate shared workers here.
    };
  });
  $effect(() => {
    const next = value;
    if (sync && model && model.getValue() !== next) {
      syncing = true;
      model.setValue(next);
      syncing = false;
    }
  });
  $effect(() => {
    const defaults = monaco.json.jsonDefaults;
    defaults.setDiagnosticsOptions({
      ...defaults.diagnosticsOptions,
      validate: true,
      enableSchemaRequest: false,
      schemas: [
        ...(defaults.diagnosticsOptions.schemas ?? []).filter(
          (s) => s.uri !== uri.toString() + "../../components/editor/.schema",
        ),
        {
          uri: uri.toString() + "../../components/editor/.schema",
          fileMatch: [uri.toString()],
          schema,
        },
      ],
    });
  });
  $effect(() => {
    editor?.updateOptions({
      theme:
        mode === "dark" ||
        (mode === "system" &&
          matchMedia("(prefers-color-scheme: dark)").matches)
          ? "vs-dark"
          : "vs",
    });
  });
</script>

<svelte:element this={"style"}>{css}</svelte:element>
<div
  class="monaco-source"
  bind:this={container}
  style="height: 400px; text-align: left;"
></div>
