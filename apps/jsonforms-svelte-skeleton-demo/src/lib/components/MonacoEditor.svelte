<script lang="ts">
  import { defineSkeletonDemoTheme } from '$lib/core/monaco-theme';
  import { useAppStore } from '$lib/store/index.svelte';
  import {
    DemoMonacoEditor,
    demoEditorTheme,
    type DemoMonacoEditorProps,
  } from '@chobantonov/jsonforms-svelte-demo-common';
  let { value = $bindable(), language = $bindable(), ...props }: DemoMonacoEditorProps = $props();
  const appStore = useAppStore();
  const theme = demoEditorTheme(
    'skeleton',
    () => appStore.theme.value,
    () => appStore.mode.value,
    defineSkeletonDemoTheme,
  );
</script>

<DemoMonacoEditor bind:value bind:language {...props} {theme} />
