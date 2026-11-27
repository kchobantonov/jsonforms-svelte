<script lang="ts">
  import { defineShadcnDemoTheme } from '$shadcnDemo/monaco-theme';
  import { useAppStore } from '$lib/store/index.svelte';
  import {
    DemoMonacoEditor,
    demoEditorTheme,
    type DemoMonacoEditorProps,
  } from '@chobantonov/jsonforms-svelte-demo-common';
  let { value = $bindable(), language = $bindable(), ...props }: DemoMonacoEditorProps = $props();
  const appStore = useAppStore();
  const theme = demoEditorTheme(
    'shadcn',
    () => appStore.theme.value,
    () => appStore.mode.value,
    defineShadcnDemoTheme,
  );
</script>

<DemoMonacoEditor bind:value bind:language {...props} {theme} />
