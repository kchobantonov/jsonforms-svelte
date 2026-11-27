<script lang="ts">
  import { MediaQuery } from 'svelte/reactivity';
  import { defineFlowbiteTheme } from '$lib/core/monaco-theme';
  import { useAppStore } from '$lib/store/index.svelte';
  import {
    DemoMonacoEditor,
    monaco,
    type DemoMonacoEditorProps,
  } from '@chobantonov/jsonforms-svelte-demo-common';
  let { value = $bindable(), language = $bindable(), ...props }: DemoMonacoEditorProps = $props();
  const prefersDark = new MediaQuery('(prefers-color-scheme: dark)', false);
  const appStore = useAppStore();
  const isDarkMode = $derived(
    appStore.mode.value === 'dark' || (appStore.mode.value === 'system' && prefersDark.current),
  );

  function currentTheme() {
    const color = appStore.themeColor.value;
    const light = `flowbite-light-${color}`;
    const dark = `flowbite-dark-${color}`;
    monaco.editor.defineTheme(light, defineFlowbiteTheme(false));
    monaco.editor.defineTheme(dark, defineFlowbiteTheme(true));
    return isDarkMode ? dark : light;
  }
  const theme = {
    initial: currentTheme,
    refresh(editor: monaco.editor.IStandaloneCodeEditor) {
      editor.updateOptions({ theme: currentTheme() });
    },
  };
</script>

<DemoMonacoEditor bind:value bind:language {...props} {theme} />
