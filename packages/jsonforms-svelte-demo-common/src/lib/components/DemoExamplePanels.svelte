<script lang="ts">
  import type { Component, ComponentProps, Snippet } from 'svelte';
  import type { useExamplePage } from '../core/examplePage.svelte';
  import DemoExampleHeading from './DemoExampleHeading.svelte';
  import DemoExamplePreview from './DemoExamplePreview.svelte';
  import DemoEditorPane from './DemoEditorPane.svelte';
  import ExternalEditor from './ExternalEditor.svelte';
  const editorKinds = ['schema', 'uischema', 'uischemas', 'i18n'] as const;
  const {
    model,
    Content,
    SplitPane,
    Pane,
    MonacoEditor,
    exampleForm,
    editorButton,
    button,
    formClass,
    editorClass,
    external,
  }: Pick<
    ComponentProps<typeof DemoExamplePreview>,
    | 'SplitPane'
    | 'Pane'
    | 'MonacoEditor'
    | 'exampleForm'
    | 'editorButton'
    | 'formClass'
    | 'editorClass'
  > & {
    model: ReturnType<typeof useExamplePage>;
    Content: Component<{ value: string; class: string; children: Snippet }>;
    button: ComponentProps<typeof DemoExampleHeading>['button'];
    external: boolean;
  } = $props();
</script>

{#snippet editorTab(kind: keyof typeof model.editors.models)}
  {@const tab = model.editors.tab(kind)}
  <Content value={tab.value} class="pt-5">
    <DemoEditorPane
      {kind}
      editors={model.editors}
      {MonacoEditor}
      {editorButton}
      active={model.activeTab === tab.value}
      frameClass={editorClass}
    />
  </Content>
{/snippet}

<Content
  value={model.tabValues.demo}
  class={`pt-5 ${model.previewProps.overflow ? 'overflow-visible' : ''}`}
>
  <DemoExampleHeading
    actions={model.currentExample?.actions}
    apply={model.applyExampleAction}
    {button}
  />
  <DemoExamplePreview
    {...model.previewProps}
    {SplitPane}
    {Pane}
    {exampleForm}
    {MonacoEditor}
    {editorButton}
    {formClass}
    {editorClass}
  />
</Content>
{#each editorKinds as kind (kind)}
  {@render editorTab(kind)}
{/each}
{#if external}
  <Content value={model.tabValues.external} class="pt-5">
    <ExternalEditor
      editor={MonacoEditor}
      frameClass={editorClass}
      editorClass="h-[calc(100vh-16rem)] min-h-[480px]"
      bind:value={model.externalModel}
      {...model.externalEditorProps}
      button={editorButton}
      onreload={model.reloadExternal}
    />
  </Content>
{/if}
{@render editorTab('config')}
{#if !model.previewProps.split}{@render editorTab('data')}{/if}
