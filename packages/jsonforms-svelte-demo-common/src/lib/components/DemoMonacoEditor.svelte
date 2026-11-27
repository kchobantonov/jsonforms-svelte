<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import monaco from '../core/monaco';
  import type { DemoMonacoEditorProps } from './demoMonaco';
  interface DemoEditorTheme {
    initial?(): string;
    refresh(editor: monaco.editor.IStandaloneCodeEditor): void | Promise<void>;
  }
  let {
    value = $bindable(),
    language = $bindable(),
    editorBeforeMount,
    theme,
    ...rest
  }: DemoMonacoEditorProps & { theme: DemoEditorTheme } = $props();

  let container: HTMLElement | null = $state(null);
  let editor = $state.raw<monaco.editor.IStandaloneCodeEditor | null>(null);
  let ownedModel: monaco.editor.ITextModel | null = null;
  let changeListener: monaco.IDisposable | null = null;
  let resizeObserver: ResizeObserver | null = null;
  $effect(() => {
    const update = theme.refresh;
    if (editor) void update(editor);
  });

  // Watch for value changes
  $effect(() => {
    const newValue = value;
    if (!editor) return;

    if (typeof newValue === 'string') {
      if (newValue !== editor.getValue()) {
        editor.setValue(newValue || '');
      }
    } else {
      if (newValue !== editor.getModel()) {
        editor.setModel(newValue ?? null);
      }
    }
  });

  // Watch for language changes
  $effect(() => {
    if (!editor || !language) return;

    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }
  });

  onMount(() => {
    if (!container) return;

    editorBeforeMount?.(monaco);

    editor = monaco.editor.create(container, {
      ariaLabel: rest['aria-label'] ?? undefined,
      useShadowDOM: true,
      fixedOverflowWidgets: false,
      // Monaco 0.55.1's WordHighlighter leaves delayed work unhandled when
      // tab navigation disposes an editor. Use its public opt-out here.
      occurrencesHighlight: 'off',

      value: typeof value === 'string' ? value : undefined,
      model: typeof value !== 'string' ? value : undefined,
      theme: theme.initial?.() ?? 'vs',
      language: language,
    });

    // String-backed editors own their model; supplied workspace models stay with the host.
    ownedModel = typeof value === 'string' ? editor.getModel() : null;
    changeListener = editor.onDidChangeModelContent(() => {
      if (!editor) return;

      if (typeof value === 'string') {
        value = editor.getValue();
      } else {
        value = editor.getModel();
      }
    });

    tick().then(() => {
      editor?.layout();
    });

    resizeObserver = new ResizeObserver(() => {
      tick().then(() => {
        editor?.layout();
      });
    });

    resizeObserver.observe(container);
  });

  onDestroy(() => {
    if (changeListener) {
      changeListener.dispose();
    }
    if (editor) {
      editor.dispose();
      editor = null;
      ownedModel?.dispose();
      ownedModel = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });
</script>

<div bind:this={container} {...rest}></div>
