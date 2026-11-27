<script lang="ts">
  import type { Snippet, Component, ComponentProps } from 'svelte';
  import type { useExamplePage } from '../core/examplePage.svelte';
  import type { createDemoTranslator } from '../i18n/demo';
  import type { DemoMonacoEditorProps } from './demoMonaco';
  import DemoEditorHeading from './DemoEditorHeading.svelte';
  import DemoDataSplit from './DemoDataSplit.svelte';
  const {
    split,
    SplitPane,
    Pane,
    locale,
    overflow,
    webComponent,
    mode,
    active,
    translate,
    exampleForm,
    editors,
    MonacoEditor,
    editorButton,
    formClass,
    editorClass,
  }: Pick<ComponentProps<typeof DemoDataSplit>, 'SplitPane' | 'Pane' | 'locale'> & {
    split: boolean;
    overflow: boolean;
    webComponent: boolean;
    mode?: string;
    active: boolean;
    translate: ReturnType<typeof createDemoTranslator>;
    exampleForm: Snippet;
    editors: ReturnType<typeof useExamplePage>['editors'];
    MonacoEditor: Component<DemoMonacoEditorProps>;
    editorButton: ComponentProps<typeof DemoEditorHeading>['button'];
    formClass: string;
    editorClass: string;
  } = $props();
</script>

{#if split}
  <DemoDataSplit
    {SplitPane}
    {Pane}
    {locale}
    class={`mt-5 ${overflow ? 'overflow-visible' : ''}`}
    formPaneClass={`pe-4 ${overflow ? 'overflow-visible' : ''}`}
  >
    {#snippet form()}
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          {translate('editor.demo.label')}
        </h3>
      </div>
      <div class={`mt-4 ${formClass}`} class:overflow-visible={webComponent} data-mode={mode}>
        {@render exampleForm()}
      </div>
    {/snippet}
    {#snippet data()}
      <DemoEditorHeading
        level={3}
        title={translate('editor.data.label')}
        reloadLabel={translate('editor.data.reload')}
        applyLabel={translate('editor.data.apply')}
        onreload={() => editors.reload('data')}
        onapply={() => editors.apply('data')}
        button={editorButton}
      />
      <div class={`mt-4 ${editorClass}`}>
        {#if active}
          <MonacoEditor
            language="json"
            bind:value={editors.models.data}
            style="height: calc(100vh - 200px)"
            editorBeforeMount={editors.registerValidations}
          />
        {/if}
      </div>
    {/snippet}
  </DemoDataSplit>
{:else}
  <div class="mt-5 space-y-5">
    <section class={formClass} class:overflow-visible={webComponent} data-mode={mode}>
      {@render exampleForm()}
    </section>
  </div>
{/if}
