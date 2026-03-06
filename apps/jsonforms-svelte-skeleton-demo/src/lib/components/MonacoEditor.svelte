<script lang="ts">
  import { useAppStore } from '$lib/store/index.svelte';
  import { onDestroy, onMount, tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import monaco, { type MonacoApi } from '../core/monaco';
  import { defineSkeletonDemoTheme } from '$lib/core/monaco-theme';

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

  const nextFrame = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

  const systemPrefersDark = $derived.by(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  const effectiveDark = $derived.by(
    () => appStore.mode.value === 'dark' || (appStore.mode.value === 'system' && systemPrefersDark),
  );

  async function refreshEditorTheme() {
    if (!editor) return;

    const isDark = effectiveDark;
    const themeName = appStore.theme.value;
    const lightThemeName = `skeleton-demo-light-${themeName}`;
    const darkThemeName = `skeleton-demo-dark-${themeName}`;

    // Wait for layout/theme effects to update document attributes and CSS vars.
    await tick();
    await nextFrame();

    monaco.editor.defineTheme(lightThemeName, defineSkeletonDemoTheme(false));
    monaco.editor.defineTheme(darkThemeName, defineSkeletonDemoTheme(true));
    monaco.editor.setTheme(isDark ? darkThemeName : lightThemeName);
  }

  // Watch for theme changes
  $effect(() => {
    appStore.theme.value;
    appStore.mode.value;
    effectiveDark;
    refreshEditorTheme();
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
      useShadowDOM: true,
      fixedOverflowWidgets: false,

      value: typeof value === 'string' ? value : undefined,
      model: typeof value !== 'string' ? value : undefined,
      theme: 'vs',
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
      refreshEditorTheme();
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
