<script lang="ts">
  import type { Component, ComponentProps } from 'svelte';
  import type { useExamplePage } from '../core/examplePage.svelte';
  import type { DemoMonacoEditorProps } from './demoMonaco';
  import DemoEditorHeading from './DemoEditorHeading.svelte';
  type Editors = ReturnType<typeof useExamplePage>['editors'];
  const {
    kind,
    editors,
    active,
    frameClass,
    MonacoEditor,
    editorButton,
  }: {
    kind: keyof Editors['models'];
    editors: Editors;
    active: boolean;
    frameClass: string;
    MonacoEditor: Component<DemoMonacoEditorProps>;
    editorButton: ComponentProps<typeof DemoEditorHeading>['button'];
  } = $props();
  const tab = $derived(editors.tab(kind));
</script>

<div class="space-y-4">
  <DemoEditorHeading
    title={tab.label}
    reloadLabel={tab.reloadLabel}
    applyLabel={tab.applyLabel}
    onreload={() => editors.reload(kind)}
    onapply={() => editors.apply(kind)}
    button={editorButton}
  />
  <div class={frameClass}>
    {#if active}
      <MonacoEditor
        language="json"
        bind:value={editors.models[kind]}
        class="h-[calc(100vh-16rem)] min-h-[480px]"
        editorBeforeMount={editors.registerValidations}
      />
    {/if}
  </div>
</div>
