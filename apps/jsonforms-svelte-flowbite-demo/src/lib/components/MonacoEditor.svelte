<script lang="ts">
  import { useAppStore } from '$lib/store/index.svelte';
  import { onDestroy, onMount, tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import monaco, { type MonacoApi } from '../core/monaco';
  import { defineFlowbiteTheme } from '$lib/core/monaco-theme';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    value: monaco.editor.ITextModel | string | null;
    language?: string;
    editorBeforeMount?: (api: MonacoApi) => void;
  }

  let { value = $bindable(), language = $bindable(), editorBeforeMount, ...rest }: Props = $props();

  let container: HTMLElement | null = $state(null);
  let editor: monaco.editor.IStandaloneCodeEditor | null = null;
  let changeListener: monaco.IDisposable | null = null;
  let resizeObserver: ResizeObserver | null = null;
  const appStore = useAppStore();

  // Watch for theme changes
  $effect(() => {
    const isDark = appStore.dark.value;
    const themeColor = appStore.themeColor.value;
    if (editor) {
      const lightThemeName = `flowbite-light-${themeColor}`;
      const darkThemeName = `flowbite-dark-${themeColor}`;
      monaco.editor.defineTheme(lightThemeName, defineFlowbiteTheme(false));
      monaco.editor.defineTheme(darkThemeName, defineFlowbiteTheme(true));
      editor.updateOptions({
        theme: isDark ? darkThemeName : lightThemeName,
      });
    }
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

    const isDark = appStore.dark.value;
    const themeColor = appStore.themeColor.value;
    const lightThemeName = `flowbite-light-${themeColor}`;
    const darkThemeName = `flowbite-dark-${themeColor}`;

    // Define custom theme
    monaco.editor.defineTheme(lightThemeName, defineFlowbiteTheme(false));
    monaco.editor.defineTheme(darkThemeName, defineFlowbiteTheme(true));

    editor = monaco.editor.create(container, {
      useShadowDOM: true,
      fixedOverflowWidgets: false,

      value: typeof value === 'string' ? value : undefined,
      model: typeof value !== 'string' ? value : undefined,
      theme: isDark ? darkThemeName : lightThemeName,
      language: language,
    });

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
      editor?.getAction('editor.action.formatDocument')?.run();
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
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });
</script>

<div bind:this={container} {...rest}></div>
